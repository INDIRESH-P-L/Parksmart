// Dashboard — floating stat widgets, today's bookings, the zone heat widget
// (density by zone from public availability data) and a favorites quick-book
// strip.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiArrowRight, FiZap, FiCalendar } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import ParkingStats from '../../components/ParkingStats/ParkingStats.jsx';
import BookingCard from '../../components/BookingCard/BookingCard.jsx';
import Card from '../../components/Card/Card.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useParking } from '../../hooks/useParking.js';
import { useBooking } from '../../hooks/useBooking.js';
import { isToday } from '../../utils/formatDate.js';
import { SLOT_TYPES } from '../../utils/constants.js';
import { staggerContainer, fadeUp, EASE } from '../../utils/motionPresets.js';

// Campus slot categories surfaced on the dashboard (derived from slot_type).
const CAMPUS_MIX = [
  { key: 'ev', label: 'EV Slots', icon: '⚡' },
  { key: 'vip', label: 'Faculty Slots', icon: '🎓' },
  { key: 'disability', label: 'Accessible', icon: '♿' },
  { key: 'standard', label: 'General', icon: '🚗' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availability, fetchAvailability, favorites, slots, fetchSlots } = useParking();
  const { bookings, loading, fetchMyBookings } = useBooking();

  useEffect(() => {
    fetchAvailability();
    fetchMyBookings();
    fetchSlots({});
  }, [fetchAvailability, fetchMyBookings, fetchSlots]);

  // Available / total per campus category, for the slot-mix strip.
  const mix = CAMPUS_MIX.map((cat) => {
    const inCat = slots.filter((s) => s.is_active !== false && (s.slot_type ?? 'standard') === cat.key);
    return {
      ...cat,
      total: inCat.length,
      available: inCat.filter((s) => s.status === 'available').length,
    };
  });

  const todays = bookings.filter(
    (b) => isToday(b.start_time) && !['cancelled'].includes(b.status)
  );
  const zones = availability?.zones ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PageTransition>
      <m.div variants={staggerContainer(0.08)} initial="initial" animate="animate">
        {/* greeting */}
        <m.div variants={fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {greeting}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-sec)]">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Button onClick={() => navigate('/reserve')}>
            <FiCalendar className="h-4 w-4" /> Reserve a slot
          </Button>
        </m.div>

        {/* headline counters */}
        <m.div variants={fadeUp}>
          <ParkingStats totals={availability?.totals} />
        </m.div>

        {/* campus slot mix — availability by category */}
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
          {/* today's bookings */}
          <m.div variants={fadeUp} className="lg:col-span-3">
            <Card
              title="Today's bookings"
              action={
                <Link to="/my-bookings" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  All bookings <FiArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {loading ? (
                <Loader variant="skeleton" lines={2} />
              ) : todays.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--text-mut)]">No reservations for today.</p>
                  <Button variant="glass" size="sm" className="mt-4" onClick={() => navigate('/reserve')}>
                    Reserve a slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todays.slice(0, 3).map((booking) => (
                    <BookingCard key={booking.id} booking={booking} layoutIdPrefix="dash-booking" />
                  ))}
                </div>
              )}
            </Card>
          </m.div>

          {/* zone heat widget — occupancy density per zone */}
          <m.div variants={fadeUp} className="lg:col-span-2">
            <Card title="Parking heat map">
              {zones.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-mut)]">
                  Zone data appears when slots load.
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

        {/* favorites quick-book */}
        {favorites.length > 0 && (
          <m.div variants={fadeUp} className="mt-6">
            <Card title="Favorite zones">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.slice(0, 6).map(({ slot }) =>
                  slot ? (
                    <button
                      key={slot.id}
                      onClick={() => navigate('/reserve')}
                      disabled={slot.status !== 'available'}
                      className="glass-panel ripple-hover flex items-center justify-between rounded-card p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold">{slot.slot_number}</p>
                        <p className="text-xs text-[var(--text-sec)]">{slot.zone_name}</p>
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-accent">
                        <FiZap className="h-4 w-4" />
                      </span>
                    </button>
                  ) : null
                )}
              </div>
            </Card>
          </m.div>
        )}
      </m.div>
    </PageTransition>
  );
}
