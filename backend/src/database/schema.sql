-- ============================================================================
-- ParkSmart — canonical schema snapshot (run FIRST, once, in the Supabase SQL
-- editor). Run order: schema.sql → triggers.sql → rls_policies.sql → seed.sql
-- Future incremental changes go in database/migrations/ — this file stays the
-- single source of truth for the baseline shape.
-- ============================================================================

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  role text not null default 'user' check (role in ('user','admin','operator')),
  phone_number text,
  vehicle_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table parking_slots (
  id uuid primary key default gen_random_uuid(),
  slot_number text unique not null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'available' check (status in ('available','occupied','reserved')),
  type text not null check (type in ('covered','open')),
  floor text,
  zone_name text,
  slot_type text check (slot_type in ('standard','ev','disability','vip')) default 'standard',
  hourly_rate numeric(6,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slot_id uuid references parking_slots(id) on delete cascade,
  booking_time timestamptz not null,
  start_time timestamptz,
  end_time timestamptz,
  check_in_time timestamptz,
  check_out_time timestamptz,
  total_price numeric(8,2) default 0,
  qr_code_url text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','active','completed','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slot_id uuid references parking_slots(id) on delete set null,
  message text not null,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slot_id uuid references parking_slots(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, slot_id)
);

create index if not exists idx_parking_slots_status on parking_slots(status);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_slot_id on bookings(slot_id);
