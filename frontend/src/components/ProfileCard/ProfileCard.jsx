// Identity card on the Profile page: gradient avatar, role badge, contact and
// vehicle details, member-since.
import GlassPanel from '../GlassPanel/GlassPanel.jsx';
import { initialsOf, cn } from '../../utils/helpers.js';
import { formatDate } from '../../utils/formatDate.js';

const ROLE_BADGES = {
  admin: 'bg-accent/15 text-accent',
  operator: 'bg-warn/15 text-warn',
  user: 'bg-mint/15 text-mint-soft',
};

export default function ProfileCard({ user, className = '' }) {
  if (!user) return null;
  return (
    <GlassPanel className={cn('rounded-card p-6 text-center', className)}>
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-accent to-mint text-2xl font-bold text-ink shadow-glow-accent">
        {initialsOf(user.name)}
      </div>
      <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
      <p className="text-sm text-[var(--text-sec)]">{user.email}</p>
      <span
        className={cn(
          'mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
          ROLE_BADGES[user.role] ?? ROLE_BADGES.user
        )}
      >
        {user.role}
      </span>

      <dl className="mt-6 space-y-2 text-left text-sm">
        <div className="flex justify-between gap-4 rounded-input bg-white/5 px-4 py-2.5">
          <dt className="text-[var(--text-mut)]">Phone</dt>
          <dd className="font-medium">{user.phone_number || '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 rounded-input bg-white/5 px-4 py-2.5">
          <dt className="text-[var(--text-mut)]">Vehicle</dt>
          <dd className="font-medium">{user.vehicle_number || '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 rounded-input bg-white/5 px-4 py-2.5">
          <dt className="text-[var(--text-mut)]">Member since</dt>
          <dd className="font-medium">{formatDate(user.created_at)}</dd>
        </div>
      </dl>
    </GlassPanel>
  );
}
