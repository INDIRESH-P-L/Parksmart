// ============================================================================
// Local fallback database.
//
// WHY: the app talks to Supabase via supabase-js. With no Supabase project
// configured (the shipped .env placeholders), every query throws
// "TypeError: fetch failed". This module provides a zero-setup, in-process
// datastore that implements the exact slice of the supabase-js query-builder
// API the models use — so the WHOLE app runs locally with no cloud, no Docker,
// no Postgres install. Data persists to backend/.local-db.json across restarts.
//
// Supabase remains the production path: when real SUPABASE_* values are set,
// config/db.js uses the real client and this file is never touched.
//
// It is deliberately NOT a general Postgres emulator — it supports precisely
// the operations in models/*.js (select/insert/update/delete, the filters
// eq/or/ilike/in/lt/gt/gte/lte, order/range/limit, single/maybeSingle, exact
// count, and the one-to-one embeds like `slot:parking_slots(...)`), plus a JS
// re-implementation of the slot-status sync trigger.
// ============================================================================
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from './env.js';

const DB_FILE = fileURLToPath(new URL('../../.local-db.json', import.meta.url));
const nowIso = () => new Date().toISOString();

// Auto-detect: local mode when forced, or when creds are missing/placeholders.
export const isLocalMode = () => {
  const flag = String(env.USE_LOCAL_DB ?? '').toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  const url = env.SUPABASE_URL || '';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || '';
  return !url || url.includes('your-project-ref') || key.includes('paste-your') || key.length < 20;
};

// ── the store ────────────────────────────────────────────────────────────────
const store = {
  users: [],
  parking_slots: [],
  bookings: [],
  notifications: [],
  feedback: [],
  favorites: [],
};

const TIMESTAMPED = new Set(['users', 'parking_slots', 'bookings']); // have updated_at

const DEFAULTS = {
  users: () => ({ role: 'user', phone_number: null, vehicle_number: null }),
  parking_slots: () => ({
    status: 'available',
    slot_type: 'standard',
    hourly_rate: 0,
    is_active: true,
    floor: null,
    zone_name: null,
    // Mirrors schema.sql: live occupancy + short-lived reservation hold.
    occupied_by: null,
    occupied_by_name: null,
    check_in_time: null,
    reserved_by: null,
    reserved_until: null,
  }),
  bookings: () => ({
    start_time: null,
    end_time: null,
    check_in_time: null,
    check_out_time: null,
    total_price: 0,
    qr_code_url: null,
    status: 'pending',
  }),
  notifications: () => ({ is_read: false }),
  feedback: () => ({ rating: null, slot_id: null }),
  favorites: () => ({}),
};

// One-to-one embed foreign keys: `${alias}_id` → table. Covers every embed the
// models use (slot→slot_id→parking_slots, user→user_id→users).
const EMBED_FK = (alias) => `${alias}_id`;

// ── persistence ──────────────────────────────────────────────────────────────
let loaded = false;

const persist = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
  } catch {
    /* a failed local-disk write must never break a request */
  }
};

export const ensureSeeded = () => {
  if (loaded) return;
  loaded = true;
  if (fs.existsSync(DB_FILE)) {
    try {
      const disk = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      for (const key of Object.keys(store)) if (Array.isArray(disk[key])) store[key] = disk[key];
      return;
    } catch {
      /* corrupt file → fall through and reseed */
    }
  }
  seed();
  persist();
};

// ── slot-status sync (JS port of database/triggers.sql) ──────────────────────
// Keeps parking_slots.status in lock-step with its bookings after any booking
// insert/update — the local equivalent of the Postgres trigger.
const syncSlot = (slotId) => {
  const slot = store.parking_slots.find((s) => s.id === slotId);
  if (!slot) return;

  // An unexpired reservation hold is not booking-derived — leave it alone, or a
  // booking write would strip a hold another user is relying on. Mirrors the
  // same guard in triggers.sql's sync_slot_status().
  if (slot.reserved_until && new Date(slot.reserved_until) > new Date()) return;

  const bookings = store.bookings.filter((b) => b.slot_id === slotId);
  const occupied = bookings.some(
    (b) => b.status === 'active' || (b.check_in_time && !b.check_out_time && !['completed', 'cancelled'].includes(b.status))
  );
  const reserved = bookings.some((b) => ['pending', 'confirmed'].includes(b.status) && !b.check_in_time);
  slot.status = occupied ? 'occupied' : reserved ? 'reserved' : 'available';
};

const runSideEffects = (table, rows) => {
  if (table === 'bookings') rows.forEach((b) => syncSlot(b.slot_id));
};

// ── constraints / defaults ───────────────────────────────────────────────────
const applyDefaults = (table, payload) => {
  const row = { ...DEFAULTS[table](), ...payload };
  row.id = payload.id ?? randomUUID();
  row.created_at = payload.created_at ?? nowIso();
  if (TIMESTAMPED.has(table)) row.updated_at = payload.updated_at ?? nowIso();
  return row;
};

// Returns a { code:'23505' } error (unwrap maps it to a friendly 409) on a
// unique-constraint clash, else null. `selfId` excludes a row from its own check
// during updates.
const uniqueViolation = (table, row, selfId = null) => {
  const clash = (predicate) => store[table].some((r) => r.id !== selfId && predicate(r));
  if (table === 'users' && row.email && clash((r) => r.email === row.email)) {
    return { code: '23505', message: 'duplicate key value violates unique constraint (email)' };
  }
  if (table === 'parking_slots' && row.slot_number && clash((r) => r.slot_number === row.slot_number)) {
    return { code: '23505', message: 'duplicate key value violates unique constraint (slot_number)' };
  }
  if (table === 'favorites' && clash((r) => r.user_id === row.user_id && r.slot_id === row.slot_id)) {
    return { code: '23505', message: 'duplicate key value violates unique constraint (user_id, slot_id)' };
  }
  return null;
};

// ── select-string parsing (columns + one-to-one embeds) ──────────────────────
const splitTopLevel = (str) => {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') { depth += 1; cur += ch; }
    else if (ch === ')') { depth -= 1; cur += ch; }
    else if (ch === ',' && depth === 0) { if (cur.trim()) parts.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};

const parseSelect = (sel) => {
  const columns = [];
  const embeds = [];
  for (const part of splitTopLevel(sel ?? '*')) {
    const embed = part.match(/^(\w+):(\w+)\((.*)\)$/s); // alias:table(cols)
    if (embed) {
      embeds.push({ alias: embed[1], table: embed[2], cols: splitTopLevel(embed[3]) });
    } else {
      columns.push(part);
    }
  }
  return { columns, embeds };
};

const project = (row, cols) => {
  if (!row) return null;
  if (!cols.length || cols.includes('*')) return { ...row };
  const out = {};
  for (const c of cols) out[c] = row[c];
  return out;
};

const shapeRow = (row, parsed) => {
  const out = project(row, parsed.columns);
  for (const emb of parsed.embeds) {
    const ref = store[emb.table]?.find((r) => r.id === row[EMBED_FK(emb.alias)]) ?? null;
    out[emb.alias] = ref ? project(ref, emb.cols) : null;
  }
  return out;
};

// ── filter predicates ────────────────────────────────────────────────────────
// SQL ILIKE ('%foo%') → case-insensitive regex.
const ilikeToRegex = (pattern) => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
};

const orPredicate = (expr) => {
  // "col.ilike.%x%,other.ilike.%x%" → OR of each condition (ilike only — the
  // only operator the models use inside .or()).
  const conditions = splitTopLevel(expr).map((c) => {
    const [col, op, ...rest] = c.split('.');
    const value = rest.join('.');
    if (op === 'ilike') {
      const re = ilikeToRegex(value);
      return (row) => re.test(String(row[col] ?? ''));
    }
    return () => false;
  });
  return (row) => conditions.some((fn) => fn(row));
};

// ── the chainable query builder ──────────────────────────────────────────────
class LocalQuery {
  constructor(table) {
    this._table = table;
    this._op = 'select';
    this._payload = null;
    this._selectCols = '*';
    this._filters = [];
    this._order = null;
    this._range = null;
    this._limit = null;
    this._count = false;
    this._head = false;
    this._single = false;
    this._maybe = false;
  }

  // mutations
  insert(payload) { this._op = 'insert'; this._payload = payload; return this; }
  update(payload) { this._op = 'update'; this._payload = payload; return this; }
  delete() { this._op = 'delete'; return this; }

  // projection
  select(cols = '*', opts = {}) {
    if (cols) this._selectCols = cols;
    if (opts.count) this._count = true;
    if (opts.head) this._head = true;
    return this;
  }

  // filters
  eq(col, val) { this._filters.push((r) => r[col] === val); return this; }
  in(col, arr) { this._filters.push((r) => arr.includes(r[col])); return this; }
  ilike(col, pattern) { const re = ilikeToRegex(pattern); this._filters.push((r) => re.test(String(r[col] ?? ''))); return this; }
  or(expr) { this._filters.push(orPredicate(expr)); return this; }
  lt(col, val) { this._filters.push((r) => r[col] != null && r[col] < val); return this; }
  gt(col, val) { this._filters.push((r) => r[col] != null && r[col] > val); return this; }
  gte(col, val) { this._filters.push((r) => r[col] != null && r[col] >= val); return this; }
  lte(col, val) { this._filters.push((r) => r[col] != null && r[col] <= val); return this; }

  // shaping
  order(col, opts = {}) { this._order = { col, asc: opts.ascending !== false }; return this; }
  range(from, to) { this._range = [from, to]; return this; }
  limit(n) { this._limit = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybe = true; return this; }

  _match() {
    return store[this._table].filter((r) => this._filters.every((fn) => fn(r)));
  }

  _run() {
    ensureSeeded();
    try {
      let base;

      if (this._op === 'insert') {
        const payloads = Array.isArray(this._payload) ? this._payload : [this._payload];
        const inserted = [];
        for (const p of payloads) {
          const row = applyDefaults(this._table, p);
          const violation = uniqueViolation(this._table, row);
          if (violation) return { data: null, error: violation, count: null };
          store[this._table].push(row);
          inserted.push(row);
        }
        runSideEffects(this._table, inserted);
        persist();
        base = inserted;
      } else if (this._op === 'update') {
        const targets = this._match();
        for (const row of targets) {
          const merged = { ...row, ...this._payload };
          const violation = uniqueViolation(this._table, merged, row.id);
          if (violation) return { data: null, error: violation, count: null };
          Object.assign(row, this._payload);
          if (TIMESTAMPED.has(this._table)) row.updated_at = nowIso();
        }
        if (targets.length) { runSideEffects(this._table, targets); persist(); }
        base = targets;
      } else if (this._op === 'delete') {
        const targets = this._match();
        const ids = new Set(targets.map((r) => r.id));
        store[this._table] = store[this._table].filter((r) => !ids.has(r.id));
        if (targets.length) persist();
        base = targets;
      } else {
        // select
        base = this._match();
      }

      const total = base.length;

      // order / range / limit apply to reads (and read-back of writes)
      if (this._order) {
        const { col, asc } = this._order;
        base = [...base].sort((a, b) => {
          const x = a[col];
          const y = b[col];
          if (x === y) return 0;
          if (x == null) return 1;
          if (y == null) return -1;
          return (x < y ? -1 : 1) * (asc ? 1 : -1);
        });
      }
      if (this._range) base = base.slice(this._range[0], this._range[1] + 1);
      if (this._limit != null) base = base.slice(0, this._limit);

      const parsed = parseSelect(this._selectCols);
      const rows = base.map((r) => shapeRow(r, parsed));

      if (this._head) return { data: null, error: null, count: total };
      if (this._single) {
        if (rows.length !== 1) {
          return { data: null, error: { code: 'PGRST116', message: `Expected 1 row, received ${rows.length}` }, count: null };
        }
        return { data: rows[0], error: null, count: this._count ? total : null };
      }
      if (this._maybe) {
        if (rows.length > 1) return { data: null, error: { code: 'PGRST116', message: 'Multiple rows' }, count: null };
        return { data: rows[0] ?? null, error: null, count: this._count ? total : null };
      }
      return { data: rows, error: null, count: this._count ? total : null };
    } catch (err) {
      return { data: null, error: { message: err.message }, count: null };
    }
  }

  // Thenable: `await db('x').select()...` resolves to { data, error, count }.
  // Mirrors supabase-js — errors surface in `error`, the promise never rejects.
  then(resolve, reject) {
    try {
      resolve(this._run());
    } catch (err) {
      reject(err);
    }
  }
}

export const from = (table) => {
  if (!store[table]) throw new Error(`Unknown table: ${table}`);
  return new LocalQuery(table);
};

// ── seed (mirrors database/seed.sql) ─────────────────────────────────────────
const atDay = (daysAgo, hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const fromNow = (mins) => new Date(Date.now() + mins * 60 * 1000).toISOString();

function seed() {
  // Parking slots for Sri Eshwar College of Engineering, Coimbatore
  const slotSpecs = [
    ['SE-M01', 10.8272, 76.9938, 'available', 'open', 'Ground', 'Mechanical Block', 'standard', 20],
    ['SE-M02', 10.8272, 76.9940, 'occupied', 'open', 'Ground', 'Mechanical Block', 'standard', 20],
    ['SE-M03', 10.8273, 76.9939, 'available', 'open', 'Ground', 'Mechanical Block', 'ev', 25],
    ['SE-M04', 10.8273, 76.9941, 'available', 'open', 'Ground', 'Mechanical Block', 'disability', 20],
    ['SE-C01', 10.8269, 76.9945, 'available', 'covered', 'P1', 'CSE & IT Block', 'standard', 30],
    ['SE-C02', 10.8269, 76.9947, 'occupied', 'covered', 'P1', 'CSE & IT Block', 'ev', 35],
    ['SE-C03', 10.8270, 76.9946, 'available', 'covered', 'P2', 'CSE & IT Block', 'standard', 30],
    ['SE-C04', 10.8270, 76.9948, 'reserved', 'covered', 'P2', 'CSE & IT Block', 'vip', 50],
    ['SE-A01', 10.8263, 76.9940, 'available', 'covered', 'Ground', 'Admin & Library Block', 'disability', 35],
    ['SE-A02', 10.8263, 76.9942, 'occupied', 'covered', 'Ground', 'Admin & Library Block', 'standard', 35],
    ['SE-A03', 10.8264, 76.9941, 'available', 'covered', 'P1', 'Admin & Library Block', 'vip', 60],
    ['SE-A04', 10.8264, 76.9943, 'available', 'covered', 'P1', 'Admin & Library Block', 'standard', 35],
    ['SE-AU01', 10.8258, 76.9947, 'available', 'open', 'Ground', 'Auditorium Block', 'standard', 25],
    ['SE-AU02', 10.8258, 76.9949, 'occupied', 'open', 'Ground', 'Auditorium Block', 'standard', 25],
    ['SE-AU03', 10.8259, 76.9948, 'available', 'open', 'Ground', 'Auditorium Block', 'ev', 30],
    ['SE-SP01', 10.8275, 76.9948, 'available', 'open', 'Ground', 'Sports Complex', 'standard', 20],
    ['SE-SP02', 10.8275, 76.9950, 'occupied', 'open', 'Ground', 'Sports Complex', 'standard', 20],
    ['SE-SP03', 10.8276, 76.9949, 'available', 'open', 'Ground', 'Sports Complex', 'standard', 20],
  ];
  const slotByNumber = {};
  for (const [slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate] of slotSpecs) {
    const row = applyDefaults('parking_slots', {
      slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate, is_active: true,
    });
    store.parking_slots.push(row);
    slotByNumber[slot_number] = row;
  }

  // SECE accounts
  const userSpecs = [
    ['SECE Admin', 'admin@sece.ac.in', 'Admin@123', 'admin', '+91 98765 43210', null],
    ['SECE Admin SSECE', 'admin@ssece', 'admin@123', 'admin', '+91 98765 43219', null],
    ['Gate Operator', 'operator@sece.ac.in', 'Operator@123', 'operator', '+91 98765 43211', null],
    ['Eshwar User', 'user@sece.ac.in', 'User@123', 'user', '+91 98765 43212', 'TN-37-AB-1234'],
    ['Asha Admin', 'admin@parksmart.dev', 'Admin@123', 'admin', '+91 90000 00001', null],
    ['Uma User', 'user@parksmart.dev', 'User@123', 'user', '+91 90000 00003', 'KA-01-AB-1234'],
  ];
  for (const [name, email, password, role, phone_number, vehicle_number] of userSpecs) {
    const row = applyDefaults('users', {
      name, email, password: bcrypt.hashSync(password, 12), role, phone_number, vehicle_number,
    });
    store.users.push(row);
  }

  // Welcome notifications
  for (const user of store.users) {
    store.notifications.push(
      applyDefaults('notifications', {
        user_id: user.id,
        title: 'Welcome to Sri Eshwar Smart Parking 🅿️',
        message: 'Manage and select your parking slot dynamically in real time.',
      })
    );
  }
}
