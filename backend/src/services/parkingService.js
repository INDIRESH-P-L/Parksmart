// Parking domain logic: slot catalogue, zone availability, admin heat map,
// admin slot CRUD, and favorites (favorites are parking-domain: starred slots).
import * as ParkingSlot from '../models/ParkingSlot.js';
import * as Booking from '../models/Booking.js';
import * as Favorite from '../models/Favorite.js';
import { ApiError } from '../utils/response.js';

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

// ── check in / check out ──────────────────────────────────────────────────────
export const checkInSlot = async (id, user = null) => {
  const slot = await getSlot(id);
  if (slot.status === 'occupied') {
    throw new ApiError(400, `Slot ${slot.slot_number} is already marked as occupied.`);
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

  const updatedSlot = await ParkingSlot.update(id, {
    status: 'occupied',
    occupied_by: user ? user.id : null,
    occupied_by_name: user ? user.name : null,
    check_in_time: new Date().toISOString(),
  });

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

