// Analytics aggregation (admin-only endpoints).
//
// All aggregation happens in JS over compact selects from models/Report.js.
// At campus scale (hundreds of slots, thousands of bookings) this is simpler
// than maintaining SQL RPC functions and easily fast enough; revisit with
// materialized views if the data ever grows past that.
//
// Privacy: everything returned here is aggregate — no per-user personal data
// beyond the "recent bookings" admin feed (name/email of the booker, which
// admins can already see in the users directory).
import * as Report from '../models/Report.js';

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const summary = async () => {
  const [slots, recentWindow, totalUsers, totalBookings, recentBookings] = await Promise.all([
    Report.slotSnapshot(),
    Report.bookingsSince(30),
    Report.usersCount(),
    Report.bookingsCount(),
    Report.recentBookings({ limit: 5 }),
  ]);

  // ── slot occupancy ────────────────────────────────────────────────────────
  const activeSlots = slots.filter((slot) => slot.is_active);
  const byStatus = { available: 0, occupied: 0, reserved: 0 };
  const byType = {};
  const bySlotType = {};
  for (const slot of activeSlots) {
    byStatus[slot.status] += 1;
    byType[slot.type] = (byType[slot.type] ?? 0) + 1;
    bySlotType[slot.slot_type] = (bySlotType[slot.slot_type] ?? 0) + 1;
  }
  const taken = byStatus.occupied + byStatus.reserved;
  const occupancyRate = activeSlots.length
    ? Math.round((taken / activeSlots.length) * 100) / 100
    : 0;

  // ── bookings & revenue (last 30 days window) ──────────────────────────────
  const todayStart = startOfToday();
  const billable = recentWindow.filter((b) => b.status !== 'cancelled');
  const todays = recentWindow.filter((b) => new Date(b.created_at) >= todayStart);

  const sum = (rows) =>
    Math.round(rows.reduce((acc, b) => acc + Number(b.total_price || 0), 0) * 100) / 100;

  return {
    slots: {
      total: activeSlots.length,
      byStatus,
      byType,
      bySlotType,
      occupancyRate,
    },
    users: { total: totalUsers },
    bookings: {
      total: totalBookings,
      last30Days: recentWindow.length,
      today: todays.length,
      active: recentWindow.filter((b) => b.status === 'active').length,
      upcoming: recentWindow.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
      cancelled30Days: recentWindow.filter((b) => b.status === 'cancelled').length,
    },
    revenue: {
      last30Days: sum(billable),
      today: sum(todays.filter((b) => b.status !== 'cancelled')),
    },
    recentBookings,
  };
};

// Bookings + revenue per calendar day over the last N days — feeds the
// "booking trends" chart. Days with no bookings still appear (zeroed) so the
// x-axis is continuous.
export const trends = async (days = 14) => {
  const bookings = await Report.bookingsSince(days);

  const byDay = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(key, { date: key, bookings: 0, revenue: 0 });
  }

  for (const booking of bookings) {
    const key = new Date(booking.created_at).toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (!entry) continue; // outside the zeroed window edge — skip
    entry.bookings += 1;
    if (booking.status !== 'cancelled') entry.revenue += Number(booking.total_price || 0);
  }

  return {
    days,
    series: [...byDay.values()].map((d) => ({ ...d, revenue: Math.round(d.revenue * 100) / 100 })),
  };
};

// Bookings histogram by hour-of-day over the last N days — feeds the
// "peak hours" chart. Uses start_time (when the car is actually there),
// falling back to created_at for rows without a window.
export const peakHours = async (days = 7) => {
  const bookings = await Report.bookingsSince(days);

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    bookings: 0,
  }));

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    const at = new Date(booking.start_time ?? booking.created_at);
    hours[at.getHours()].bookings += 1;
  }

  const busiest = hours.reduce((max, entry) => (entry.bookings > max.bookings ? entry : max), hours[0]);

  return { days, hours, busiest };
};
