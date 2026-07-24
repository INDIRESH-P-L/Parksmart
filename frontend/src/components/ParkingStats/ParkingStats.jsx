// The dashboard's headline counters — floating glass stat chips. Each widget
// oscillates a few px vertically on a staggered loop ("flying widgets"), and
// count changes pop through a keyed scale/fade so live updates feel alive.
import { m, AnimatePresence } from 'framer-motion';
import TiltCard from '../TiltCard/TiltCard.jsx';
import GlassPanel from '../GlassPanel/GlassPanel.jsx';
import { SPRING } from '../../utils/motionPresets.js';
import { cn } from '../../utils/helpers.js';

const STATS = [
  { key: 'available', label: 'Available', dot: '#9FFF2D', glow: 'shadow-glow-mint' },
  { key: 'occupied', label: 'Occupied', dot: '#FF5A5A', glow: '' },
  { key: 'reserved', label: 'Reserved', dot: '#FFC93D', glow: '' },
  { key: 'total', label: 'Total Slots', dot: '#D7FF1F', glow: 'shadow-glow-accent' },
];

export default function ParkingStats({ totals, className = '' }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4', className)}>
      {STATS.map((stat, index) => {
        const value = totals?.[stat.key] ?? '—';
        return (
          <TiltCard key={stat.key} max={7}>
            <GlassPanel
              className={cn('animate-floaty rounded-card p-4 md:p-5', stat.glow)}
              // stagger the float loop so widgets don't bob in unison
              style={{ animationDelay: `${index * 0.9}s` }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: stat.dot }} />
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-sec)]">
                  {stat.label}
                </p>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                <m.p
                  key={value}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  className="mt-2 text-3xl font-bold tracking-tight md:text-4xl"
                >
                  {value}
                </m.p>
              </AnimatePresence>
            </GlassPanel>
          </TiltCard>
        );
      })}
    </div>
  );
}
