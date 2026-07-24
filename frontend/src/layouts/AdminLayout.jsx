// Admin console shell — same chrome as MainLayout (the Sidebar already shows
// the Admin section for admin users) plus a slim context strip so it's always
// obvious you're in the management surface. Route-level guarding is handled by
// <ProtectedRoute roles={['admin']}> around this layout in AppRoutes.
import { FiShield } from 'react-icons/fi';
import Navbar from '../components/Navbar/Navbar.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import { AnimatedOutlet } from '../components/PageTransition/PageTransition.jsx';

export default function AdminLayout() {
  return (
    <div className="min-h-screen pb-28 md:pb-10">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start gap-6 px-4 pt-6 md:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2 rounded-btn bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent">
            <FiShield className="h-3.5 w-3.5" /> Admin console
          </div>
          <AnimatedOutlet />
        </main>
      </div>
    </div>
  );
}
