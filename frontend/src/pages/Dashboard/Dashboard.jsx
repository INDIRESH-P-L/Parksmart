// Dashboard — Sri Eshwar College of Engineering Smart Parking Assistant
// Real-time slot availability, bus-deck quick pick, and campus parking analytics.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiArrowRight, FiZap, FiGrid, FiSettings } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import ParkingStats from '../../components/ParkingStats/ParkingStats.jsx';
import Card from '../../components/Card/Card.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useParking } from '../../hooks/useParking.js';
import { SLOT_TYPES } from '../../utils/constants.js';
import { staggerContainer, fadeUp, EASE } from '../../utils/motionPresets.js';

const CAMPUS_MIX = [
  { key: 'ev', label: 'EV Slots', icon: '⚡' },
  { key: 'vip', label: 'Faculty / VIP', icon: '🎓' },
  { key: 'disability', label: 'Accessible', icon: '♿' },
  { key: 'standard', label: 'General', icon: '🚗' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availability, fetchAvailability, slots, fetchSlots } = useParking();

  useEffect(() => {
    fetchAvailability();
    fetchSlots({});
  }, [fetchAvailability, fetchSlots]);

  const mix = CAMPUS_MIX.map((cat) => {
    const inCat = slots.filter((s) => s.is_active !== false && (s.slot_type ?? 'standard') === cat.key);
    return {
      ...cat,
      total: inCat.length,
      available: inCat.filter((s) => s.status === 'available').length,
    };
  });

  const zones = availability?.zones ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PageTransition>
      <m.div variants={staggerContainer(0.08)} initial="initial" animate="animate">
        {/* greeting header */}
        <m.div variants={fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold text-accent">
              Sri Eshwar College of Engineering, Coimbatore 🎓
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {greeting}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-sec)]">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/slot-selection')}>
              <FiGrid className="h-4 w-4" /> Bus Deck Slot Selection
            </Button>
            <Button variant="glass" onClick={() => navigate('/manage-slots')}>
              <FiSettings className="h-4 w-4" /> Slot CRUD Manager
            </Button>
          </div>
        </m.div>

        {/* headline stats */}
        <m.div variants={fadeUp}>
          <ParkingStats totals={availability?.totals} />
        </m.div>

        {/* category breakdown */}
        <m.div variants={fadeUp} className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {mix.map((cat) => (
            <div key={cat.key} className="glass-panel flex items-center gap-3 rounded-card px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-lg">
                {cat.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[var(--text-mut)]">
                  {SLOT_TYPES[cat.key]?.label ?? cat.label}
                </p>
                <p className="text-sm font-bold">
                  <span className="text-lime">{cat.available}</span>
                  <span className="text-[var(--text-mut)]"> / {cat.total} free</span>
                </p>
              </div>
            </div>
          ))}
        </m.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Quick Bus Deck Selection CTA */}
          <m.div variants={fadeUp} className="lg:col-span-3">
            <Card
              title="Interactive Bus-Style Slot Deck"
              action={
                <Link
                  to="/slot-selection"
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Open Deck View <FiArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="rounded-xl bg-white/[0.03] p-5 text-center border border-white/5">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-2xl text-accent">
                  🚌
                </div>
                <h3 className="text-lg font-bold">Bus-Booking Seat Selection UI</h3>
                <p className="mt-1.5 text-xs text-[var(--text-sec)] max-w-md mx-auto">
                  View Sri Eshwar College of Engineering parking bays arranged like an interactive bus seat layout. Pick any available slot to select, toggle occupancy, or edit slot details.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button size="sm" onClick={() => navigate('/slot-selection')}>
                    Open Bus Deck Selector
                  </Button>
                  <Button variant="glass" size="sm" onClick={() => navigate('/manage-slots')}>
                    Manage Slots (CRUD)
                  </Button>
                </div>
              </div>
            </Card>
          </m.div>

          {/* zone occupancy density */}
          <m.div variants={fadeUp} className="lg:col-span-2">
            <Card title="Zone Density (Sri Eshwar)">
              {zones.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-mut)]">
                  Zone data loading…
                </p>
              ) : (
                <div className="space-y-3.5">
                  {zones.map((zone) => {
                    const density = zone.total ? (zone.occupied + zone.reserved) / zone.total : 0;
                    return (
                      <div key={zone.zone}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium">{zone.zone}</span>
                          <span className="text-[var(--text-mut)]">{Math.round(density * 100)}% full</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <m.div
                            className="h-full rounded-full"
                            style={{
                              background:
                                density > 0.75
                                  ? 'linear-gradient(90deg,#FF5A5A,#FFC93D)'
                                  : density > 0.4
                                    ? 'linear-gradient(90deg,#FFC93D,#9FFF2D)'
                                    : 'linear-gradient(90deg,#10B981,#9FFF2D)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, density * 100)}%` }}
                            transition={{ duration: 0.9, ease: EASE }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </m.div>
        </div>
      </m.div>
    </PageTransition>
  );
}
