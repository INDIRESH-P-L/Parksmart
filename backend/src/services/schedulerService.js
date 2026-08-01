// Background sweeps for the two time-based slot transitions.
//
//   1. Expired reservation holds  → back to 'available'   (Feature 1)
//   2. Abandoned check-ins        → force-checked-out      (Feature 3)
//
// DESIGN NOTE — why these sweeps are a safety net, not the mechanism.
// This codebase deploys to Vercel via api/index.js, which is invoked per
// request; server.js (the only place a timer could live) never runs there. A
// scheduler that silently doesn't fire in production would be worse than none,
// so expiry is ALSO enforced lazily wherever a slot is read or claimed
// (parkingService.isHoldActive + the conditional updates in ParkingSlot.js).
// The sweeps below just tidy up rows nobody has touched recently; if they never
// run, no user-visible behaviour is wrong — stale rows simply linger in the
// table until someone interacts with them.
//
// setInterval over node-cron: two fixed intervals need no cron expressions, no
// new dependency, and no timezone semantics. node-cron would buy scheduling
// expressiveness this doesn't use.
import * as ParkingSlot from '../models/ParkingSlot.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const MINUTE = 60 * 1000;
const HOLD_SWEEP_INTERVAL = 45 * 1000; // between the 30–60s the spec asks for
const CHECKOUT_SWEEP_INTERVAL = 10 * MINUTE; // threshold is hours; 10m is ample

// Releases every hold whose reserved_until has passed.
// Each release re-checks expiry in its WHERE clause, so a hold that got extended
// between the scan and the write is left untouched.
export const sweepExpiredHolds = async () => {
  const now = new Date().toISOString();
  const expired = await ParkingSlot.findExpiredHolds(now);
  if (!expired.length) return { released: 0, slots: [] };

  const released = [];
  for (const slot of expired) {
    const updated = await ParkingSlot.releaseExpiredHold(slot.id, now);
    if (updated) {
      released.push(updated.slot_number);
      logger.info(
        `Reservation hold expired on slot ${updated.slot_number} — released back to available.`
      );
    }
  }
  return { released: released.length, slots: released };
};

// Force-releases slots occupied beyond AUTO_CHECKOUT_HOURS. Covers the user who
// drove away without checking out, or whose session died mid-visit.
export const sweepStaleCheckIns = async () => {
  const cutoff = new Date(Date.now() - env.AUTO_CHECKOUT_HOURS * 60 * MINUTE).toISOString();
  const stale = await ParkingSlot.findStaleOccupied(cutoff);
  if (!stale.length) return { checkedOut: 0, slots: [] };

  const checkedOut = [];
  for (const slot of stale) {
    const updated = await ParkingSlot.forceCheckOutIfStale(slot.id, cutoff);
    if (updated) {
      checkedOut.push(updated.slot_number);
      // Audit trail: there is no events table in this schema, so a structured
      // log line is the record. Includes who held it and for how long.
      logger.warn(
        `AUTO-CHECKOUT slot=${updated.slot_number} user=${slot.occupied_by ?? 'unknown'} ` +
          `name=${slot.occupied_by_name ?? 'unknown'} checked_in_at=${slot.check_in_time} ` +
          `threshold=${env.AUTO_CHECKOUT_HOURS}h`
      );
    }
  }
  return { checkedOut: checkedOut.length, slots: checkedOut };
};

// One pass of both sweeps. Exported so the internal endpoint (driven by a
// platform cron on serverless) runs exactly what the timers run.
export const runAllSweeps = async () => {
  const [holds, checkouts] = await Promise.all([
    sweepExpiredHolds().catch((err) => {
      logger.error('Hold sweep failed:', err.message);
      return { released: 0, slots: [], error: err.message };
    }),
    sweepStaleCheckIns().catch((err) => {
      logger.error('Auto-checkout sweep failed:', err.message);
      return { checkedOut: 0, slots: [], error: err.message };
    }),
  ]);
  return { holds, checkouts };
};

let timers = [];

// Starts the in-process timers. No-ops when already started or disabled, so
// importing this module twice can't double-schedule.
export const startScheduler = () => {
  if (!env.schedulerEnabled) {
    logger.info('Scheduler disabled (ENABLE_SCHEDULER=false) — sweeps must be driven externally.');
    return false;
  }
  if (timers.length) return false;

  // A sweep that throws must never take the process down, hence the .catch on
  // each tick. unref() lets the process exit without waiting on these timers.
  const hold = setInterval(() => {
    sweepExpiredHolds().catch((err) => logger.error('Hold sweep failed:', err.message));
  }, HOLD_SWEEP_INTERVAL);

  const checkout = setInterval(() => {
    sweepStaleCheckIns().catch((err) => logger.error('Auto-checkout sweep failed:', err.message));
  }, CHECKOUT_SWEEP_INTERVAL);

  hold.unref();
  checkout.unref();
  timers = [hold, checkout];

  logger.info(
    `Scheduler started — holds expire after ${env.RESERVATION_HOLD_MINUTES}m (swept every ` +
      `${HOLD_SWEEP_INTERVAL / 1000}s), auto-checkout after ${env.AUTO_CHECKOUT_HOURS}h ` +
      `(swept every ${CHECKOUT_SWEEP_INTERVAL / MINUTE}m).`
  );
  return true;
};

export const stopScheduler = () => {
  timers.forEach(clearInterval);
  timers = [];
};
