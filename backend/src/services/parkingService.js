// Parking domain logic: slot catalogue, zone availability, admin heat map,
// admin slot CRUD, and favorites (favorites are parking-domain: starred slots).
import * as ParkingSlot from '../models/ParkingSlot.js';
import * as Booking from '../models/Booking.js';
import * as Favorite from '../models/Favorite.js';
import { ApiError } from '../utils/response.js';
import { env } from '../config/env.js';

export const listSlots = (filters = {}) => ParkingSlot.list(filters);

export const getSlot = async (id) => {
  const slot = await ParkingSlot.findById(id);
  if (!slot) throw new ApiError(404, 'Parking slot not found');
  return slot;
};

// Zone-wise live counts for public dashboard widgets.
export const availability = async () => {
  const slots = await ParkingSlot.list({});
  const totals = { total: 0, available: 0, occupied: 0, reserved: 0 };
  const zones = new Map();

  for (const slot of slots) {
    totals.total += 1;
    totals[slot.status] += 1;

    const key = slot.zone_name || 'Unzoned';
    const zone = zones.get(key) ?? { zone: key, total: 0, available: 0, occupied: 0, reserved: 0 };
    zone.total += 1;
    zone[slot.status] += 1;
    zones.set(key, zone);
  }

  return {
    totals,
    zones: [...zones.values()].sort((a, b) => a.zone.localeCompare(b.zone)),
  };
};

// Admin heat map: availability plus occupancy density and a geographic centre
// per zone, so the frontend can draw intensity overlays on the campus map.
// Aggregates only — no user data leaves this endpoint.
export const heatmap = async () => {
  const slots = await ParkingSlot.list({});
  const zones = new Map();

  for (const slot of slots) {
    const key = slot.zone_name || 'Unzoned';
    const zone =
      zones.get(key) ??
      { zone: key, total: 0, available: 0, occupied: 0, reserved: 0, latSum: 0, lngSum: 0 };
    zone.total += 1;
    zone[slot.status] += 1;
    zone.latSum += slot.latitude;
    zone.lngSum += slot.longitude;
    zones.set(key, zone);
  }

  return [...zones.values()]
    .map(({ latSum, lngSum, ...zone }) => ({
      ...zone,
      // density ∈ [0,1]: share of the zone that is taken (occupied or reserved)
      density: zone.total ? Math.round(((zone.occupied + zone.reserved) / zone.total) * 100) / 100 : 0,
      center: {
        latitude: zone.total ? latSum / zone.total : 0,
        longitude: zone.total ? lngSum / zone.total : 0,
      },
    }))
    .sort((a, b) => b.density - a.density);
};

// ── admin slot CRUD ──────────────────────────────────────────────────────────
export const createSlot = async (fields) => {
  try {
    return await ParkingSlot.create(fields);
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'A slot with this slot_number already exists');
    throw err;
  }
};

export const updateSlot = async (id, fields) => {
  await getSlot(id); // 404 before attempting the update
  try {
    return await ParkingSlot.update(id, fields);
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'A slot with this slot_number already exists');
    throw err;
  }
};

// Slots with booking history are soft-deleted (is_active = false) so past
// tickets and analytics keep valid joins; never-booked slots are removed
// outright. The API response tells the admin which happened.
export const deleteSlot = async (id) => {
  await getSlot(id);
  const historyCount = await Booking.countForSlot(id);

  if (historyCount > 0) {
    await ParkingSlot.update(id, { is_active: false });
    return { deleted: 'soft', reason: `${historyCount} booking(s) reference this slot` };
  }

  await ParkingSlot.hardDelete(id);
  return { deleted: 'hard' };
};

// ── favorites ────────────────────────────────────────────────────────────────
export const listFavorites = (userId) => Favorite.listByUser(userId);

export const addFavorite = async (userId, slotId) => {
  await getSlot(slotId); // friendly 404 instead of a raw FK violation
  try {
    return await Favorite.add(userId, slotId);
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'Slot is already in your favorites');
    throw err;
  }
};

export const removeFavorite = async (userId, slotId) => {
  const removed = await Favorite.remove(userId, slotId);
  if (removed.length === 0) throw new ApiError(404, 'Favorite not found');
};

// ── reservation holds ─────────────────────────────────────────────────────────
// A hold is "live" only while reserved_until is in the future. Everything that
// reads a slot treats an elapsed hold as already gone, so correctness never
// depends on the sweep job having run.
export const isHoldActive = (slot, now = Date.now()) =>
  Boolean(slot?.reserved_until) && new Date(slot.reserved_until).getTime() > now;

// Places a short exclusive hold so a user can drive to the slot without losing
// it. Additive: check-in still works on a plain available slot.
export const reserveSlot = async (id, user) => {
  if (!user) throw new ApiError(401, 'Authentication required to reserve a parking slot.');

  const slot = await getSlot(id);
  if (!slot.is_active) throw new ApiError(400, `Slot ${slot.slot_number} is not available for reservation.`);
  if (slot.status === 'occupied') {
    throw new ApiError(400, `Slot ${slot.slot_number} is already marked as occupied.`);
  }

  const holdActive = isHoldActive(slot);
  // Re-holding your own live slot is idempotent: extend rather than 409, so a
  // retry or a double-tap doesn't punish the user who already owns the hold.
  if (holdActive && slot.reserved_by && slot.reserved_by !== user.id) {
    throw new ApiError(409, `Slot ${slot.slot_number} is currently reserved by another user.`);
  }

  const reservedUntil = new Date(
    Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000
  ).toISOString();

  // Clear an elapsed hold first so the atomic 'available' claim below can match.
  if (!holdActive && slot.status === 'reserved') {
    await ParkingSlot.releaseExpiredHold(id);
  }

  const held = holdActive
    ? await ParkingSlot.update(id, { reserved_by: user.id, reserved_until: reservedUntil })
    : await ParkingSlot.holdIfAvailable(id, { reservedBy: user.id, reservedUntil });

  // Null = another request won the race between our read and our write.
  if (!held) {
    throw new ApiError(409, `Slot ${slot.slot_number} was just taken. Please pick another slot.`);
  }

  return {
    slot: held,
    status: 'reserved',
    message: `Slot ${slot.slot_number} is held for you for ${env.RESERVATION_HOLD_MINUTES} minutes.`,
    reserved_until: held.reserved_until ?? reservedUntil,
  };
};

// ── check in / check out ──────────────────────────────────────────────────────
export const checkInSlot = async (id, user = null) => {
  const slot = await getSlot(id);
  if (slot.status === 'occupied') {
    throw new ApiError(400, `Slot ${slot.slot_number} is already marked as occupied.`);
  }

  // A live hold belonging to someone else blocks check-in. An elapsed hold is
  // treated as free right here, without waiting for the sweep job.
  const holdActive = isHoldActive(slot);
  if (holdActive && user && slot.reserved_by && slot.reserved_by !== user.id) {
    throw new ApiError(409, `Slot ${slot.slot_number} is currently reserved by another user.`);
  }

  // Rule 2: One user must not check in more than one slot at a time!
  if (user) {
    const allSlots = await ParkingSlot.list({ includeInactive: true });
    const slotsList = Array.isArray(allSlots) ? allSlots : (allSlots.slots || []);
    const userOccupiedSlot = slotsList.find(
      (s) => s.status === 'occupied' && s.occupied_by === user.id
    );

    if (userOccupiedSlot) {
      throw new ApiError(
        400,
        `You are already checked in at slot ${userOccupiedSlot.slot_number}. Please check out from slot ${userOccupiedSlot.slot_number} before checking in to another slot.`
      );
    }
  }

  // Claim the row atomically. The status we assert depends on how we got here:
  // redeeming our own live hold means the row is legitimately 'reserved'.
  const claimingOwnHold = holdActive && user && slot.reserved_by === user.id;
  if (!holdActive && slot.status === 'reserved') {
    // Elapsed hold — drop it so the 'available' claim below can match.
    await ParkingSlot.releaseExpiredHold(id);
  }

  const updatedSlot = await ParkingSlot.checkInIfClaimable(id, {
    expectedStatus: claimingOwnHold ? 'reserved' : 'available',
    occupiedBy: user ? user.id : null,
    occupiedByName: user ? user.name : null,
  });

  // Zero rows matched → someone else claimed it in the interim. Same 400 the
  // app already renders for "already occupied".
  if (!updatedSlot) {
    throw new ApiError(400, `Slot ${slot.slot_number} is already marked as occupied.`);
  }

  return {
    slot: updatedSlot,
    status: 'occupied',
    message: `Successfully checked in to slot ${slot.slot_number}.`,
    check_in_time: updatedSlot.check_in_time || new Date().toISOString(),
  };
};

export const checkOutSlot = async (id, user = null) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required to check out from a parking slot.');
  }

  const slot = await getSlot(id);

  if (slot.status !== 'occupied') {
    throw new ApiError(400, `Slot ${slot.slot_number} is not currently occupied.`);
  }

  // Strict ownership check: One user CANNOT check out another user's checkin!
  if (slot.occupied_by && slot.occupied_by !== user.id) {
    throw new ApiError(
      403,
      `You cannot check out from slot ${slot.slot_number} because it was checked in by another user.`
    );
  }

  const updatedSlot = await ParkingSlot.update(id, {
    status: 'available',
    occupied_by: null,
    occupied_by_name: null,
    check_in_time: null,
  });

  return {
    slot: updatedSlot,
    status: 'available',
    message: `Successfully checked out from slot ${slot.slot_number}.`,
    check_out_time: new Date().toISOString(),
  };
};

