// Authenticated app shell: sticky glass Navbar, Sidebar rail (bottom bar on
// mobile), and the animated route outlet. The chrome mounts ONCE — only page
// content transitions — which is what lets the nav pill slide rather than blink.
// Also preserves scroll position per list page (Dashboard, My Bookings, …).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import ReservationBanner from '../components/ReservationBanner/ReservationBanner.jsx';
import { AnimatedOutlet } from '../components/PageTransition/PageTransition.jsx';

function useScrollMemory() {
  const location = useLocation();
  useEffect(() => {
    // Restore after the incoming page has mounted (mode:"wait" ≈ 300ms exit).
    const saved = sessionStorage.getItem(`ps-scroll:${location.pathname}`);
    const timer = setTimeout(() => window.scrollTo(0, saved ? Number(saved) : 0), 360);
    return () => {
      // Cleanup fires at the moment of navigation — capture where we were.
      sessionStorage.setItem(`ps-scroll:${location.pathname}`, String(window.scrollY));
      clearTimeout(timer);
    };
  }, [location.pathname]);
}

export default function MainLayout() {
  useScrollMemory();
  return (
    <div className="min-h-screen pb-28 md:pb-10">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start gap-6 px-4 pt-6 md:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <ReservationBanner />
          <AnimatedOutlet />
        </main>
      </div>
    </div>
  );
}
