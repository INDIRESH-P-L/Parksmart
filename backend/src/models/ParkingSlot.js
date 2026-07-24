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
