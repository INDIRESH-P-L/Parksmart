// A booking in My Bookings / dashboard lists. The QR thumbnail morphs into a
// full-screen ticket via a shared layoutId, and cancellable bookings expose a
// cancel action (confirmed via modal by the parent page).
import { useState } from 'react';
import { m } from 'framer-motion';
import { FiClock, FiMapPin, FiXCircle, FiMaximize2 } from 'react-icons/fi';
import MorphCard from '../MorphCard/MorphCard.jsx';
import Modal from '../Modal/Modal.jsx';
import Button from '../Button/Button.jsx';
import { BOOKING_STATUS } from '../../utils/constants.js';
import { formatDateTime, relativeTime } from '../../utils/formatDate.js';
import { cn } from '../../utils/helpers.js';

export default function BookingCard({ booking, onCancel, layoutIdPrefix = 'booking' }) {
  const [ticketOpen, setTicketOpen] = useState(false);
  const status = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.pending;
  const cancellable = ['pending', 'confirmed'].includes(booking.status) && onCancel;
  const showQr = booking.qr_code_url && ['confirmed', 'active'].includes(booking.status);

  return (
    <>
      <MorphCard layoutId={`${layoutIdPrefix}-${booking.id}`} className="rounded-card p-4 md:p-5">
        <div className="flex items-start gap-4">
          {/* QR thumbnail — shares `qr-{id}` with the fullscreen ticket morph */}
          {showQr && (
            <m.button
              layoutId={`qr-${booking.id}`}
              onClick={() => setTicketOpen(true)}
              whileTap={{ scale: 0.94 }}
              className="relative hidden shrink-0 overflow-hidden rounded-2xl sm:block"
              aria-label="Open QR ticket"
            >
              <img src={booking.qr_code_url} alt="Booking QR" className="h-20 w-20" />
              <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <FiMaximize2 className="h-5 w-5 text-white" />
              </span>
            </m.button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold">
                {booking.slot?.slot_number ?? 'Slot'}
                <span className="ml-2 text-xs font-normal text-[var(--text-sec)]">
                  <FiMapPin className="mr-0.5 inline h-3 w-3" />
                  {booking.slot?.zone_name ?? '—'}
                </span>
              </h3>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', status.badge)}>
                {status.label}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-sec)]">
              <FiClock className="h-3.5 w-3.5 shrink-0" />
              {formatDateTime(booking.start_time)} → {formatDateTime(booking.end_time)}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-mut)]">
              {booking.status === 'active'
                ? `Checked in ${relativeTime(booking.check_in_time)}`
                : booking.status === 'completed'
                  ? `Checked out ${relativeTime(booking.check_out_time)}`
                  : `Starts ${relativeTime(booking.start_time)}`}
            </p>

            <div className="mt-3 flex gap-2">
              {showQr && (
                <Button variant="glass" size="sm" onClick={() => setTicketOpen(true)} className="sm:hidden">
                  Show QR
                </Button>
              )}
              {cancellable && (
                <Button variant="danger" size="sm" onClick={() => onCancel(booking)}>
                  <FiXCircle className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </MorphCard>

      {/* Fullscreen ticket — the thumbnail morphs into this */}
      <Modal open={ticketOpen} onClose={() => setTicketOpen(false)} className="max-w-sm text-center">
        <m.div layoutId={`qr-${booking.id}`} className="mx-auto w-fit overflow-hidden rounded-3xl bg-white p-3">
          <img src={booking.qr_code_url} alt="Booking QR ticket" className="h-56 w-56" />
        </m.div>
        <h3 className="mt-4 text-lg font-bold">{booking.slot?.slot_number}</h3>
        <p className="text-sm text-[var(--text-sec)]">
          {formatDateTime(booking.start_time)} → {formatDateTime(booking.end_time)}
        </p>
        <p className="mt-2 text-xs text-[var(--text-mut)]">
          Show this at the gate — first scan checks you in, second checks you out.
        </p>
      </Modal>
    </>
  );
}
