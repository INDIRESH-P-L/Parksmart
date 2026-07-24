// Booking API calls.
import api from './api.js';

export const createBooking = ({ slot_id, start_time, end_time }) =>
  api.post('/bookings/create', {
    slot_id,
    ...(start_time ? { start_time: new Date(start_time).toISOString() } : {}),
    ...(end_time ? { end_time: new Date(end_time).toISOString() } : {}),
  });

export const myBookings = () => api.get('/bookings/my-bookings');
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`);

// Gate staff (admin/operator): scan result → check-in / check-out.
export const verifyQr = (qrData) => api.post('/bookings/verify-qr', { qr_data: qrData });
