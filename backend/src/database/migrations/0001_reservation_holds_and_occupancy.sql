-- ============================================================================
-- 0001 — Reservation holds, occupancy-column reconciliation, sweep indexes.
--
-- Run once in the Supabase SQL editor, on top of the schema.sql baseline.
-- Every statement is idempotent (if not exists / or replace), so re-running is
-- harmless.
--
-- Covers three things:
--   1. Columns the application already writes but that were missing from
--      schema.sql (occupied_by, occupied_by_name, check_in_time). Without these
--      the existing check-in flow fails against real Supabase.
--   2. The new reservation-hold columns (reserved_by, reserved_until).
--   3. Making sync_slot_status() hold-aware so a booking write can no longer
--      clobber an unrelated active hold.
-- ============================================================================

-- ── 1) occupancy columns (reconciles schema.sql with what the code writes) ────
alter table parking_slots
  add column if not exists occupied_by uuid references users(id) on delete set null;
alter table parking_slots
  add column if not exists occupied_by_name text;
alter table parking_slots
  add column if not exists check_in_time timestamptz;

-- ── 2) reservation hold ──────────────────────────────────────────────────────
alter table parking_slots
  add column if not exists reserved_by uuid references users(id) on delete set null;
alter table parking_slots
  add column if not exists reserved_until timestamptz;

-- Sweep-job support. Partial indexes: only rows a sweep can match are indexed.
create index if not exists idx_parking_slots_reserved_until
  on parking_slots(reserved_until) where status = 'reserved';
create index if not exists idx_parking_slots_check_in_time
  on parking_slots(check_in_time) where status = 'occupied';

-- ── 3) hold-aware slot-status sync ───────────────────────────────────────────
-- The original trigger recomputed a slot's status purely from its bookings.
-- A reservation hold has no booking row, so any booking write touching the same
-- slot would reset an active hold back to 'available' and let someone else take
-- a slot another user is currently holding.
--
-- The guard below short-circuits when the slot carries a hold that has not yet
-- expired, leaving 'reserved' intact. Expired holds fall through to the normal
-- booking-derived logic, so a stale hold can never pin a slot forever.
create or replace function public.sync_slot_status()
returns trigger
language plpgsql
as $$
declare
  target_status text;
  held_until timestamptz;
begin
  select reserved_until into held_until
  from parking_slots
  where id = new.slot_id;

  -- Active hold wins: leave the slot 'reserved' and let the hold expire on its
  -- own terms (lazy check at read/write time, or the sweep job).
  if held_until is not null and held_until > now() then
    return new;
  end if;

  if new.status in ('pending', 'confirmed') and new.check_in_time is null then
    target_status := 'reserved';

  elsif new.status = 'active'
     or (new.check_in_time is not null and new.check_out_time is null
         and new.status not in ('completed', 'cancelled')) then
    target_status := 'occupied';

  else
    select case
      when exists (
        select 1 from bookings b
        where b.slot_id = new.slot_id and b.id <> new.id and b.status = 'active'
      ) then 'occupied'
      when exists (
        select 1 from bookings b
        where b.slot_id = new.slot_id and b.id <> new.id
          and b.status in ('pending', 'confirmed')
      ) then 'reserved'
      else 'available'
    end
    into target_status;
  end if;

  update parking_slots set status = target_status where id = new.slot_id;
  return new;
end;
$$;
