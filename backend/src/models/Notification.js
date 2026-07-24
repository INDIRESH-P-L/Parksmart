// Data access for the `notifications` table.
import { db, unwrap } from '../config/db.js';

export const listByUser = async (userId) =>
  unwrap(
    await db('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    'notifications.listByUser'
  );

export const findById = async (id) =>
  unwrap(await db('notifications').select('*').eq('id', id).maybeSingle(), 'notifications.findById');

export const create = async ({ user_id, title, message }) =>
  unwrap(
    await db('notifications').insert({ user_id, title, message }).select().single(),
    'notifications.create'
  );

// Bulk insert for admin broadcasts (one row per user keeps read-state per-user).
export const createMany = async (rows) =>
  unwrap(await db('notifications').insert(rows).select('id'), 'notifications.createMany');

export const update = async (id, fields) =>
  unwrap(
    await db('notifications').update(fields).eq('id', id).select().single(),
    'notifications.update'
  );
