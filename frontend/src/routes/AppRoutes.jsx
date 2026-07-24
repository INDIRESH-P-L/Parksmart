// Route table with AnimatedOutlet for smooth transitions.
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle.jsx';
import Footer from '../components/Footer/Footer.jsx';
import { AnimatedOutlet } from '../components/PageTransition/PageTransition.jsx';
import { useAuth } from '../hooks/useAuth.js';

import Landing from '../pages/Landing/Landing.jsx';
import Login from '../pages/Login/Login.jsx';
import Register from '../pages/Register/Register.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import SlotSelection from '../pages/SlotSelection/SlotSelection.jsx';
import ManageSlots from '../pages/ManageSlots/ManageSlots.jsx';
import ParkingMapPage from '../pages/ParkingMap/ParkingMap.jsx';
import SlotDetails from '../pages/SlotDetails/SlotDetails.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard.jsx';
import AdminUsers from '../pages/AdminUsers/AdminUsers.jsx';
import Analytics from '../pages/Analytics/Analytics.jsx';
import About from '../pages/About/About.jsx';
import Contact from '../pages/Contact/Contact.jsx';
import NotFound from '../pages/NotFound/NotFound.jsx';

function PublicShell() {
  const { isAuthed } = useAuth();
  const location = useLocation();
  const onAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-6">
        <div className="glass-panel flex items-center justify-between rounded-card px-4 py-3 md:px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-xl" />
            <span className="text-base font-bold tracking-tight">
              Smart<span className="text-accent">Park</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 md:gap-3">
            <Link to="/about" className="hidden rounded-btn px-3 py-2 text-sm text-[var(--text-sec)] hover:text-[var(--text)] md:block">
              About
            </Link>
            <Link to="/contact" className="hidden rounded-btn px-3 py-2 text-sm text-[var(--text-sec)] hover:text-[var(--text)] md:block">
              Contact
            </Link>
            <ThemeToggle />
            {!onAuthPage && (
              <Link
                to={isAuthed ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-ink shadow-glow-accent"
              >
                {isAuthed ? 'Open App' : 'Sign In'} <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/slot-selection" element={<SlotSelection />} />
        <Route
          path="/manage-slots"
          element={
            <ProtectedRoute roles={['admin']}>
              <ManageSlots />
            </ProtectedRoute>
          }
        />
        <Route path="/map" element={<ParkingMapPage />} />
        <Route path="/slots/:id" element={<SlotDetails />} />
        <Route path="/profile" element={<Profile />} />

        {/* Redirect old booking routes to slot selection */}
        <Route path="/reserve" element={<Navigate to="/slot-selection" replace />} />
        <Route path="/my-bookings" element={<Navigate to="/dashboard" replace />} />
        <Route path="/booking/*" element={<Navigate to="/slot-selection" replace />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="slots" element={<ManageSlots />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
