// Analytics — real charts (recharts) from real endpoints:
//   peak hours (bar), booking trends (bookings bar + revenue line),
//   live occupancy (donut) and utilisation by slot category (bar).
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import Card from '../../components/Card/Card.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import SharedNavIndicator from '../../components/SharedNavIndicator/SharedNavIndicator.jsx';
import {
  analyticsSummary,
  analyticsPeakHours,
  analyticsTrends,
} from '../../services/parkingService.js';
import { notifyError } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';

const ACCENT = '#D7FF1F';
const MINT = '#10B981';
const DANGER = '#FF5A5A';
const WARN = '#FFC93D';
const LIME = '#9FFF2D';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = '#6F6F6F';

// Shared glass tooltip style for every chart.
const TOOLTIP_STYLE = {
  background: 'rgba(20,20,20,0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
  fontSize: 12,
};

const RANGE_OPTIONS = [7, 14, 30];

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [peak, setPeak] = useState(null);
  const [trends, setTrends] = useState(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([analyticsSummary(), analyticsTrends(14)])
      .then(([summaryRes, trendsRes]) => {
        setSummary(summaryRes.data);
        setTrends(trendsRes.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Peak hours reload when the range chip changes.
  useEffect(() => {
    analyticsPeakHours(days)
      .then(({ data }) => setPeak(data))
      .catch((err) => notifyError(err.message));
  }, [days]);

  if (error) {
    return (
      <PageTransition>
        <GlassPanel className="rounded-card p-10 text-center text-sm text-danger">{error}</GlassPanel>
      </PageTransition>
    );
  }

  if (!summary || !trends) return <Loader variant="page" label="Rendering charts…" />;

  const occupancyData = [
    { name: 'Available', value: summary.slots.byStatus.available, color: LIME },
    { name: 'Occupied', value: summary.slots.byStatus.occupied, color: DANGER },
    { name: 'Reserved', value: summary.slots.byStatus.reserved, color: WARN },
  ];

  const utilisationData = Object.entries(summary.slots.bySlotType ?? {}).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    slots: value,
  }));

  const trendData = trends.series.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }));

  return (
    <PageTransition>
      <h1 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* peak hours */}
        <Card
          title={`Peak hours — last ${days} days`}
          action={
            <div className="glass-panel flex items-center gap-1 rounded-btn p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setDays(option)}
                  className={cn(
                    'relative z-0 rounded-input px-3 py-1 text-xs font-medium',
                    days === option ? 'text-[var(--text)]' : 'text-[var(--text-mut)]'
                  )}
                >
                  {days === option && <SharedNavIndicator id="analytics-range-pill" className="rounded-input" />}
                  {option}d
                </button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            {peak ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peak.hours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 10 }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                    {peak.hours.map((entry) => (
                      <Cell
                        key={entry.hour}
                        fill={entry.hour === peak.busiest.hour && entry.bookings > 0 ? ACCENT : MINT}
                        fillOpacity={entry.bookings === 0 ? 0.25 : 0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Loader variant="page" className="min-h-0" />
            )}
          </div>
          {peak?.busiest?.bookings > 0 && (
            <p className="mt-2 text-xs text-[var(--text-sec)]">
              Busiest hour: <span className="font-semibold text-accent">{peak.busiest.label}</span>{' '}
              with {peak.busiest.bookings} booking{peak.busiest.bookings === 1 ? '' : 's'}.
            </p>
          )}
        </Card>

        {/* booking trends */}
        <Card title="Booking trends — last 14 days">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 10 }} interval={1} axisLine={false} tickLine={false} />
                <YAxis yAxisId="bookings" allowDecimals={false} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar yAxisId="bookings" dataKey="bookings" name="Bookings" fill={MINT} fillOpacity={0.85} radius={[6, 6, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* live occupancy donut */}
        <Card title="Live slot occupancy">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    dataKey="value"
                    innerRadius={64}
                    outerRadius={90}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {occupancyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-3xl font-bold text-accent">
                    {Math.round((summary.slots.occupancyRate ?? 0) * 100)}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">full</p>
                </div>
              </div>
            </div>
            <ul className="w-full space-y-2.5">
              {occupancyData.map((entry) => (
                <li key={entry.name} className="flex items-center justify-between rounded-input bg-white/5 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-bold">{entry.value}</span>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 pt-1 text-xs text-[var(--text-mut)]">
                <span>Reservations today</span>
                <span className="font-semibold text-accent">{summary.bookings?.today ?? 0}</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* utilisation by category */}
        <Card title="Slots by category">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilisationData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={82} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="slots" name="Slots" radius={[0, 6, 6, 0]}>
                  {utilisationData.map((entry, index) => (
                    <Cell key={entry.name} fill={[ACCENT, MINT, WARN, LIME][index % 4]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
