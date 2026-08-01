-- ============================================================
-- ParkSmart — Full schema + seed for Sri Eshwar College of Engineering
-- Run this file in Supabase SQL Editor OR via psql:
--   psql "postgresql://..." -f full-setup.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────
create table if not exists users (
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

create table if not exists parking_slots (
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
  occupied_by uuid references users(id) on delete set null,
  occupied_by_name text,
  check_in_time timestamptz,
  -- Short-lived reservation hold — see schema.sql for the full rationale.
  reserved_by uuid references users(id) on delete set null,
  reserved_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slot_id uuid references parking_slots(id) on delete cascade,
  booking_time timestamptz not null default now(),
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

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slot_id uuid references parking_slots(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, slot_id)
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_parking_slots_status on parking_slots(status);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_slot_id on bookings(slot_id);

-- ── Seed: Parking Slots (Sri Eshwar College of Engineering) ──
insert into parking_slots (slot_number,latitude,longitude,status,type,floor,zone_name,slot_type,hourly_rate,is_active) values
  ('SE-M01',10.8272,76.9938,'available','open','Ground','Mechanical Block','standard',0,true),
  ('SE-M02',10.8272,76.9940,'available','open','Ground','Mechanical Block','standard',0,true),
  ('SE-M03',10.8273,76.9939,'available','open','Ground','Mechanical Block','ev',0,true),
  ('SE-M04',10.8273,76.9941,'available','open','Ground','Mechanical Block','disability',0,true),
  ('SE-C01',10.8269,76.9945,'available','covered','P1','CSE & IT Block','standard',0,true),
  ('SE-C02',10.8269,76.9947,'available','covered','P1','CSE & IT Block','ev',0,true),
  ('SE-C03',10.8270,76.9946,'available','covered','P2','CSE & IT Block','standard',0,true),
  ('SE-C04',10.8270,76.9948,'reserved','covered','P2','CSE & IT Block','vip',0,true),
  ('SE-A01',10.8263,76.9940,'available','covered','Ground','Admin & Library Block','disability',0,true),
  ('SE-A02',10.8263,76.9942,'available','covered','Ground','Admin & Library Block','standard',0,true),
  ('SE-A03',10.8264,76.9941,'available','covered','P1','Admin & Library Block','vip',0,true),
  ('SE-A04',10.8264,76.9943,'available','covered','P1','Admin & Library Block','standard',0,true),
  ('SE-AU01',10.8258,76.9947,'available','open','Ground','Auditorium Block','standard',0,true),
  ('SE-AU02',10.8258,76.9949,'available','open','Ground','Auditorium Block','standard',0,true),
  ('SE-AU03',10.8259,76.9948,'available','open','Ground','Auditorium Block','ev',0,true),
  ('SE-SP01',10.8275,76.9948,'available','open','Ground','Sports Complex','standard',0,true),
  ('SE-SP02',10.8275,76.9950,'available','open','Ground','Sports Complex','standard',0,true),
  ('SE-SP03',10.8276,76.9949,'available','open','Ground','Sports Complex','standard',0,true)
on conflict (slot_number) do nothing;

-- ── Seed: Users (bcrypt passwords pre-hashed) ────────────────
-- admin@sece.ac.in  → Admin@123
-- operator@sece.ac.in → Operator@123
-- user@sece.ac.in   → User@123
insert into users (name,email,password,role,phone_number,vehicle_number) values
  ('SECE Admin','admin@sece.ac.in','$2b$12$cqTMzQCYSdrYaJY9UP3kj.REMsXnOWNakJUrttvBt4SE7ry4h32t6','admin','+91 98765 43210',null),
  ('Gate Operator','operator@sece.ac.in','$2b$12$aMEylzYtL7g9r6R4YOTT2ef.A0nPuq6QnLkfDjf3eo.S4eowPWVwq','operator','+91 98765 43211',null),
  ('Eshwar User','user@sece.ac.in','$2b$12$aBlecKcrsmRhEWgGL.3hG.3fYdpCKJh//Bs9wxp3KCDwwXKErveQ.','user','+91 98765 43212','TN-37-AB-1234')
on conflict (email) do nothing;
