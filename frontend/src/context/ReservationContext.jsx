// Active campus reservation + live countdown.
//
// A student/faculty/visitor holds ONE slot at a time. The hold lasts
// HOLD_MINUTES; a 1-second tick drives the countdown, warns near the end, and
// auto-cancels (releasing the slot server-side) when it expires. The active
// reservation is persisted so a refresh doesn't lose the timer.
//
// Reservations are created through the existing bookings API (a reservation is
// just a short, price-free hold) — no new backend surface, no commercial fields.
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as bookingService from '../services/bookingService.js';
import { useAuthContext } from './AuthContext.jsx';
import { useParkingContext } from './ParkingContext.jsx';
import { notify, notifySuccess, notifyError } from '../components/Notification/Notification.jsx';
import { HOLD_MS, HOLD_WARN_MS } from '../utils/campus.js';

const STORAGE_KEY = 'ps_reservation';
const ReservationContext = createContext(null);

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null;
  } catch {
    return null;
  }
};

export function ReservationProvider({ children }) {
  const { isAuthed } = useAuthContext();
  const { refresh } = useParkingContext();
  const [reservation, setReservation] = useState(load); // { bookingId, slot, qrCodeUrl, expiresAt, vehicleType, vehicleNumber, purpose, arrival }
  const [remainingMs, setRemainingMs] = useState(0);
  const warnedRef = useRef(false);

  const persist = (next) => {
    setReservation(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  // Release (auto on expiry, or manual). Best-effort cancel — a network hiccup
  // must still clear the local hold.
  const releaseReservation = useCallback(
    async ({ silent = false, expired = false } = {}) => {
      const current = reservation;
      if (!current) return;
      persist(null);
      warnedRef.current = false;
      try {
        await bookingService.cancelBooking(current.bookingId);
      } catch {
        /* already cancelled / offline — the local hold is cleared regardless */
      }
      refresh();
      if (!silent) {
        if (expired) notify('Reservation expired — the slot has been released', 'error');
        else notifySuccess('Reservation released');
      }
    },
    [reservation, refresh]
  );

  // Create a new hold. Returns the booking (with QR) so the page can show the
  // ticket. Throws on failure so the caller can surface the error inline.
  const startReservation = useCallback(
    async ({ slot, vehicleType, vehicleNumber, purpose, arrival }) => {
      const start = arrival ? new Date(arrival) : new Date();
      // A 2-hour parking window; the visible countdown is the HOLD, not this.
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const { data } = await bookingService.createBooking({
        slot_id: slot.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      const booking = data.booking;
      const next = {
        bookingId: booking.id,
        slot,
        qrCodeUrl: booking.qr_code_url,
        expiresAt: Date.now() + HOLD_MS,
        vehicleType,
        vehicleNumber,
        purpose,
        arrival: start.toISOString(),
      };
      warnedRef.current = false;
      persist(next);
      refresh();
      notifySuccess(`Slot ${slot.slot_number} reserved — arrive before the timer ends`);
      return booking;
    },
    [refresh]
  );

  // 1-second countdown tick.
  useEffect(() => {
    if (!reservation) {
      setRemainingMs(0);
      return undefined;
    }
    const tick = () => {
      const left = reservation.expiresAt - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= HOLD_WARN_MS && left > 0 && !warnedRef.current) {
        warnedRef.current = true;
        notify('Reservation expiring soon — head to your slot', 'info');
      }
      if (left <= 0) {
        releaseReservation({ expired: true });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation, releaseReservation]);

  // Clear the hold on logout (don't cancel server-side — the session is gone).
  useEffect(() => {
    if (!isAuthed && reservation) persist(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const value = useMemo(
    () => ({
      reservation,
      remainingMs,
      hasReservation: Boolean(reservation),
      startReservation,
      releaseReservation,
    }),
    [reservation, remainingMs, startReservation, releaseReservation]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export const useReservationContext = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservationContext must be used inside <ReservationProvider>');
  return ctx;
};
