// Slim glass strip shown across the authenticated app whenever a slot hold is
// active — keeps the countdown visible wherever the user navigates. Renders
// nothing when there's no reservation.
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';
import { useReservation } from '../../hooks/useReservation.js';
import ReservationTimer from '../ReservationTimer/ReservationTimer.jsx';
import { SPRING } from '../../utils/motionPresets.js';

export default function ReservationBanner() {
  const { hasReservation, reservation } = useReservation();

  return (
    <AnimatePresence>
      {hasReservation && reservation && (
        <m.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto', transition: SPRING }}
          exit={{ opacity: 0, y: -12, height: 0, transition: { duration: 0.2 } }}
          className="mb-4"
        >
          <Link
            to="/reserve"
            className="glass-panel ripple-hover flex items-center justify-between gap-3 rounded-card px-4 py-3 shadow-glow-accent"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-sm font-bold text-accent">
                {reservation.slot.slot_number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Slot reserved — arrive on time
                </p>
                <p className="truncate text-xs text-[var(--text-sec)]">
                  <FiMapPin className="mr-0.5 inline h-3 w-3" />
                  {reservation.slot.zone_name ?? 'Campus'} · {reservation.vehicleNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ReservationTimer variant="pill" />
              <FiArrowRight className="hidden h-4 w-4 text-[var(--text-mut)] sm:block" />
            </div>
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
