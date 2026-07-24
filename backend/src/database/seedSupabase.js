// Script to seed Supabase database directly via REST API with Sri Eshwar College of Engineering dataset.
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const SEED_SLOTS = [
  { slot_number: 'SE-M01', latitude: 10.8272, longitude: 76.9938, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Mechanical Block', slot_type: 'standard', hourly_rate: 20, is_active: true },
  { slot_number: 'SE-M02', latitude: 10.8272, longitude: 76.9940, status: 'occupied', type: 'open', floor: 'Ground', zone_name: 'Mechanical Block', slot_type: 'standard', hourly_rate: 20, is_active: true },
  { slot_number: 'SE-M03', latitude: 10.8273, longitude: 76.9939, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Mechanical Block', slot_type: 'ev', hourly_rate: 25, is_active: true },
  { slot_number: 'SE-M04', latitude: 10.8273, longitude: 76.9941, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Mechanical Block', slot_type: 'disability', hourly_rate: 20, is_active: true },

  { slot_number: 'SE-C01', latitude: 10.8269, longitude: 76.9945, status: 'available', type: 'covered', floor: 'P1', zone_name: 'CSE & IT Block', slot_type: 'standard', hourly_rate: 30, is_active: true },
  { slot_number: 'SE-C02', latitude: 10.8269, longitude: 76.9947, status: 'occupied', type: 'covered', floor: 'P1', zone_name: 'CSE & IT Block', slot_type: 'ev', hourly_rate: 35, is_active: true },
  { slot_number: 'SE-C03', latitude: 10.8270, longitude: 76.9946, status: 'available', type: 'covered', floor: 'P2', zone_name: 'CSE & IT Block', slot_type: 'standard', hourly_rate: 30, is_active: true },
  { slot_number: 'SE-C04', latitude: 10.8270, longitude: 76.9948, status: 'reserved', type: 'covered', floor: 'P2', zone_name: 'CSE & IT Block', slot_type: 'vip', hourly_rate: 50, is_active: true },

  { slot_number: 'SE-A01', latitude: 10.8263, longitude: 76.9940, status: 'available', type: 'covered', floor: 'Ground', zone_name: 'Admin & Library Block', slot_type: 'disability', hourly_rate: 35, is_active: true },
  { slot_number: 'SE-A02', latitude: 10.8263, longitude: 76.9942, status: 'occupied', type: 'covered', floor: 'Ground', zone_name: 'Admin & Library Block', slot_type: 'standard', hourly_rate: 35, is_active: true },
  { slot_number: 'SE-A03', latitude: 10.8264, longitude: 76.9941, status: 'available', type: 'covered', floor: 'P1', zone_name: 'Admin & Library Block', slot_type: 'vip', hourly_rate: 60, is_active: true },
  { slot_number: 'SE-A04', latitude: 10.8264, longitude: 76.9943, status: 'available', type: 'covered', floor: 'P1', zone_name: 'Admin & Library Block', slot_type: 'standard', hourly_rate: 35, is_active: true },

  { slot_number: 'SE-AU01', latitude: 10.8258, longitude: 76.9947, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Auditorium Block', slot_type: 'standard', hourly_rate: 25, is_active: true },
  { slot_number: 'SE-AU02', latitude: 10.8258, longitude: 76.9949, status: 'occupied', type: 'open', floor: 'Ground', zone_name: 'Auditorium Block', slot_type: 'standard', hourly_rate: 25, is_active: true },
  { slot_number: 'SE-AU03', latitude: 10.8259, longitude: 76.9948, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Auditorium Block', slot_type: 'ev', hourly_rate: 30, is_active: true },

  { slot_number: 'SE-SP01', latitude: 10.8275, longitude: 76.9948, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Sports Complex', slot_type: 'standard', hourly_rate: 20, is_active: true },
  { slot_number: 'SE-SP02', latitude: 10.8275, longitude: 76.9950, status: 'occupied', type: 'open', floor: 'Ground', zone_name: 'Sports Complex', slot_type: 'standard', hourly_rate: 20, is_active: true },
  { slot_number: 'SE-SP03', latitude: 10.8276, longitude: 76.9949, status: 'available', type: 'open', floor: 'Ground', zone_name: 'Sports Complex', slot_type: 'standard', hourly_rate: 20, is_active: true },
];

const SEED_USERS = [
  { name: 'SECE Admin', email: 'admin@sece.ac.in', password: 'Admin@123', role: 'admin', phone_number: '+91 98765 43210' },
  { name: 'Gate Operator', email: 'operator@sece.ac.in', password: 'Operator@123', role: 'operator', phone_number: '+91 98765 43211' },
  { name: 'Eshwar User', email: 'user@sece.ac.in', password: 'User@123', role: 'user', phone_number: '+91 98765 43212', vehicle_number: 'TN-37-AB-1234' },
];

export async function seedSupabase() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    return false;
  }

  const supabase = createClient(url, key);

  console.log(`Connecting to Supabase at ${url}...`);

  try {
    // 1. Seed parking slots
    console.log('Seeding Sri Eshwar College of Engineering parking slots...');
    for (const slot of SEED_SLOTS) {
      const { error } = await supabase.from('parking_slots').upsert(slot, { onConflict: 'slot_number' });
      if (error) {
        console.warn(`Could not seed slot ${slot.slot_number}:`, error.message);
      }
    }

    // 2. Seed users
    console.log('Seeding SECE accounts...');
    for (const u of SEED_USERS) {
      const userObj = {
        ...u,
        password: bcrypt.hashSync(u.password, 12),
      };
      const { error } = await supabase.from('users').upsert(userObj, { onConflict: 'email' });
      if (error) {
        console.warn(`Could not seed user ${u.email}:`, error.message);
      }
    }

    console.log('Supabase seeding finished!');
    return true;
  } catch (err) {
    console.error('Supabase seeding error:', err.message);
    return false;
  }
}

if (process.argv[1] && process.argv[1].includes('seedSupabase.js')) {
  seedSupabase().then(() => process.exit(0));
}
