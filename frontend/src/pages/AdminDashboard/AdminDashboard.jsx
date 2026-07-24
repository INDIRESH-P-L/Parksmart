// Admin Dashboard — system-wide stats from /analytics/summary, the recent
// bookings feed, quick links, and an announcement broadcast card.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiSettings, FiBarChart2, FiUsers, FiSend, FiArrowRight } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import Card from '../../components/Card/Card.jsx';
import TiltCard from '../../components/TiltCard/TiltCard.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { analyticsSummary } from '../../services/parkingService.js';
import { broadcast } from '../../services/notificationService.js';
import { notifySuccess, notifyError } from '../../components/Notification/Notification.jsx';
import { BOOKING_STATUS } from '../../utils/constants.js';
import { cn } from '../../utils/helpers.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { staggerContainer, fadeUp } from '../../utils/motionPresets.js';

const QUICK_LINKS = [
  { to: '/admin/slots', icon: FiSettings, label: 'Manage slots', desc: 'Add, edit, toggle, delete' },
  { to: '/admin/analytics', icon: FiBarChart2, label: 'Analytics', desc: 'Peak hours & trends' },
  { to: '/admin/users', icon: FiUsers, label: 'Users', desc: 'Directory & roles' },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    analyticsSummary()
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(err.message));
  }, []);

  const handleBroadcast = async (event) => {
    event.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) {
      notifyError('Announcement needs a title and a message');
      return;
    }
    setSending(true);
    try {
      const { message } = await broadcast(announcement);
      notifySuccess(message);
      setAnnouncement({ title: '', message: '' });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <PageTransition>
        <GlassPanel className="rounded-card p-10 text-center text-sm text-danger">{error}</GlassPanel>
      </PageTransition>
    );
  }

  if (!summary) return <Loader variant="page" label="Crunching the numbers…" />;

  const tiles = [
    { label: 'Occupancy', value: `${Math.round((summary.slots.occupancyRate ?? 0) * 100)}%`, tone: 'text-accent' },
    { label: 'Reservations today', value: summary.bookings.today, tone: 'text-lime' },
    { label: 'Active now', value: summary.bookings.active, tone: 'text-mint-soft' },
    { label: 'Reserved', value: summary.slots.byStatus?.reserved ?? 0, tone: 'text-warn' },
    { label: 'Users', value: summary.users.total, tone: 'text-[var(--text)]' },
    { label: 'Total reservations', value: summary.bookings.total, tone: 'text-[var(--text)]' },
  ];

  return (
    <PageTransition>
      <m.div variants={staggerContainer(0.07)} initial="initial" animate="animate">
        <m.h1 variants={fadeUp} className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">
          Admin dashboard
        </m.h1>

        {/* stat tiles */}
        <m.div variants={fadeUp} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile, index) => (
            <TiltCard key={tile.label} max={7}>
              <GlassPanel className="animate-floaty rounded-card p-4" style={{ animationDelay: `${index * 0.7}s` }}>
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-mut)]">{tile.label}</p>
                <p className={cn('mt-1.5 text-2xl font-bold tracking-tight', tile.tone)}>{tile.value}</p>
              </GlassPanel>
            </TiltCard>
          ))}
        </m.div>

        {/* quick links */}
        <m.div variants={fadeUp} className="mt-6 grid gap-3 md:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <GlassPanel className="ripple-hover flex items-center justify-between rounded-card p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <link.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{link.label}</p>
                    <p className="text-xs text-[var(--text-mut)]">{link.desc}</p>
                  </div>
                </div>
                <FiArrowRight className="h-4 w-4 text-[var(--text-mut)]" />
              </GlassPanel>
            </Link>
          ))}
        </m.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* recent bookings */}
          <m.div variants={fadeUp} className="lg:col-span-2">
            <Card title="Recent reservations">
              {summary.recentBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-mut)]">No reservations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[var(--text-mut)]">
                        <th className="pb-3 font-medium">Slot</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Arrival</th>
                        <th className="pb-3 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {summary.recentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="py-3 font-semibold">{booking.slot?.slot_number}</td>
                          <td className="py-3 text-[var(--text-sec)]">{booking.user?.name}</td>
                          <td className="py-3 text-xs text-[var(--text-sec)]">
                            {formatDateTime(booking.start_time)}
                          </td>
                          <td className="py-3 text-right">
                            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', BOOKING_STATUS[booking.status]?.badge)}>
                              {BOOKING_STATUS[booking.status]?.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </m.div>

          {/* broadcast */}
          <m.div variants={fadeUp}>
            <Card title="Send announcement">
              <form onSubmit={handleBroadcast} className="space-y-3.5">
                <input
                  value={announcement.title}
                  onChange={(event) => setAnnouncement((a) => ({ ...a, title: event.target.value }))}
                  placeholder="Title — e.g. Event parking notice"
                  className="input-glass"
                />
                <textarea
                  rows={4}
                  value={announcement.message}
                  onChange={(event) => setAnnouncement((a) => ({ ...a, message: event.target.value }))}
                  placeholder="Message to every user…"
                  className="input-glass resize-none"
                />
                <Button type="submit" loading={sending} className="w-full">
                  <FiSend className="h-4 w-4" /> Broadcast to all users
                </Button>
              </form>
            </Card>
          </m.div>
        </div>
      </m.div>
    </PageTransition>
  );
}
