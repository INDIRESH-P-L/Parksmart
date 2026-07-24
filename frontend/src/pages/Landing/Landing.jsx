// Landing — hero over the animated blob mesh, glass CTA card with LIVE
// availability (the /parking/availability endpoint is public), feature grid
// on TiltCards, and a three-step how-it-works.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiMapPin, FiZap, FiShield, FiBarChart2, FiArrowRight, FiNavigation, FiSmartphone } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import TiltCard from '../../components/TiltCard/TiltCard.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import { useParking } from '../../hooks/useParking.js';
import { staggerContainer, fadeUp } from '../../utils/motionPresets.js';

const FEATURES = [
  {
    icon: FiMapPin,
    title: 'Live campus map',
    body: 'Every slot on an OpenStreetMap view — green pulses mean “drive straight here”.',
  },
  {
    icon: FiZap,
    title: 'Book in seconds',
    body: 'Pick a window, confirm, done. Server-side conflict checks mean no double bookings, ever.',
  },
  {
    icon: FiShield,
    title: 'QR gate tickets',
    body: 'A signed QR ticket checks you in and out at the gate. No paper, no forgery.',
  },
  {
    icon: FiBarChart2,
    title: 'Admin analytics',
    body: 'Occupancy, peak hours and utilisation — capacity decisions backed by real data.',
  },
];

const STEPS = [
  { n: '01', icon: FiMapPin, title: 'Find', body: 'Open the live map and spot a pulsing green marker near where you need to be.' },
  { n: '02', icon: FiSmartphone, title: 'Book', body: 'Reserve the slot for your time window and get a QR ticket instantly.' },
  { n: '03', icon: FiNavigation, title: 'Park', body: 'Scan at the gate to check in — the slot flips to occupied for everyone else.' },
];

export default function Landing() {
  const { availability, fetchAvailability } = useParking();

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const totals = availability?.totals;

  return (
    <PageTransition>
      {/* ── hero ── */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-10 pt-14 md:grid-cols-2 md:px-6 md:pt-24">
        <m.div variants={staggerContainer(0.09)} initial="initial" animate="animate">
          <m.p variants={fadeUp} className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            Smart Parking Assistant
          </m.p>
          <m.h1 variants={fadeUp} className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Stop circling.
            <br />
            <span className="bg-gradient-to-r from-accent to-mint bg-clip-text text-transparent">
              Start parking.
            </span>
          </m.h1>
          <m.p variants={fadeUp} className="mt-5 max-w-md text-base leading-relaxed text-[var(--text-sec)]">
            Real-time slot availability for campus events and peak hours. Find a space, book it,
            and glide through the gate with a QR ticket — no congestion, no guesswork.
          </m.p>
          <m.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-btn bg-accent px-7 py-3.5 text-base font-semibold text-ink shadow-glow-accent transition-transform hover:-translate-y-0.5"
            >
              Get started free <FiArrowRight />
            </Link>
            <Link
              to="/login"
              className="glass-panel inline-flex items-center gap-2 rounded-btn px-7 py-3.5 text-base font-medium hover:bg-white/10"
            >
              Sign in
            </Link>
          </m.div>
        </m.div>

        {/* live availability glass card */}
        <TiltCard max={6}>
          <GlassPanel className="rounded-sheet p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-mut)]">
              Campus right now
            </p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { label: 'Available', value: totals?.available, color: 'text-lime' },
                { label: 'Occupied', value: totals?.occupied, color: 'text-danger' },
                { label: 'Reserved', value: totals?.reserved, color: 'text-warn' },
              ].map((item) => (
                <div key={item.label} className="rounded-card bg-white/5 p-4 text-center">
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value ?? '—'}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--text-mut)]">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              {(availability?.zones ?? []).slice(0, 4).map((zone) => (
                <div key={zone.zone} className="flex items-center gap-3 text-sm">
                  <span className="w-28 truncate text-[var(--text-sec)]">{zone.zone}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <m.div
                      className="h-full rounded-full bg-gradient-to-r from-mint to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.total ? (zone.available / zone.total) * 100 : 0}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--text-mut)]">
                    {zone.available}/{zone.total}
                  </span>
                </div>
              ))}
              {!availability && (
                <p className="py-2 text-center text-xs text-[var(--text-mut)]">
                  Live data appears when the API is running.
                </p>
              )}
            </div>
          </GlassPanel>
        </TiltCard>
      </section>

      {/* ── features ── */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 md:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
          Everything a full parking office does, <span className="text-accent">minus the office</span>
        </h2>
        <m.div
          variants={staggerContainer(0.08)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <m.div key={feature.title} variants={fadeUp}>
              <TiltCard max={8}>
                <GlassPanel className="h-full rounded-card p-6">
                  <span className="inline-grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-sec)]">{feature.body}</p>
                </GlassPanel>
              </TiltCard>
            </m.div>
          ))}
        </m.div>
      </section>

      {/* ── how it works ── */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 md:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
        <m.div
          variants={staggerContainer(0.12)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          {STEPS.map((step) => (
            <m.div key={step.n} variants={fadeUp}>
              <GlassPanel className="relative overflow-hidden rounded-card p-6">
                <span className="absolute -right-2 -top-4 text-7xl font-bold text-white/5">{step.n}</span>
                <step.icon className="h-6 w-6 text-mint-soft" />
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-sec)]">{step.body}</p>
              </GlassPanel>
            </m.div>
          ))}
        </m.div>
      </section>
    </PageTransition>
  );
}
