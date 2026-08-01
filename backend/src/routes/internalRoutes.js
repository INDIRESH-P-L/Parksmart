// Internal maintenance endpoints — not part of the public API surface.
//
// Exists because the Vercel deployment (api/index.js) is invoked per request:
// server.js never runs there, so its in-process sweep timers never fire. A
// platform cron (Vercel Cron, GitHub Actions, cron-job.org, …) POSTs here on a
// schedule to drive the same sweeps.
//
// Auth is a shared secret in a header rather than a user JWT — the caller is a
// machine, not a person, and it must not need an account. When SWEEP_SECRET is
// unset the route is disabled outright rather than left publicly callable.
import { Router } from 'express';
import { runAllSweeps } from '../services/schedulerService.js';
import { asyncHandler, ok, fail } from '../utils/response.js';
import { env } from '../config/env.js';

const router = Router();

const requireSweepSecret = (req, res, next) => {
  if (!env.SWEEP_SECRET) {
    return fail(res, 404, 'Route not found: POST /api/v1/internal/sweep');
  }
  const provided = req.get('x-sweep-secret');
  // Length check first so the comparison below can't be used as a length oracle.
  if (!provided || provided !== env.SWEEP_SECRET) {
    return fail(res, 401, 'Invalid or missing sweep secret');
  }
  return next();
};

router.post(
  '/sweep',
  requireSweepSecret,
  asyncHandler(async (_req, res) => ok(res, await runAllSweeps(), 'Sweeps completed'))
);

export default router;
