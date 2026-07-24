// 404 — on-theme "lost your spot?" with a route back to the map.
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiMap, FiHome } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import { SPRING } from '../../utils/motionPresets.js';

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-14">
        <GlassPanel className="w-full rounded-sheet p-10 text-center">
          <m.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: SPRING }}
            className="bg-gradient-to-r from-accent to-mint bg-clip-text text-8xl font-bold text-transparent"
          >
            404
          </m.p>
          <h1 className="mt-4 text-2xl font-bold">Lost your spot?</h1>
          <p className="mt-2 text-sm text-[var(--text-sec)]">
            This space is empty — and not in the good, bookable way. Let's get you back on the map.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-glow-accent"
            >
              <FiMap className="h-4 w-4" /> Open the live map
            </Link>
            <Link
              to="/"
              className="glass-panel inline-flex items-center gap-2 rounded-btn px-6 py-3 text-sm font-medium hover:bg-white/10"
            >
              <FiHome className="h-4 w-4" /> Home
            </Link>
          </div>
        </GlassPanel>
      </div>
    </PageTransition>
  );
}
