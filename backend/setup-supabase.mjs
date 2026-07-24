#!/usr/bin/env node
// Creates tables via Supabase Management API, then seeds data.
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import https from 'https';

const SUPABASE_URL = 'https://klrhqelbthhihikwwbtt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscmhxZWxidGhoaWhpa3d3YnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgyNjcwNywiZXhwIjoyMTAwNDAyNzA3fQ.BKCZ1JKeuXrZmW0TCJ5kllsTQPY5hRFU8VRkT_3aDyc';
const PROJECT_REF = 'klrhqelbthhihikwwbtt';

// Use Supabase Management API to execute SQL
function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Direct pg connection via Supabase's pg endpoint
function execSQLDirect(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `db.${PROJECT_REF}.supabase.co`,
      path: '/rest/pg',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SCHEMA_STATEMENTS = [
  `create extension if not exists "pgcrypto"`,
  `create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text unique not null,
    password text not null,
    role text not null default 'user' check (role in ('user','admin','operator')),
    phone_number text,
    vehicle_number text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `create table if not exists parking_slots (
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
    check_in_time timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `create table if not exists bookings (
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
    status text not null default 'pending' check (status in ('pending','confirmed','active','completed','cancelled')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    title text not null,
    message text not null,
    is_read boolean default false,
    created_at timestamptz default now()
  )`,
  `create table if not exists favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    slot_id uuid references parking_slots(id) on delete cascade,
    created_at timestamptz default now(),
    unique (user_id, slot_id)
  )`,
  `create index if not exists idx_parking_slots_status on parking_slots(status)`,
  `create index if not exists idx_bookings_user_id on bookings(user_id)`,
];

const SEED_SLOTS = [
  { slot_number:'SE-M01',latitude:10.8272,longitude:76.9938,status:'available',type:'open',floor:'Ground',zone_name:'Mechanical Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-M02',latitude:10.8272,longitude:76.9940,status:'available',type:'open',floor:'Ground',zone_name:'Mechanical Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-M03',latitude:10.8273,longitude:76.9939,status:'available',type:'open',floor:'Ground',zone_name:'Mechanical Block',slot_type:'ev',hourly_rate:0,is_active:true },
  { slot_number:'SE-M04',latitude:10.8273,longitude:76.9941,status:'available',type:'open',floor:'Ground',zone_name:'Mechanical Block',slot_type:'disability',hourly_rate:0,is_active:true },
  { slot_number:'SE-C01',latitude:10.8269,longitude:76.9945,status:'available',type:'covered',floor:'P1',zone_name:'CSE & IT Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-C02',latitude:10.8269,longitude:76.9947,status:'available',type:'covered',floor:'P1',zone_name:'CSE & IT Block',slot_type:'ev',hourly_rate:0,is_active:true },
  { slot_number:'SE-C03',latitude:10.8270,longitude:76.9946,status:'available',type:'covered',floor:'P2',zone_name:'CSE & IT Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-C04',latitude:10.8270,longitude:76.9948,status:'reserved',type:'covered',floor:'P2',zone_name:'CSE & IT Block',slot_type:'vip',hourly_rate:0,is_active:true },
  { slot_number:'SE-A01',latitude:10.8263,longitude:76.9940,status:'available',type:'covered',floor:'Ground',zone_name:'Admin & Library Block',slot_type:'disability',hourly_rate:0,is_active:true },
  { slot_number:'SE-A02',latitude:10.8263,longitude:76.9942,status:'available',type:'covered',floor:'Ground',zone_name:'Admin & Library Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-A03',latitude:10.8264,longitude:76.9941,status:'available',type:'covered',floor:'P1',zone_name:'Admin & Library Block',slot_type:'vip',hourly_rate:0,is_active:true },
  { slot_number:'SE-A04',latitude:10.8264,longitude:76.9943,status:'available',type:'covered',floor:'P1',zone_name:'Admin & Library Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-AU01',latitude:10.8258,longitude:76.9947,status:'available',type:'open',floor:'Ground',zone_name:'Auditorium Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-AU02',latitude:10.8258,longitude:76.9949,status:'available',type:'open',floor:'Ground',zone_name:'Auditorium Block',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-AU03',latitude:10.8259,longitude:76.9948,status:'available',type:'open',floor:'Ground',zone_name:'Auditorium Block',slot_type:'ev',hourly_rate:0,is_active:true },
  { slot_number:'SE-SP01',latitude:10.8275,longitude:76.9948,status:'available',type:'open',floor:'Ground',zone_name:'Sports Complex',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-SP02',latitude:10.8275,longitude:76.9950,status:'available',type:'open',floor:'Ground',zone_name:'Sports Complex',slot_type:'standard',hourly_rate:0,is_active:true },
  { slot_number:'SE-SP03',latitude:10.8276,longitude:76.9949,status:'available',type:'open',floor:'Ground',zone_name:'Sports Complex',slot_type:'standard',hourly_rate:0,is_active:true },
];

const SEED_USERS = [
  { name:'SECE Admin',      email:'admin@sece.ac.in',      plainPassword:'Admin@123',    role:'admin',    phone_number:'+91 98765 43210' },
  { name:'ParkSmart Admin', email:'admin@ssece',           plainPassword:'admin@123',    role:'admin',    phone_number:'+91 98765 43213' },
  { name:'Gate Operator',   email:'operator@sece.ac.in',   plainPassword:'Operator@123', role:'operator', phone_number:'+91 98765 43211' },
  { name:'Eshwar User',     email:'user@sece.ac.in',       plainPassword:'User@123',     role:'user',     phone_number:'+91 98765 43212', vehicle_number:'TN-37-AB-1234' },
];

async function main() {
  console.log('\n🚀 ParkSmart Supabase Setup');
  console.log(`📡 ${SUPABASE_URL}\n`);

  // Try Management API to create tables
  console.log('📋 Step 1: Creating database tables via Management API...');
  for (const stmt of SCHEMA_STATEMENTS) {
    const r = await execSQL(stmt);
    if (r.status >= 200 && r.status < 300) {
      const name = stmt.includes('create table') ? stmt.match(/table if not exists (\w+)/)?.[1] : 'index/ext';
      console.log(`  ✅ ${name}`);
    } else {
      const parsed = JSON.parse(r.body || '{}');
      if (parsed.message?.includes('already exists')) {
        console.log(`  ℹ️  Already exists (skipped)`);
      } else {
        console.log(`  [${r.status}] ${r.body?.slice(0,100)}`);
      }
    }
  }

  // Seed slots
  console.log('\n🅿️  Step 2: Seeding parking slots...');
  let slotOk = 0;
  for (const slot of SEED_SLOTS) {
    const { error } = await supabase.from('parking_slots').upsert(slot, { onConflict: 'slot_number' });
    if (error) {
      console.log(`  ❌ ${slot.slot_number}: ${error.message}`);
    } else {
      console.log(`  ✅ ${slot.slot_number} — ${slot.zone_name}`);
      slotOk++;
    }
  }

  // Seed users
  console.log('\n👤 Step 3: Seeding users...');
  let userOk = 0;
  for (const u of SEED_USERS) {
    const { plainPassword, ...rest } = u;
    const password = bcrypt.hashSync(plainPassword, 12);
    const { error } = await supabase.from('users').upsert({ ...rest, password }, { onConflict: 'email' });
    if (error) {
      console.log(`  ❌ ${u.email}: ${error.message}`);
    } else {
      console.log(`  ✅ ${u.email} [${u.role}]  password: ${plainPassword}`);
      userOk++;
    }
  }

  // Verify
  console.log('\n🔍 Final verification...');
  const { count: sc } = await supabase.from('parking_slots').select('*', { count:'exact', head:true });
  const { count: uc } = await supabase.from('users').select('*', { count:'exact', head:true });
  console.log(`  🅿️  parking_slots: ${sc ?? 0} rows`);
  console.log(`  👤 users:          ${uc ?? 0} rows`);

  console.log(`\n${slotOk === SEED_SLOTS.length && userOk === SEED_USERS.length ? '🎉 ALL DONE!' : '⚠️  Partial — tables may need manual SQL run'}`);
  console.log('🌐 https://parksmart-frontend-ten.vercel.app\n');
}

main().catch(console.error);
