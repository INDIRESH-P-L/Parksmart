-- ============================================================================
-- ParkSmart — Row Level Security (run THIRD, after triggers.sql).
--
-- Defense in depth: the Express API talks to Supabase with the SERVICE ROLE
-- key, which bypasses RLS by design — authorization for API traffic is
-- enforced in middleware (auth.js / admin.js). These policies exist so that:
--   1. the public anon key exposes nothing sensitive if used directly
--      (e.g. a future realtime subscription from the browser), and
--   2. Supabase-Auth sessions (auth.uid()) map cleanly if auth ever moves
--      into Supabase itself.
-- With custom-JWT auth, auth.uid() is null for anon-key requests, so every
-- "own row" policy correctly evaluates to false → deny.
-- ============================================================================

alter table users          enable row level security;
alter table parking_slots  enable row level security;
alter table bookings       enable row level security;
alter table notifications  enable row level security;
alter table feedback       enable row level security;
alter table favorites      enable row level security;

-- ── helpers ──────────────────────────────────────────────────────────────────
-- SECURITY DEFINER + pinned search_path: these run as the function owner so
-- they can read `users` without recursively triggering the users policies.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from users where id = auth.uid() and role in ('admin', 'operator')
  );
$$;

-- ── users: read/update own row; admins see everything ───────────────────────
create policy users_select_own on users
  for select using (id = auth.uid() or is_admin());

create policy users_update_own on users
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- No insert/delete policies: registration and account removal go through the
-- API (service role) only.

-- ── parking_slots: publicly readable, writable only by admins ────────────────
create policy slots_public_read on parking_slots
  for select using (true);

create policy slots_admin_insert on parking_slots
  for insert with check (is_admin());

create policy slots_admin_update on parking_slots
  for update using (is_admin()) with check (is_admin());

create policy slots_admin_delete on parking_slots
  for delete using (is_admin());

-- ── bookings: own rows; staff (admin/operator) may read+update for gate ops ──
create policy bookings_select_own on bookings
  for select using (user_id = auth.uid() or is_staff());

create policy bookings_insert_own on bookings
  for insert with check (user_id = auth.uid());

create policy bookings_update_own on bookings
  for update using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

-- ── notifications: own rows; only admins create (announcements) ──────────────
create policy notifications_select_own on notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_admin_insert on notifications
  for insert with check (is_admin());

-- ── feedback: write your own; read your own (admins read all) ────────────────
create policy feedback_insert_own on feedback
  for insert with check (user_id = auth.uid());

create policy feedback_select_own on feedback
  for select using (user_id = auth.uid() or is_admin());

-- ── favorites: entirely private per user ─────────────────────────────────────
create policy favorites_all_own on favorites
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
