// App navigation. Desktop (≥md): glass rail on the left with the shared
// active-pill sliding between items (SharedNavIndicator). Mobile: a glass
// bottom bar with its own pill (separate layoutId — the two bars are never
// on screen together, but Framer must not see duplicate ids).
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiMap,
  FiBookmark,
  FiUser,
  FiShield,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.js';
import SharedNavIndicator from '../SharedNavIndicator/SharedNavIndicator.jsx';
import { cn } from '../../utils/helpers.js';

const USER_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/slot-selection', label: 'Slot Selection', icon: FiCalendar },
  { to: '/map', label: 'Campus Map', icon: FiMap },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Admin Home', icon: FiShield, end: true },
  { to: '/manage-slots', label: 'Slot CRUD Manager', icon: FiSettings },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
];

function RailLink({ item, pillId }) {
  const location = useLocation();
  const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={cn(
        'relative z-0 flex items-center gap-3 rounded-btn px-4 py-2.5 text-sm transition-colors',
        active ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-sec)] hover:text-[var(--text)]'
      )}
    >
      {active && <SharedNavIndicator id={pillId} />}
      <Icon className={cn('h-[18px] w-[18px]', active && 'text-accent')} />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  // Mobile bottom bar: Dashboard · Reserve · Map · (My Reservations | Admin).
  // Profile stays reachable via the Navbar avatar menu.
  const bottomItems = [
    USER_ITEMS[0],
    USER_ITEMS[1],
    USER_ITEMS[2],
    isAdmin ? ADMIN_ITEMS[0] : USER_ITEMS[3],
  ];

  return (
    <>
      {/* desktop rail */}
      <aside className="sticky top-24 hidden h-fit w-56 shrink-0 md:block">
        <nav className="glass-panel rounded-card p-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-mut)]">
            Navigate
          </p>
          <div className="space-y-1">
            {USER_ITEMS.map((item) => (
              <RailLink key={item.to} item={item} pillId="rail-pill" />
            ))}
          </div>

          {isAdmin && (
            <>
              <p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-mut)]">
                Admin
              </p>
              <div className="space-y-1">
                {ADMIN_ITEMS.map((item) => (
                  <RailLink key={item.to} item={item} pillId="rail-pill" />
                ))}
              </div>
            </>
          )}
        </nav>
      </aside>

      {/* mobile bottom bar */}
      <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <div className="glass-panel flex items-center justify-around rounded-card px-2 py-2">
          {bottomItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="relative z-0 flex flex-col items-center gap-0.5 rounded-btn px-4 py-1.5"
              >
                {active && <SharedNavIndicator id="bottom-pill" />}
                <Icon className={cn('h-5 w-5', active ? 'text-accent' : 'text-[var(--text-sec)]')} />
                <span
                  className={cn(
                    'text-[10px]',
                    active ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-mut)]'
                  )}
                >
                  {item.label.split(' ')[0]}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
