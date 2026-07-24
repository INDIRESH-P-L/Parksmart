-- ============================================================================
-- ParkSmart — demo seed (run FOURTH, after schema/triggers/rls).
--
-- Sample campus: "Evergreen Institute of Technology" (fictional), centred
-- around 12.9716 N, 77.5946 E. 18 slots across 6 zones, 4 demo accounts, and
-- ~10 bookings spread over the past week so the dashboard, My Bookings and
-- analytics charts are populated on first run.
--
-- Passwords are hashed IN the database via pgcrypto's crypt(..., gen_salt('bf', 12)),
-- which produces standard $2a$ bcrypt hashes — fully compatible with the API's
-- node bcrypt.compare(). Demo credentials:
--   admin@parksmart.dev    / Admin@123     (admin)
--   operator@parksmart.dev / Operator@123  (operator — gate staff)
--   user@parksmart.dev     / User@123      (user)
--   driver@parksmart.dev   / Driver@123    (user)
--
-- Intended to run ONCE on a fresh schema. Users/slots are guarded with
-- ON CONFLICT DO NOTHING; re-running would still duplicate bookings.
-- NOTE: the triggers.sql sync trigger fires on the booking inserts below —
-- that is intentional: it flips LB-03 to 'occupied' (active booking) and
-- NG-03 to 'reserved' (upcoming confirmed booking).
-- ============================================================================

-- ── parking slots ────────────────────────────────────────────────────────────
insert into parking_slots
  (slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate, is_active)
values
  -- North Gate — open-air, ground level
  ('NG-01', 12.97492, 77.59310, 'available', 'open',    'Ground', 'North Gate',     'standard',   20.00, true),
  ('NG-02', 12.97488, 77.59338, 'available', 'open',    'Ground', 'North Gate',     'disability', 20.00, true),
  ('NG-03', 12.97481, 77.59366, 'available', 'open',    'Ground', 'North Gate',     'standard',   20.00, true),
  ('NG-04', 12.97474, 77.59394, 'available', 'open',    'Ground', 'North Gate',     'standard',   20.00, true),

  -- Library Block — covered multi-level
  ('LB-01', 12.97255, 77.59520, 'available', 'covered', 'P1',     'Library Block',  'standard',   30.00, true),
  ('LB-02', 12.97250, 77.59548, 'available', 'covered', 'P1',     'Library Block',  'ev',         35.00, true),
  ('LB-03', 12.97244, 77.59576, 'available', 'covered', 'P2',     'Library Block',  'standard',   30.00, true),
  ('LB-04', 12.97238, 77.59604, 'available', 'covered', 'P2',     'Library Block',  'standard',   30.00, true),

  -- Admin Block — covered, closest to offices
  ('AD-01', 12.97148, 77.59430, 'available', 'covered', 'Ground', 'Admin Block',    'disability', 35.00, true),
  ('AD-02', 12.97142, 77.59458, 'available', 'covered', 'Ground', 'Admin Block',    'standard',   35.00, true),
  ('AD-03', 12.97136, 77.59486, 'available', 'covered', 'P1',     'Admin Block',    'vip',        60.00, true),

  -- Auditorium — open-air event parking (AU-02 taken by a walk-in)
  ('AU-01', 12.97042, 77.59560, 'available', 'open',    'Ground', 'Auditorium',     'standard',   25.00, true),
  ('AU-02', 12.97036, 77.59588, 'occupied',  'open',    'Ground', 'Auditorium',     'standard',   25.00, true),
  ('AU-03', 12.97030, 77.59616, 'available', 'open',    'Ground', 'Auditorium',     'ev',         30.00, true),

  -- Sports Complex — open-air (SC-02 taken by a walk-in)
  ('SC-01', 12.96905, 77.59350, 'available', 'open',    'Ground', 'Sports Complex', 'standard',   20.00, true),
  ('SC-02', 12.96898, 77.59380, 'occupied',  'open',    'Ground', 'Sports Complex', 'standard',   20.00, true),

  -- Hostel Circle — covered (HC-02 held manually at the desk)
  ('HC-01', 12.97205, 77.59720, 'available', 'covered', 'Ground', 'Hostel Circle',  'standard',   25.00, true),
  ('HC-02', 12.97198, 77.59748, 'reserved',  'covered', 'Ground', 'Hostel Circle',  'standard',   25.00, true)
on conflict (slot_number) do nothing;

-- ── demo accounts ────────────────────────────────────────────────────────────
insert into users (name, email, password, role, phone_number, vehicle_number)
values
  ('Asha Admin',     'admin@parksmart.dev',    crypt('Admin@123',    gen_salt('bf', 12)), 'admin',    '+91 90000 00001', null),
  ('Omar Operator',  'operator@parksmart.dev', crypt('Operator@123', gen_salt('bf', 12)), 'operator', '+91 90000 00002', null),
  ('Uma User',       'user@parksmart.dev',     crypt('User@123',     gen_salt('bf', 12)), 'user',     '+91 90000 00003', 'KA-01-AB-1234'),
  ('Dev Driver',     'driver@parksmart.dev',   crypt('Driver@123',   gen_salt('bf', 12)), 'user',     '+91 90000 00004', 'KA-05-CD-5678')
on conflict (email) do nothing;

-- ── booking history (analytics + My Bookings demo data) ──────────────────────
-- Completed bookings across the past week at typical peak hours (09:00, 10:00,
-- 18:00) so the peak-hours chart has a visible shape.

-- Uma: completed, 3 days ago 09:00–11:00, Library LB-01
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '3 days') + interval '8 hours 40 minutes',
       date_trunc('day', now() - interval '3 days') + interval '9 hours',
       date_trunc('day', now() - interval '3 days') + interval '11 hours',
       date_trunc('day', now() - interval '3 days') + interval '9 hours 4 minutes',
       date_trunc('day', now() - interval '3 days') + interval '10 hours 52 minutes',
       60.00, 'completed'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'LB-01';

-- Uma: completed, 2 days ago 18:00–20:00, North Gate NG-01
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '2 days') + interval '17 hours 30 minutes',
       date_trunc('day', now() - interval '2 days') + interval '18 hours',
       date_trunc('day', now() - interval '2 days') + interval '20 hours',
       date_trunc('day', now() - interval '2 days') + interval '18 hours 2 minutes',
       date_trunc('day', now() - interval '2 days') + interval '19 hours 58 minutes',
       40.00, 'completed'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'NG-01';

-- Uma: completed, yesterday 10:00–12:00, Admin Block AD-02
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '1 day') + interval '9 hours 45 minutes',
       date_trunc('day', now() - interval '1 day') + interval '10 hours',
       date_trunc('day', now() - interval '1 day') + interval '12 hours',
       date_trunc('day', now() - interval '1 day') + interval '10 hours 6 minutes',
       date_trunc('day', now() - interval '1 day') + interval '11 hours 47 minutes',
       70.00, 'completed'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'AD-02';

-- Uma: cancelled, yesterday 14:00–16:00, Auditorium AU-01 (shows the cancelled badge)
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '1 day') + interval '13 hours 20 minutes',
       date_trunc('day', now() - interval '1 day') + interval '14 hours',
       date_trunc('day', now() - interval '1 day') + interval '16 hours',
       50.00, 'cancelled'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'AU-01';

-- Uma: ACTIVE right now — checked in ~55 min ago, Library LB-03
-- (sync trigger flips LB-03 to 'occupied')
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, total_price, status)
select u.id, s.id,
       now() - interval '70 minutes',
       now() - interval '60 minutes',
       now() + interval '120 minutes',
       now() - interval '55 minutes',
       90.00, 'active'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'LB-03';

-- Uma: CONFIRMED upcoming — starts in 2h, North Gate NG-03
-- (sync trigger flips NG-03 to 'reserved')
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, total_price, status)
select u.id, s.id,
       now(),
       now() + interval '2 hours',
       now() + interval '4 hours',
       40.00, 'confirmed'
from users u, parking_slots s
where u.email = 'user@parksmart.dev' and s.slot_number = 'NG-03';

-- Dev: completed, 6 days ago 09:00–10:30, Hostel Circle HC-01
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '6 days') + interval '8 hours 50 minutes',
       date_trunc('day', now() - interval '6 days') + interval '9 hours',
       date_trunc('day', now() - interval '6 days') + interval '10 hours 30 minutes',
       date_trunc('day', now() - interval '6 days') + interval '9 hours 1 minute',
       date_trunc('day', now() - interval '6 days') + interval '10 hours 28 minutes',
       37.50, 'completed'
from users u, parking_slots s
where u.email = 'driver@parksmart.dev' and s.slot_number = 'HC-01';

-- Dev: completed, 5 days ago 10:00–12:00, Library LB-04
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '5 days') + interval '9 hours 30 minutes',
       date_trunc('day', now() - interval '5 days') + interval '10 hours',
       date_trunc('day', now() - interval '5 days') + interval '12 hours',
       date_trunc('day', now() - interval '5 days') + interval '10 hours 3 minutes',
       date_trunc('day', now() - interval '5 days') + interval '11 hours 55 minutes',
       60.00, 'completed'
from users u, parking_slots s
where u.email = 'driver@parksmart.dev' and s.slot_number = 'LB-04';

-- Dev: completed, 4 days ago 18:00–19:00, Sports Complex SC-01
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '4 days') + interval '17 hours 40 minutes',
       date_trunc('day', now() - interval '4 days') + interval '18 hours',
       date_trunc('day', now() - interval '4 days') + interval '19 hours',
       date_trunc('day', now() - interval '4 days') + interval '18 hours 5 minutes',
       date_trunc('day', now() - interval '4 days') + interval '18 hours 57 minutes',
       20.00, 'completed'
from users u, parking_slots s
where u.email = 'driver@parksmart.dev' and s.slot_number = 'SC-01';

-- Dev: completed, 2 days ago 09:00–11:00, Auditorium AU-03 (EV)
insert into bookings (user_id, slot_id, booking_time, start_time, end_time, check_in_time, check_out_time, total_price, status)
select u.id, s.id,
       date_trunc('day', now() - interval '2 days') + interval '8 hours 45 minutes',
       date_trunc('day', now() - interval '2 days') + interval '9 hours',
       date_trunc('day', now() - interval '2 days') + interval '11 hours',
       date_trunc('day', now() - interval '2 days') + interval '9 hours 2 minutes',
       date_trunc('day', now() - interval '2 days') + interval '10 hours 50 minutes',
       60.00, 'completed'
from users u, parking_slots s
where u.email = 'driver@parksmart.dev' and s.slot_number = 'AU-03';

-- Welcome notifications so the bell isn't empty on first login
insert into notifications (user_id, title, message)
select id, 'Welcome to ParkSmart 🎉',
       'Find a slot on the live map, book it, and show your QR ticket at the gate.'
from users;
