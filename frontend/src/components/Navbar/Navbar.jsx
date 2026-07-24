// Top glass bar for the app shell: brand, notification bell (dropdown with
// mark-as-read), theme toggle and the user chip with a logout menu.
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FiBell, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.js';
import * as notificationService from '../../services/notificationService.js';
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx';
import { notifyError } from '../Notification/Notification.jsx';
import { initialsOf, cn } from '../../utils/helpers.js';
import { relativeTime } from '../../utils/formatDate.js';
import { SPRING, DUR, EASE } from '../../utils/motionPresets.js';

const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.shared, ease: EASE } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.18, ease: EASE } },
};

// Closes a dropdown when clicking anywhere outside it.
function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(close);

  const load = useCallback(() => {
    notificationService
      .listNotifications()
      .then(({ data }) => setItems(data.notifications))
      .catch(() => {}); // the bell is never worth an error toast on poll
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.is_read).length;

  const handleRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await notificationService.markRead(notification.id);
      setItems((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <m.button
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative rounded-full p-2.5 text-[var(--text-sec)] hover:bg-white/10 hover:text-[var(--text)]"
      >
        <FiBell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: SPRING }}
            className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink"
          >
            {unread}
          </m.span>
        )}
      </m.button>

      <AnimatePresence>
        {open && (
          <m.div
            {...dropdownMotion}
            className="glass-panel absolute right-0 top-12 z-40 w-[min(88vw,340px)] rounded-card p-2"
          >
            <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)]">
              Notifications
            </p>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-[var(--text-mut)]">All quiet for now.</p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n)}
                  className={cn(
                    'block w-full rounded-input px-3 py-2.5 text-left transition-colors hover:bg-white/5',
                    !n.is_read && 'bg-accent/5'
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn('text-sm', !n.is_read && 'font-semibold')}>{n.title}</span>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--text-sec)]">{n.message}</span>
                  <span className="mt-1 block text-[10px] text-[var(--text-mut)]">{relativeTime(n.created_at)}</span>
                </button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useClickOutside(closeMenu);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <div className="glass-panel flex items-center justify-between rounded-card px-4 py-3 md:px-5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-xl" />
          <span className="text-base font-bold tracking-tight">
            Park<span className="text-accent">Smart</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-2">
          <ThemeToggle />
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-btn px-2 py-1.5 hover:bg-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent to-mint text-xs font-bold text-ink">
                {initialsOf(user?.name)}
              </span>
              <span className="hidden text-sm font-medium md:block">{user?.name?.split(' ')[0]}</span>
              <FiChevronDown className="hidden h-3.5 w-3.5 text-[var(--text-mut)] md:block" />
            </m.button>

            <AnimatePresence>
              {menuOpen && (
                <m.div
                  {...dropdownMotion}
                  className="glass-panel absolute right-0 top-12 z-40 w-48 rounded-card p-2"
                >
                  <p className="truncate px-3 py-2 text-xs text-[var(--text-mut)]">{user?.email}</p>
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-input px-3 py-2 text-sm hover:bg-white/5"
                  >
                    <FiUser className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                  >
                    <FiLogOut className="h-4 w-4" /> Log out
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
