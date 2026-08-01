// Data access for the `parking_slots` table.
import { db, unwrap } from '../config/db.js';

const sanitizeSearch = (value = '') => value.replace(/[,()]/g, ' ').trim();

export const list = async ({ status, type, zone, search, includeInactive = false } = {}) => {
  let query = db('parking_slots').select('*').order('slot_number', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (zone) query = query.ilike('zone_name', `%${sanitizeSearch(zone)}%`);
  const term = sanitizeSearch(search);
  if (term) query = query.or(`slot_number.ilike.%${term}%,zone_name.ilike.%${term}%`);
  return unwrap(await query, 'parking_slots.list');
};

export const findById = async (id) =>
  unwrap(await db('parking_slots').select('*').eq('id', id).maybeSingle(), 'parking_slots.findById');

export const create = async (fields) =>
  unwrap(await db('parking_slots').insert(fields).select().single(), 'parking_slots.create');

export const update = async (id, fields) =>
  unwrap(
    await db('parking_slots').update(fields).eq('id', id).select().single(),
    'parking_slots.update'
  );

export const hardDelete = async (id) =>
  unwrap(await db('parking_slots').delete().eq('id', id).select('id'), 'parking_slots.delete');

export const setStatus = async (id, status) =>
  unwrap(
    await db('parking_slots').update({ status }).eq('id', id).select().single(),
    'parking_slots.setStatus'
  );

// RACE-CONDITION GUARD for the booking flow.
// A conditional UPDATE is atomic at the row level in Postgres: if two users try
// to book the same slot simultaneously, the row is locked for the first UPDATE
// and the second one no longer matches `status = 'available'` — it returns
// 0 rows (null here) and bookingService rejects with 409. No transaction
// needed for this single-row invariant.
export const reserveIfAvailable = async (id) =>
  unwrap(
    await db('parking_slots')
      .update({ status: 'reserved' })
      .eq('id', id)
      .eq('status', 'available')
      .eq('is_active', true)
      .select()
      .maybeSingle(),
    'parking_slots.reserveIfAvailable'
  );

// ── atomic check-in / hold operations ────────────────────────────────────────
// All of these follow reserveIfAvailable's pattern: a single conditional UPDATE
// whose WHERE clause re-asserts the precondition. Postgres locks the row for the
// duration of the write, so of N concurrent callers exactly one can match — the
// losers get 0 rows (null) and the caller maps that to the existing 409/400.
// localDb.js is equally safe: its _run() performs match-then-write in one
// synchronous block, so async callers cannot interleave.

// Claims a slot for check-in. `expectedStatus` is 'available' for a free slot,
// or 'reserved' when the caller holds a valid (unexpired) reservation on it.
// Clears the hold on success — a claimed slot is no longer merely held.
export const checkInIfClaimable = async (id, { expectedStatus, occupiedBy, occupiedByName }) =>
  unwrap(
    await db('parking_slots')
      .update({
        status: 'occupied',
        occupied_by: occupiedBy,
        occupied_by_name: occupiedByName,
        check_in_time: new Date().toISOString(),
        reserved_by: null,
        reserved_until: null,
      })
      .eq('id', id)
      .eq('status', expectedStatus)
      .eq('is_active', true)
      .select()
      .maybeSingle(),
    'parking_slots.checkInIfClaimable'
  );

// Places a hold. Only succeeds if the row is STILL 'available' at write time,
// which is what makes two simultaneous reservers resolve to a single winner.
export const holdIfAvailable = async (id, { reservedBy, reservedUntil }) =>
  unwrap(
    await db('parking_slots')
      .update({ status: 'reserved', reserved_by: reservedBy, reserved_until: reservedUntil })
      .eq('id', id)
      .eq('status', 'available')
      .eq('is_active', true)
      .select()
      .maybeSingle(),
    'parking_slots.holdIfAvailable'
  );

// Releases a single expired hold, re-checking expiry in the WHERE clause so a
// hold renewed between read and write is never stolen.
export const releaseExpiredHold = async (id, now = new Date().toISOString()) =>
  unwrap(
    await db('parking_slots')
      .update({ status: 'available', reserved_by: null, reserved_until: null })
      .eq('id', id)
      .eq('status', 'reserved')
      .lt('reserved_until', now)
      .select()
      .maybeSingle(),
    'parking_slots.releaseExpiredHold'
  );

// ── sweep support ────────────────────────────────────────────────────────────
export const findExpiredHolds = async (now = new Date().toISOString()) =>
  unwrap(
    await db('parking_slots').select('*').eq('status', 'reserved').lt('reserved_until', now),
    'parking_slots.findExpiredHolds'
  );

export const findStaleOccupied = async (cutoff) =>
  unwrap(
    await db('parking_slots').select('*').eq('status', 'occupied').lt('check_in_time', cutoff),
    'parking_slots.findStaleOccupied'
  );

// Force-releases a stale occupied slot. The check_in_time bound stays in the
// WHERE clause so a slot checked out and re-taken mid-sweep is left alone.
export const forceCheckOutIfStale = async (id, cutoff) =>
  unwrap(
    await db('parking_slots')
      .update({
        status: 'available',
        occupied_by: null,
        occupied_by_name: null,
        check_in_time: null,
      })
      .eq('id', id)
      .eq('status', 'occupied')
      .lt('check_in_time', cutoff)
      .select()
      .maybeSingle(),
    'parking_slots.forceCheckOutIfStale'
  );
