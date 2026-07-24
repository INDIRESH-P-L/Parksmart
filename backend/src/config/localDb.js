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
import bcrypt from 'bcrypt';
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
  // 18 slots across 6 campus zones (same data as seed.sql).
  const slotSpecs = [
    ['NG-01', 12.97492, 77.5931, 'available', 'open', 'Ground', 'North Gate', 'standard', 20],
    ['NG-02', 12.97488, 77.59338, 'available', 'open', 'Ground', 'North Gate', 'disability', 20],
    ['NG-03', 12.97481, 77.59366, 'available', 'open', 'Ground', 'North Gate', 'standard', 20],
    ['NG-04', 12.97474, 77.59394, 'available', 'open', 'Ground', 'North Gate', 'standard', 20],
    ['LB-01', 12.97255, 77.5952, 'available', 'covered', 'P1', 'Library Block', 'standard', 30],
    ['LB-02', 12.9725, 77.59548, 'available', 'covered', 'P1', 'Library Block', 'ev', 35],
    ['LB-03', 12.97244, 77.59576, 'available', 'covered', 'P2', 'Library Block', 'standard', 30],
    ['LB-04', 12.97238, 77.59604, 'available', 'covered', 'P2', 'Library Block', 'standard', 30],
    ['AD-01', 12.97148, 77.5943, 'available', 'covered', 'Ground', 'Admin Block', 'disability', 35],
    ['AD-02', 12.97142, 77.59458, 'available', 'covered', 'Ground', 'Admin Block', 'standard', 35],
    ['AD-03', 12.97136, 77.59486, 'available', 'covered', 'P1', 'Admin Block', 'vip', 60],
    ['AU-01', 12.97042, 77.5956, 'available', 'open', 'Ground', 'Auditorium', 'standard', 25],
    ['AU-02', 12.97036, 77.59588, 'occupied', 'open', 'Ground', 'Auditorium', 'standard', 25],
    ['AU-03', 12.9703, 77.59616, 'available', 'open', 'Ground', 'Auditorium', 'ev', 30],
    ['SC-01', 12.96905, 77.5935, 'available', 'open', 'Ground', 'Sports Complex', 'standard', 20],
    ['SC-02', 12.96898, 77.5938, 'occupied', 'open', 'Ground', 'Sports Complex', 'standard', 20],
    ['HC-01', 12.97205, 77.5972, 'available', 'covered', 'Ground', 'Hostel Circle', 'standard', 25],
    ['HC-02', 12.97198, 77.59748, 'reserved', 'covered', 'Ground', 'Hostel Circle', 'standard', 25],
  ];
  const slotByNumber = {};
  for (const [slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate] of slotSpecs) {
    const row = applyDefaults('parking_slots', {
      slot_number, latitude, longitude, status, type, floor, zone_name, slot_type, hourly_rate, is_active: true,
    });
    store.parking_slots.push(row);
    slotByNumber[slot_number] = row;
  }

  // 4 demo accounts — passwords bcrypt-hashed here so login works identically
  // to the Supabase path. (Same credentials as seed.sql.)
  const userSpecs = [
    ['Asha Admin', 'admin@parksmart.dev', 'Admin@123', 'admin', '+91 90000 00001', null],
    ['Omar Operator', 'operator@parksmart.dev', 'Operator@123', 'operator', '+91 90000 00002', null],
    ['Uma User', 'user@parksmart.dev', 'User@123', 'user', '+91 90000 00003', 'KA-01-AB-1234'],
    ['Dev Driver', 'driver@parksmart.dev', 'Driver@123', 'user', '+91 90000 00004', 'KA-05-CD-5678'],
  ];
  const userByEmail = {};
  for (const [name, email, password, role, phone_number, vehicle_number] of userSpecs) {
    const row = applyDefaults('users', {
      name, email, password: bcrypt.hashSync(password, 12), role, phone_number, vehicle_number,
    });
    store.users.push(row);
    userByEmail[email] = row;
  }

  const uma = userByEmail['user@parksmart.dev'];
  const dev = userByEmail['driver@parksmart.dev'];

  // Booking history so dashboards + analytics are populated on first run.
  const bookingSpecs = [
    { user: uma, slot: 'LB-01', booking_time: atDay(3, 8, 40), start_time: atDay(3, 9), end_time: atDay(3, 11), check_in_time: atDay(3, 9, 4), check_out_time: atDay(3, 10, 52), total_price: 60, status: 'completed' },
    { user: uma, slot: 'NG-01', booking_time: atDay(2, 17, 30), start_time: atDay(2, 18), end_time: atDay(2, 20), check_in_time: atDay(2, 18, 2), check_out_time: atDay(2, 19, 58), total_price: 40, status: 'completed' },
    { user: uma, slot: 'AD-02', booking_time: atDay(1, 9, 45), start_time: atDay(1, 10), end_time: atDay(1, 12), check_in_time: atDay(1, 10, 6), check_out_time: atDay(1, 11, 47), total_price: 70, status: 'completed' },
    { user: uma, slot: 'AU-01', booking_time: atDay(1, 13, 20), start_time: atDay(1, 14), end_time: atDay(1, 16), total_price: 50, status: 'cancelled' },
    { user: uma, slot: 'LB-03', booking_time: fromNow(-70), start_time: fromNow(-60), end_time: fromNow(120), check_in_time: fromNow(-55), total_price: 90, status: 'active' },
    { user: uma, slot: 'NG-03', booking_time: nowIso(), start_time: fromNow(120), end_time: fromNow(240), total_price: 40, status: 'confirmed' },
    { user: dev, slot: 'HC-01', booking_time: atDay(6, 8, 50), start_time: atDay(6, 9), end_time: atDay(6, 10, 30), check_in_time: atDay(6, 9, 1), check_out_time: atDay(6, 10, 28), total_price: 37.5, status: 'completed' },
    { user: dev, slot: 'LB-04', booking_time: atDay(5, 9, 30), start_time: atDay(5, 10), end_time: atDay(5, 12), check_in_time: atDay(5, 10, 3), check_out_time: atDay(5, 11, 55), total_price: 60, status: 'completed' },
    { user: dev, slot: 'SC-01', booking_time: atDay(4, 17, 40), start_time: atDay(4, 18), end_time: atDay(4, 19), check_in_time: atDay(4, 18, 5), check_out_time: atDay(4, 18, 57), total_price: 20, status: 'completed' },
    { user: dev, slot: 'AU-03', booking_time: atDay(2, 8, 45), start_time: atDay(2, 9), end_time: atDay(2, 11), check_in_time: atDay(2, 9, 2), check_out_time: atDay(2, 10, 50), total_price: 60, status: 'completed' },
  ];
  for (const spec of bookingSpecs) {
    const slot = slotByNumber[spec.slot];
    const row = applyDefaults('bookings', {
      user_id: spec.user.id,
      slot_id: slot.id,
      booking_time: spec.booking_time,
      start_time: spec.start_time,
      end_time: spec.end_time,
      check_in_time: spec.check_in_time ?? null,
      check_out_time: spec.check_out_time ?? null,
      total_price: spec.total_price,
      status: spec.status,
    });
    store.bookings.push(row);
    syncSlot(slot.id); // active → occupied, confirmed → reserved, etc.
  }

  // Welcome notification per user.
  for (const user of store.users) {
    store.notifications.push(
      applyDefaults('notifications', {
        user_id: user.id,
        title: 'Welcome to ParkSmart 🎉',
        message: 'Find a slot on the live map, book it, and show your QR ticket at the gate.',
      })
    );
  }
}
