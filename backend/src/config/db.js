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

export const USE_LOCAL_DB = localDb.isLocalMode();

export const db = (table) => (USE_LOCAL_DB ? localDb.from(table) : supabase.from(table));

// Unwraps a query response: throws a tagged Error on failure, returns data on
// success. The original Postgres error code is preserved on `err.code` so
// services can map constraint violations (e.g. 23505) to friendly HTTP errors.
export const unwrap = ({ data, error }, context = 'db query') => {
  if (error) {
    const err = new Error(`${context}: ${error.message}`);
    err.code = error.code;
    err.cause = error;
    throw err;
  }
  return data;
};

// Boot-time connectivity probe. In local mode this just seeds the store and
// reports it; against Supabase it does a HEAD count on parking_slots. Non-fatal
// either way so the health endpoint stays up.
export const checkConnection = async () => {
  if (USE_LOCAL_DB) {
    localDb.ensureSeeded();
    logger.info(
      'Using the built-in LOCAL database (no Supabase configured). ' +
        'Demo data is loaded and persists to backend/.local-db.json. ' +
        'Set real SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in backend/.env (or USE_LOCAL_DB=false) to use Supabase.'
    );
    return true;
  }
  try {
    const { error } = await supabase
      .from('parking_slots')
      .select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    logger.info('Supabase connection OK');
    return true;
  } catch (err) {
    logger.warn(
      `Supabase not reachable (${err.message}). ` +
        'Check SUPABASE_URL / keys in backend/.env and that database/schema.sql has been run.'
    );
    return false;
  }
};
