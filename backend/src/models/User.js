// Data access for the `users` table.
// Layering rule: controllers → services → models → supabase. Controllers never
// query the database directly.
import { db, unwrap } from '../config/db.js';

// Everything EXCEPT the bcrypt hash — the default shape returned to callers.
// Only findByEmail (login path) ever selects the password column.
export const SAFE_COLUMNS =
  'id, name, email, role, phone_number, vehicle_number, created_at, updated_at';

// PostgREST or() filters use commas/parens as syntax — strip them from user
// search input so a crafted search string can't alter the filter expression.
const sanitizeSearch = (value = '') => value.replace(/[,()]/g, ' ').trim();

export const create = async ({ name, email, password, phone_number, vehicle_number }) =>
  unwrap(
    await db('users')
      .insert({ name, email, password, phone_number, vehicle_number })
      .select(SAFE_COLUMNS)
      .single(),
    'users.create'
  );

// Includes the password hash — used ONLY by the login flow for bcrypt.compare.
export const findByEmail = async (email) =>
  unwrap(await db('users').select('*').eq('email', email).maybeSingle(), 'users.findByEmail');

export const findById = async (id) =>
  unwrap(await db('users').select(SAFE_COLUMNS).eq('id', id).maybeSingle(), 'users.findById');

export const updateById = async (id, fields) =>
  unwrap(
    await db('users').update(fields).eq('id', id).select(SAFE_COLUMNS).single(),
    'users.updateById'
  );

export const list = async ({ search = '', limit = 100, offset = 0 } = {}) => {
  const term = sanitizeSearch(search);
  let query = db('users')
    .select(SAFE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);

  const { data, error, count } = await query;
  unwrap({ data, error }, 'users.list');
  return { users: data, total: count ?? data.length };
};

// Used for notification broadcast fan-out.
export const listIds = async () => unwrap(await db('users').select('id'), 'users.listIds');

export const count = async () => {
  const { count: total, error } = await db('users').select('id', { count: 'exact', head: true });
  unwrap({ data: true, error }, 'users.count');
  return total ?? 0;
};
