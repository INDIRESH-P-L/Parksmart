// Admin Users — searchable directory with role badges (server-side search on
// name/email, debounced through the SearchBar morph).
import { useEffect, useState, useCallback } from 'react';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { listUsers } from '../../services/authService.js';
import { notifyError } from '../../components/Notification/Notification.jsx';
import { initialsOf, cn } from '../../utils/helpers.js';
import { formatDate } from '../../utils/formatDate.js';

const ROLE_BADGES = {
  admin: 'bg-accent/15 text-accent',
  operator: 'bg-warn/15 text-warn',
  user: 'bg-mint/15 text-mint-soft',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback((search = '') => {
    setLoading(true);
    listUsers({ search })
      .then(({ data }) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => notifyError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-sec)]">{total} registered</p>
        </div>
        <SearchBar autoExpand placeholder="Search name or email…" onSearch={load} />
      </div>

      {loading ? (
        <Loader variant="skeleton" lines={4} />
      ) : (
        <GlassPanel className="overflow-hidden rounded-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-[var(--text-mut)]">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Phone</th>
                  <th className="px-5 py-4 font-medium">Vehicle</th>
                  <th className="px-5 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/70 to-mint/70 text-xs font-bold text-ink">
                          {initialsOf(user.name)}
                        </span>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-[var(--text-mut)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', ROLE_BADGES[user.role])}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-sec)]">{user.phone_number || '—'}</td>
                    <td className="px-5 py-3.5 text-[var(--text-sec)]">{user.vehicle_number || '—'}</td>
                    <td className="px-5 py-3.5 text-[var(--text-sec)]">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="py-12 text-center text-sm text-[var(--text-mut)]">No users match that search.</p>
          )}
        </GlassPanel>
      )}
    </PageTransition>
  );
}
