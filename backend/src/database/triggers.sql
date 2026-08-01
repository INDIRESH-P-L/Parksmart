-- ============================================================================
-- ParkSmart — triggers (run SECOND, after schema.sql and BEFORE seed.sql so
-- seeded bookings sync their slots on insert).
-- ============================================================================

-- ── 1) updated_at auto-touch ─────────────────────────────────────────────────
-- Applied to every table that has the column, so updated_at can never drift
-- from reality regardless of which code path wrote the row.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_users_touch_updated_at
  before update on users
  for each row execute function public.touch_updated_at();

create trigger trg_parking_slots_touch_updated_at
  before update on parking_slots
  for each row execute function public.touch_updated_at();

create trigger trg_bookings_touch_updated_at
  before update on bookings
  for each row execute function public.touch_updated_at();

-- ── 2) slot status ⇄ booking lifecycle sync ──────────────────────────────────
-- Whenever a booking's status or check-in/out stamps change, recompute the
-- linked slot's status so it can NEVER drift out of sync with its bookings:
--
--   pending/confirmed (not checked in yet) → slot 'reserved'
--   active / checked-in (not checked out)  → slot 'occupied'
--   completed/cancelled                    → slot freed, UNLESS another open
--     booking still holds it — then the strongest remaining claim wins
--     (an active booking beats a merely-confirmed one).
--
-- Reservation holds (parking_slots.reserved_until) are NOT booking-derived, so
-- an unexpired hold short-circuits this function entirely — otherwise any
-- booking write on the same slot would wipe a hold another user is relying on.
-- Expired holds fall through to the normal logic below.
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
    -- This booking released its claim — derive status from remaining OPEN
    -- bookings on the same slot (there may be a future confirmed booking).
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

create trigger trg_bookings_sync_slot_status
  after insert or update of status, check_in_time, check_out_time on bookings
  for each row execute function public.sync_slot_status();
