// ASSUMPTION (noted per spec): there is no `reports` table in the schema.
// This model is the read-only AGGREGATION gateway used by analyticsService —
// compact selects that the service layer reduces into summaries, peak-hour
// histograms, and utilisation breakdowns. It is named Report.js to match the
// mandated project layout.
import { db, unwrap } from '../config/db.js';
import * as User from './User.js';
import * as Booking from './Booking.js';

// Minimal slot projection for occupancy / utilisation math.
export const slotSnapshot = async () =>
  unwrap(
    await db('parking_slots').select(
      'id, slot_number, status, type, slot_type, zone_name, floor, is_active, hourly_rate'
    ),
    'report.slotSnapshot'
  );

// Bookings created in the last N days — only the columns analytics needs.
export const bookingsSince = async (days) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return unwrap(
    await db('bookings')
      .select('id, status, total_price, created_at, start_time, end_time, slot_id')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    'report.bookingsSince'
  );
};

// Re-exported counts so analyticsService has a single import surface.
export const usersCount = User.count;
export const bookingsCount = Booking.count;
export const recentBookings = Booking.listAll;
