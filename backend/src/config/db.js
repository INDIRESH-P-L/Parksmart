// Thin data-access helpers shared by every model.
// Models never touch the database client directly — they go through
// db()/unwrap() so error handling is uniform and Postgres error codes
// (e.g. 23505 unique_violation) survive for the service layer to interpret.
//
// db() resolves to ONE of two backends, chosen once at boot:
//   - Supabase (production / when real SUPABASE_* creds are configured), or
//   - the built-in LOCAL database (config/localDb.js) for zero-setup running.
// Every model works unchanged against either, because localDb implements the
// same supabase-js query-builder surface the models rely on.
import { supabase } from './supabase.js';
import * as localDb from './localDb.js';
import { logger } from '../utils/logger.js';

let useLocalFallback = false;

export const USE_LOCAL_DB = localDb.isLocalMode();

export const db = (table) => {
  if (USE_LOCAL_DB || useLocalFallback) return localDb.from(table);
  return supabase.from(table);
};

// Unwraps a query response: throws a tagged Error on failure, returns data on
// success. The original Postgres error code is preserved on `err.code` so
// services can map constraint violations (e.g. 23505) to friendly HTTP errors.
export const unwrap = ({ data, error }, context = 'db query') => {
  if (error) {
    if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
      useLocalFallback = true;
      localDb.ensureSeeded();
      throw new Error(`Table missing in Supabase schema (${error.message}). Switched to local fallback store.`);
    }
    const err = new Error(`${context}: ${error.message}`);
    err.code = error.code;
    err.cause = error;
    throw err;
  }
  return data;
};

// Boot-time connectivity probe.
export const checkConnection = async () => {
  if (USE_LOCAL_DB) {
    localDb.ensureSeeded();
    logger.info('Using LOCAL database (Sri Eshwar College of Engineering seeded dataset).');
    return true;
  }
  try {
    const { error: slotsErr } = await supabase
      .from('parking_slots')
      .select('id', { count: 'exact', head: true });
    const { error: usersErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (slotsErr || usersErr) {
      useLocalFallback = true;
      localDb.ensureSeeded();
      logger.info(
        'Connected to Supabase REST API, but schema tables (parking_slots / users) are not yet created in remote database. ' +
        'Running with Sri Eshwar College dataset fallback. To persist in Supabase, execute backend/src/database/schema.sql in Supabase SQL Editor and run `npm run seed`.'
      );
      return true;
    }
    logger.info('Supabase connection OK — connected to Supabase Cloud Database!');
    return true;
  } catch (err) {
    useLocalFallback = true;
    localDb.ensureSeeded();
    logger.warn(`Supabase query warning (${err.message}). Using local fallback store.`);
    return true;
  }
};
