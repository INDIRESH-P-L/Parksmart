// Data access for the `feedback` table (contact form + slot ratings).
import { db, unwrap } from '../config/db.js';

export const create = async ({ user_id, slot_id, message, rating }) =>
  unwrap(
    await db('feedback').insert({ user_id, slot_id, message, rating }).select().single(),
    'feedback.create'
  );

// Admin review view — embeds author (safe columns) and slot for context.
export const listAll = async ({ limit = 100 } = {}) =>
  unwrap(
    await db('feedback')
      .select('*, user:users(id, name, email), slot:parking_slots(id, slot_number, zone_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
    'feedback.listAll'
  );
