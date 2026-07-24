// Central error funnel — every thrown/next()'d error becomes the standard
// { success:false, data:null, message } envelope. Expected errors (ApiError)
// pass their status/message through; unknown errors are logged with a stack
// trace but never leak internals to the client in production.
import { ApiError, fail } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFound = (req, res) =>
  fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);

// eslint-disable-next-line no-unused-vars — Express identifies error middleware by arity (4 args).
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return fail(res, err.status, err.message, err.errors);
  }

  // Malformed JSON body rejected by express.json()
  if (err.type === 'entity.parse.failed') {
    return fail(res, 400, 'Malformed JSON in request body');
  }

  // Database unreachable (DNS/connection failure to Supabase) — almost always
  // placeholder/wrong SUPABASE_* values in .env or no network. Surface a clear
  // 503 instead of a cryptic "TypeError: fetch failed".
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT/i.test(err.message || '')) {
    logger.error(`Supabase unreachable on ${req.method} ${req.originalUrl}: ${err.message}`);
    return fail(
      res,
      503,
      'Database unreachable — set real SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY values in backend/.env and make sure schema.sql has been run (see README).'
    );
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err.stack || err);
  return fail(res, 500, env.isProd ? 'Internal server error' : `Internal error: ${err.message}`);
};
