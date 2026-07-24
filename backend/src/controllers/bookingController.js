// Booking endpoints.
import { asyncHandler, ok, created } from '../utils/response.js';
import * as bookingService from '../services/bookingService.js';

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user, req.body);
  return created(res, { booking }, 'Booking confirmed — show the QR ticket at the gate');
});

export const myBookings = asyncHandler(async (req, res) =>
  ok(res, { bookings: await bookingService.myBookings(req.user) }, 'Your bookings')
);

export const getBooking = asyncHandler(async (req, res) =>
  ok(res, { booking: await bookingService.getBooking(req.user, req.params.id) }, 'Booking')
);

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.user, req.params.id);
  return ok(res, { booking }, 'Booking cancelled');
});

export const verifyQr = asyncHandler(async (req, res) => {
  const result = await bookingService.verifyQr(req.body.qr_data);
  const label = result.direction === 'check-in' ? 'Checked in' : 'Checked out';
  return ok(res, result, `${label} successfully`);
});
