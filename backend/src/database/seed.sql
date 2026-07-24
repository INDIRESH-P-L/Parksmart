-- ============================================================================
-- ParkSmart — Sri Eshwar College of Engineering Seed (Coimbatore)
-- Run order: schema.sql → triggers.sql → rls_policies.sql → seed.sql
-- ============================================================================

-- ── parking slots ────────────────────────────────────────────────────────────
insert into parking_slots
  (slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate, is_active)
values
  -- Mechanical Block
  ('SE-M01', 10.82720, 76.99380, 'available', 'open',    'Ground', 'Mechanical Block',      'standard',   20.00, true),
  ('SE-M02', 10.82720, 76.99400, 'occupied',  'open',    'Ground', 'Mechanical Block',      'standard',   20.00, true),
  ('SE-M03', 10.82730, 76.99390, 'available', 'open',    'Ground', 'Mechanical Block',      'ev',         25.00, true),
  ('SE-M04', 10.82730, 76.99410, 'available', 'open',    'Ground', 'Mechanical Block',      'disability', 20.00, true),

  -- CSE & IT Block
  ('SE-C01', 10.82690, 76.99450, 'available', 'covered', 'P1',     'CSE & IT Block',        'standard',   30.00, true),
  ('SE-C02', 10.82690, 76.99470, 'occupied',  'covered', 'P1',     'CSE & IT Block',        'ev',         35.00, true),
  ('SE-C03', 10.82700, 76.99460, 'available', 'covered', 'P2',     'CSE & IT Block',        'standard',   30.00, true),
  ('SE-C04', 10.82700, 76.99480, 'reserved',  'covered', 'P2',     'CSE & IT Block',        'vip',        50.00, true),

  -- Admin & Library Block
  ('SE-A01', 10.82630, 76.99400, 'available', 'covered', 'Ground', 'Admin & Library Block',  'disability', 35.00, true),
  ('SE-A02', 10.82630, 76.99420, 'occupied',  'covered', 'Ground', 'Admin & Library Block',  'standard',   35.00, true),
  ('SE-A03', 10.82640, 76.99410, 'available', 'covered', 'P1',     'Admin & Library Block',  'vip',        60.00, true),
  ('SE-A04', 10.82640, 76.99430, 'available', 'covered', 'P1',     'Admin & Library Block',  'standard',   35.00, true),

  -- Auditorium Block
  ('SE-AU01', 10.82580, 76.99470, 'available', 'open',   'Ground', 'Auditorium Block',      'standard',   25.00, true),
  ('SE-AU02', 10.82580, 76.99490, 'occupied',  'open',   'Ground', 'Auditorium Block',      'standard',   25.00, true),
  ('SE-AU03', 10.82590, 76.99480, 'available', 'open',   'Ground', 'Auditorium Block',      'ev',         30.00, true),

  -- Sports Complex
  ('SE-SP01', 10.82750, 76.99480, 'available', 'open',   'Ground', 'Sports Complex',        'standard',   20.00, true),
  ('SE-SP02', 10.82750, 76.99500, 'occupied',  'open',   'Ground', 'Sports Complex',        'standard',   20.00, true),
  ('SE-SP03', 10.82760, 76.99490, 'available', 'open',   'Ground', 'Sports Complex',        'standard',   20.00, true)
on conflict (slot_number) do nothing;

-- ── demo accounts ────────────────────────────────────────────────────────────
insert into users (name, email, password, role, phone_number, vehicle_number)
values
  ('SECE Admin',     'admin@sece.ac.in',       crypt('Admin@123',    gen_salt('bf', 12)), 'admin',    '+91 98765 43210', null),
  ('Gate Operator',  'operator@sece.ac.in',    crypt('Operator@123', gen_salt('bf', 12)), 'operator', '+91 98765 43211', null),
  ('Eshwar User',    'user@sece.ac.in',        crypt('User@123',     gen_salt('bf', 12)), 'user',     '+91 98765 43212', 'TN-37-AB-1234'),
  ('Asha Admin',     'admin@parksmart.dev',    crypt('Admin@123',    gen_salt('bf', 12)), 'admin',    '+91 90000 00001', null),
  ('Uma User',       'user@parksmart.dev',     crypt('User@123',     gen_salt('bf', 12)), 'user',     '+91 90000 00003', 'KA-01-AB-1234')
on conflict (email) do nothing;

-- Welcome notifications
insert into notifications (user_id, title, message)
select id, 'Welcome to Sri Eshwar Smart Parking 🅿️',
       'Manage and select your parking slot dynamically in real time.'
from users;
