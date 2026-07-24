// About — static glass-styled content page.
import { FiTarget, FiCpu, FiHeart } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import TiltCard from '../../components/TiltCard/TiltCard.jsx';

const STACK = [
  'React 19', 'Vite', 'Tailwind CSS', 'Framer Motion', 'React Leaflet',
  'Node.js', 'Express', 'Supabase (PostgreSQL)', 'JWT', 'Flutter',
];

export default function About() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          About <span className="text-accent">ParkSmart</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-sec)]">
          Finding parking during college events or peak hours wastes time and clogs campus roads
          with cars slowly circling for a space. ParkSmart replaces the circling with certainty:
          live availability, instant booking, and QR-verified gate entry — for drivers, and a
          real-time management console for the people running the lots.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FiTarget,
              title: 'The problem',
              body: 'Event-day parking is a guessing game. Drivers circle, queues form, and staff have zero visibility into what is actually free.',
            },
            {
              icon: FiCpu,
              title: 'The approach',
              body: 'One source of truth in PostgreSQL: slot status is derived from bookings by database triggers, so the map can never lie.',
            },
            {
              icon: FiHeart,
              title: 'The experience',
              body: 'A luxury car-OS feel — liquid glass, fluid shared-element motion — because utility software doesn’t have to look like it.',
            },
          ].map((item) => (
            <TiltCard key={item.title} max={7}>
              <GlassPanel className="h-full rounded-card p-6">
                <item.icon className="h-6 w-6 text-mint-soft" />
                <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-sec)]">{item.body}</p>
              </GlassPanel>
            </TiltCard>
          ))}
        </div>

        <GlassPanel className="mt-10 rounded-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-mut)]">
            Built with
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {STACK.map((tech) => (
              <span key={tech} className="rounded-full bg-white/5 px-3.5 py-1.5 text-sm text-[var(--text-sec)]">
                {tech}
              </span>
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageTransition>
  );
}
