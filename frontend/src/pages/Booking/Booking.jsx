// Booking flow — slot summary, date/time window with live price preview
// (mirrors the server's 15-min increment rule), and a confirm CTA that morphs
// CTA → spinner → ✓ as one element. Success reveals the QR ticket.
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiArrowLeft, FiCalendar } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import MorphCard from '../../components/MorphCard/MorphCard.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useBooking } from '../../hooks/useBooking.js';
import * as parkingService from '../../services/parkingService.js';
import { notifyError } from '../../components/Notification/Notification.jsx';
import { validateBookingWindow } from '../../utils/validators.js';
import { toLocalInputValue, formatDateTime } from '../../utils/formatDate.js';
import { estimatePrice, formatCurrency, cn } from '../../utils/helpers.js';
import { SLOT_STATUS } from '../../utils/constants.js';
import { SPRING, EASE } from '../../utils/motionPresets.js';

export default function Booking() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const { createBooking } = useBooking();

  const [slot, setSlot] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [start, setStart] = useState(() => toLocalInputValue(new Date()));
  const [end, setEnd] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [booking, setBooking] = useState(null); // the confirmed booking (with QR)

  useEffect(() => {
    parkingService
      .getSlot(slotId)
      .then(({ data }) => setSlot(data.slot))
      .catch((err) => setLoadError(err.message));
  }, [slotId]);

  const price = useMemo(
    () => (slot ? estimatePrice(slot.hourly_rate, start, end) : 0),
    [slot, start, end]
  );

  const handleConfirm = async () => {
    const windowErrors = validateBookingWindow(start, end);
    setErrors(windowErrors);
    if (Object.keys(windowErrors).length) return;

    setSubmitting(true);
    try {
      const result = await createBooking({ slot_id: slotId, start_time: start, end_time: end });
      setBooking(result.booking);
      setDone(true); // Button morphs to ✓, then the ticket panel takes over
    } catch (err) {
      notifyError(err.message); // includes the 409 "just taken" conflict case
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <PageTransition>
        <GlassPanel className="rounded-card p-10 text-center">
          <p className="text-sm text-danger">{loadError}</p>
          <Button variant="glass" className="mt-5" onClick={() => navigate('/map')}>
            Back to map
          </Button>
        </GlassPanel>
      </PageTransition>
    );
  }

  if (!slot) return <Loader variant="page" label="Loading slot…" />;

  const status = SLOT_STATUS[slot.status] ?? SLOT_STATUS.available;

  return (
    <PageTransition>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-sec)] hover:text-[var(--text)]"
      >
        <FiArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          {!done ? (
            <m.div
              key="form"
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: EASE } }}
            >
              <GlassPanel className="rounded-sheet p-6 md:p-8">
                <h1 className="text-2xl font-bold tracking-tight">Book your spot</h1>

                {/* slot summary */}
                <div className="mt-5 flex items-center justify-between rounded-card bg-white/5 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
                      <p className="text-lg font-bold">{slot.slot_number}</p>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-sec)]">
                      <FiMapPin className="h-3 w-3" /> {slot.zone_name}
                      {slot.floor ? ` · ${slot.floor}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-accent">
                    {formatCurrency(slot.hourly_rate)}<span className="text-[10px] font-normal">/hr</span>
                  </p>
                </div>

                {slot.status !== 'available' && (
                  <p className="mt-4 rounded-input bg-warn/10 px-4 py-2.5 text-sm text-warn">
                    Heads up — this slot is currently {status.label.toLowerCase()}. The server will
                    reject the booking if it's still taken when you confirm.
                  </p>
                )}

                {/* time window */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="start" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-sec)]">
                      <FiCalendar className="h-3.5 w-3.5" /> From
                    </label>
                    <input
                      id="start"
                      type="datetime-local"
                      value={start}
                      onChange={(event) => setStart(event.target.value)}
                      className={cn('input-glass', errors.start && 'input-error')}
                    />
                    {errors.start && <p className="mt-1 text-xs text-danger">{errors.start}</p>}
                  </div>
                  <div>
                    <label htmlFor="end" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-sec)]">
                      <FiCalendar className="h-3.5 w-3.5" /> Until
                    </label>
                    <input
                      id="end"
                      type="datetime-local"
                      value={end}
                      onChange={(event) => setEnd(event.target.value)}
                      className={cn('input-glass', errors.end && 'input-error')}
                    />
                    {errors.end && <p className="mt-1 text-xs text-danger">{errors.end}</p>}
                  </div>
                </div>

                {/* live price preview */}
                <div className="mt-5 flex items-center justify-between rounded-card bg-accent/10 px-5 py-4">
                  <p className="text-sm text-[var(--text-sec)]">Estimated total</p>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <m.p
                      key={price}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: SPRING }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-2xl font-bold text-accent"
                    >
                      {formatCurrency(price)}
                    </m.p>
                  </AnimatePresence>
                </div>
                <p className="mt-2 text-right text-[11px] text-[var(--text-mut)]">
                  Billed in 15-minute increments — same rule as the server.
                </p>

                <Button size="lg" className="mt-6 w-full" loading={submitting} onClick={handleConfirm}>
                  Confirm booking
                </Button>
              </GlassPanel>
            </m.div>
          ) : (
            /* ── success: animated check + QR ticket ── */
            <m.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1, transition: SPRING }}>
              <GlassPanel className="rounded-sheet p-8 text-center">
                <m.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0, transition: { ...SPRING, delay: 0.05 } }}
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime/15 text-3xl text-lime shadow-glow-mint"
                >
                  ✓
                </m.span>
                <h1 className="mt-4 text-2xl font-bold">Slot booked!</h1>
                <p className="mt-1 text-sm text-[var(--text-sec)]">
                  {slot.slot_number} · {formatDateTime(booking?.start_time)} → {formatDateTime(booking?.end_time)}
                </p>

                {booking?.qr_code_url && (
                  <MorphCard glass={false} layoutId={`ticket-${booking.id}`} className="mx-auto mt-6 w-fit rounded-3xl bg-white p-3">
                    <img src={booking.qr_code_url} alt="Your QR ticket" className="h-52 w-52" />
                  </MorphCard>
                )}
                <p className="mt-4 text-xs text-[var(--text-mut)]">
                  Show this QR at the gate — first scan checks in, second checks out. It's also
                  saved under My Bookings.
                </p>

                <div className="mt-7 flex justify-center gap-3">
                  <Button variant="glass" onClick={() => navigate('/my-bookings')}>
                    My bookings
                  </Button>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center rounded-btn bg-accent px-5 py-2.5 text-sm font-semibold text-ink shadow-glow-accent"
                  >
                    Done
                  </Link>
                </div>
              </GlassPanel>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
