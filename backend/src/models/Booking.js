// Data access for the `bookings` table.
import { db, unwrap } from '../config/db.js';

// Slot fields are embedded on every read so ticket/booking UIs never need a
// second round-trip to render slot number, zone, and location.
const WITH_SLOT =
  '*, slot:parking_slots(id, slot_number, zone_name, floor, type, slot_type, latitude, longitude, hourly_rate)';

// Admin views additionally embed the owner (safe columns only — never the hash).
const WITH_SLOT_AND_USER = `${WITH_SLOT}, user:users(id, name, email)`;

export const create = async (fields) =>
  unwrap(await db('bookings').insert(fields).select(WITH_SLOT).single(), 'bookings.create');

export const findById = async (id) =>
  unwrap(await db('bookings').select(WITH_SLOT).eq('id', id).maybeSingle(), 'bookings.findById');

export const update = async (id, fields) =>
  unwrap(
    await db('bookings').update(fields).eq('id', id).select(WITH_SLOT).single(),
    'bookings.update'
  );

export const listByUser = async (userId) =>
  unwrap(
    await db('bookings')
      .select(WITH_SLOT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'bookings.listByUser'
  );

// Overlap check: an OPEN booking (pending/confirmed/active) on the same slot
// whose [start_time, end_time) window intersects the requested one.
// Interval intersection: existing.start < new.end AND existing.end > new.start.
// (Seeded/legacy rows with null start/end are excluded by the comparisons,
// which is fine — every API-created booking always has both.)
export const overlapExists = async (slotId, start, end) => {
  const rows = unwrap(
    await db('bookings')
      .select('id')
      .eq('slot_id', slotId)
      .in('status', ['pending', 'confirmed', 'active'])
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())
      .limit(1),
    'bookings.overlapExists'
  );
  return rows.length > 0;
};

export const listAll = async ({ limit = 20, offset = 0 } = {}) =>
  unwrap(
    await db('bookings')
      .select(WITH_SLOT_AND_USER)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    'bookings.listAll'
  );

export const countForSlot = async (slotId) => {
  const { count, error } = await db('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId);
  unwrap({ data: true, error }, 'bookings.countForSlot');
  return count ?? 0;
};

export const count = async () => {
  const { count: total, error } = await db('bookings').select('id', { count: 'exact', head: true });
  unwrap({ data: true, error }, 'bookings.count');
  return total ?? 0;
};
