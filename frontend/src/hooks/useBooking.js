// Booking state for the current user: list, create, cancel — with loading and
// error handling baked in so pages stay declarative.
import { useState, useCallback } from 'react';
import * as bookingService from '../services/bookingService.js';

export const useBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await bookingService.myBookings();
      setBookings(data.bookings);
      return data.bookings;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (payload) => {
    // No local try/catch: callers drive their own button morph (loading →
    // success/error) from this promise.
    const { data, message } = await bookingService.createBooking(payload);
    return { booking: data.booking, message };
  }, []);

  const cancelBooking = useCallback(async (id) => {
    const { data } = await bookingService.cancelBooking(id);
    // Reflect the cancellation locally so the list reflows via layout animation.
    setBookings((current) => current.map((b) => (b.id === id ? data.booking : b)));
    return data.booking;
  }, []);

  return { bookings, loading, error, fetchMyBookings, createBooking, cancelBooking };
};

export default useBooking;
