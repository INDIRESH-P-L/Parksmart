// Data access for the `favorites` table (starred slots, quick-book).
import { db, unwrap } from '../config/db.js';

export const listByUser = async (userId) =>
  unwrap(
    await db('favorites')
      .select('id, created_at, slot:parking_slots(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'favorites.listByUser'
  );

// The unique (user_id, slot_id) constraint makes duplicates a 23505 error —
// parkingService maps that to a friendly 409.
export const add = async (userId, slotId) =>
  unwrap(
    await db('favorites')
      .insert({ user_id: userId, slot_id: slotId })
      .select('id, created_at, slot:parking_slots(*)')
      .single(),
    'favorites.add'
  );

// Returns the deleted rows so the caller can 404 when nothing matched.
export const remove = async (userId, slotId) =>
  unwrap(
    await db('favorites').delete().eq('user_id', userId).eq('slot_id', slotId).select('id'),
    'favorites.remove'
  );
