// Live reservation countdown. Reads the active hold from ReservationContext.
//  - variant="ring": big SVG progress ring (accent → warn as it runs low)
//  - variant="pill": compact glass pill (for the global banner / cards)
// Renders nothing when there's no active reservation.
import { m } from 'framer-motion';
import { FiClock } from 'react-icons/fi';
import { useReservation } from '../../hooks/useReservation.js';
import { formatCountdown, HOLD_MS, HOLD_WARN_MS } from '../../utils/campus.js';
import { cn } from '../../utils/helpers.js';

const colorFor = (ms) => (ms <= HOLD_WARN_MS ? '#FF5A5A' : ms <= HOLD_MS / 2 ? '#FFC93D' : '#D7FF1F');

export default function ReservationTimer({ variant = 'pill', className = '' }) {
  const { hasReservation, remainingMs } = useReservation();
  if (!hasReservation) return null;

  const color = colorFor(remainingMs);
  const label = formatCountdown(remainingMs);

  if (variant === 'ring') {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const progress = Math.max(0, Math.min(1, remainingMs / HOLD_MS));
    return (
      <div className={cn('relative grid place-items-center', className)}>
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <m.circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - progress) }}
            transition={{ duration: 0.5, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-bold tabular-nums" style={{ color }}>
            {label}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-mut)]">remaining</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-sm font-semibold tabular-nums', className)}
      style={{ color }}
    >
      <FiClock className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
