// Booking lifecycle: create (race-safe) → QR ticket → check-in/out via QR →
// cancel. Slot status itself is kept consistent by the DB trigger
// (database/triggers.sql) whenever a booking's status or check-in/out changes;
// this service only flips the slot directly for the atomic reservation guard.
import * as Booking from '../models/Booking.js';
import * as ParkingSlot from '../models/ParkingSlot.js';
import { createBookingQr, verifyQrPayload } from './qrService.js';
import { notifyUser } from './notificationService.js';
import { sendBookingConfirmation, sendBookingCancellation } from './emailService.js';
import { generateRef } from '../utils/generateId.js';
import { ApiError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const HOUR_MS = 60 * 60 * 1000;
const QUARTER_MS = 15 * 60 * 1000;

// Price = hourly_rate prorated in 15-minute increments (minimum one increment),
// rounded to 2 decimals. Assumption: simple flat prorating, no day/night rates.
const priceFor = (hourlyRate, start, end) => {
  const quarters = Math.max(1, Math.ceil((end - start) / QUARTER_MS));
  return Math.round(Number(hourlyRate || 0) * (quarters / 4) * 100) / 100;
};

export const createBooking = async (user, { slot_id, start_time, end_time }) => {
  // Defaults: "book from now, for 1 hour" when the picker sends nothing.
  const start = start_time ?? new Date();
  const end = end_time ?? new Date(start.getTime() + HOUR_MS);

  if (end <= start) throw new ApiError(422, 'end_time must be after start_time');
  // 5-minute grace so "book for right now" survives client/server clock skew.
  if (start.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new ApiError(422, 'start_time cannot be in the past');
  }
  if (end - start > 24 * HOUR_MS) throw new ApiError(422, 'Bookings are limited to 24 hours');

  const slot = await ParkingSlot.findById(slot_id);
  if (!slot || !slot.is_active) throw new ApiError(404, 'Parking slot not found');

  // Guard 1 — reject overlapping open bookings on this slot (time-window check).
  if (await Booking.overlapExists(slot_id, start, end)) {
    throw new ApiError(409, 'This slot is already booked for that time window');
  }

  // Guard 2 — RACE CONDITION guard: atomic conditional UPDATE
  // (`... WHERE status = 'available'`). Postgres row-locks the slot, so of two
  // simultaneous requests exactly one wins; the loser gets null → 409.
  const reserved = await ParkingSlot.reserveIfAvailable(slot_id);
  if (!reserved) throw new ApiError(409, 'This slot was just taken — please pick another one');

  try {
    // Spec flow: create as 'pending' → attach QR ticket → promote to 'confirmed'.
    const ref = generateRef('PS');
    let booking = await Booking.create({
      user_id: user.id,
      slot_id,
      booking_time: new Date().toISOString(),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      total_price: priceFor(slot.hourly_rate, start, end),
      status: 'pending',
    });

    const { dataUrl } = await createBookingQr(booking.id, ref);
    booking = await Booking.update(booking.id, { qr_code_url: dataUrl, status: 'confirmed' });

    // Side effects are fire-and-forget: a notification/email hiccup must never
    // roll back a confirmed booking.
    notifyUser(
      user.id,
      'Booking confirmed',
      `Slot ${slot.slot_number} (${slot.zone_name ?? 'campus'}) is yours. Show your QR ticket at the gate.`
    ).catch((err) => logger.warn(`notify failed: ${err.message}`));
    sendBookingConfirmation(user, booking).catch((err) =>
      logger.warn(`confirmation email failed: ${err.message}`)
    );

    return booking;
  } catch (err) {
    // Roll the slot back so a failed insert never strands it in 'reserved'.
    await ParkingSlot.setStatus(slot_id, 'available').catch(() => {});
    throw err;
  }
};

export const myBookings = (user) => Booking.listByUser(user.id);

export const getBooking = async (user, id) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const isOwner = booking.user_id === user.id;
  const isStaff = user.role === 'admin' || user.role === 'operator'; // gate staff may look up any ticket
  if (!isOwner && !isStaff) throw new ApiError(403, 'This booking does not belong to you');
  return booking;
};

export const cancelBooking = async (user, id) => {
  const booking = await getBooking(user, id);

  // Operators can *view* any booking but only the owner or an admin may cancel.
  if (booking.user_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Only the booking owner or an admin can cancel this booking');
  }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(409, `A ${booking.status} booking cannot be cancelled`);
  }

  // The DB trigger releases the slot (unless another open booking holds it).
  const updated = await Booking.update(id, { status: 'cancelled' });

  notifyUser(
    booking.user_id,
    'Booking cancelled',
    `Your booking for slot ${booking.slot?.slot_number ?? ''} was cancelled.`
  ).catch((err) => logger.warn(`notify failed: ${err.message}`));
  sendBookingCancellation(user, booking).catch((err) =>
    logger.warn(`cancellation email failed: ${err.message}`)
  );

  return updated;
};

// Gate scan (admin/operator). One QR drives both directions:
//   first valid scan  → check-in  (booking → active, trigger sets slot occupied)
//   second valid scan → check-out (booking → completed, trigger frees the slot)
//   third scan        → rejected ("already used")
export const verifyQr = async (rawQrData) => {
  const { bookingId } = verifyQrPayload(rawQrData); // throws 400/401 on bad payload/signature

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'No booking found for this QR code');
  if (booking.status === 'cancelled') throw new ApiError(409, 'This booking was cancelled');
  if (booking.status === 'completed' || booking.check_out_time) {
    throw new ApiError(409, 'Ticket already used — this booking is completed');
  }

  if (!booking.check_in_time) {
    const updated = await Booking.update(bookingId, {
      check_in_time: new Date().toISOString(),
      status: 'active',
    });
    return { direction: 'check-in', booking: updated };
  }

  const updated = await Booking.update(bookingId, {
    check_out_time: new Date().toISOString(),
    status: 'completed',
  });
  return { direction: 'check-out', booking: updated };
};
