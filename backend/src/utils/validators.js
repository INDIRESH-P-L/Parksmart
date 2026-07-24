// zod schemas for every write endpoint + query/param validation.
// Enforced by middleware/validate.js so controllers only ever see clean,
// coerced, defaulted data.
import { z } from 'zod';

// ── shared primitives ────────────────────────────────────────────────────────
const uuid = z.string().uuid('Invalid id format');
// Accepts ISO strings (what the clients send) and yields real Date objects.
const isoDate = z.coerce.date({ errorMap: () => ({ message: 'Invalid date/time value' }) });

export const idParamSchema = z.object({ id: uuid });
export const slotIdParamSchema = z.object({ slotId: uuid });

// ── auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  // bcrypt silently truncates inputs longer than 72 bytes — cap it explicitly.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone_number: z.string().trim().min(7).max(20).optional(),
  vehicle_number: z.string().trim().min(3).max(20).optional(),
  // SECURITY: `role` is intentionally absent — everyone registers as 'user'
  // (DB default). Admin/operator accounts are provisioned via seed or by DBAs.
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone_number: z.string().trim().min(7).max(20).nullable().optional(),
    vehicle_number: z.string().trim().min(3).max(20).nullable().optional(),
    password: z.string().min(8).max(72).optional(),
    // Email change is deliberately unsupported (would need re-verification flow).
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

// ── favorites ────────────────────────────────────────────────────────────────
export const favoriteSchema = z.object({ slot_id: uuid });

// ── parking ──────────────────────────────────────────────────────────────────
export const slotFilterSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved']).optional(),
  type: z.enum(['covered', 'open']).optional(),
  zone: z.string().trim().max(60).optional(),
  search: z.string().trim().max(60).optional(),
  // Admin UI needs soft-deleted slots too; harmless publicly (inactive slots
  // carry no sensitive data, they're just hidden from the default map view).
  include_inactive: z.coerce.boolean().optional().default(false),
});

export const slotCreateSchema = z.object({
  slot_number: z.string().trim().min(1).max(20),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  status: z.enum(['available', 'occupied', 'reserved']).default('available'),
  type: z.enum(['covered', 'open']),
  floor: z.string().trim().max(30).nullable().optional(),
  zone_name: z.string().trim().max(60).nullable().optional(),
  slot_type: z.enum(['standard', 'ev', 'disability', 'vip']).default('standard'),
  hourly_rate: z.coerce.number().min(0).max(9999).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const slotUpdateSchema = slotCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

// ── bookings ─────────────────────────────────────────────────────────────────
// Window sanity rules (end > start, not in the past, max duration) live in
// bookingService because they need "now" and default-filling context.
export const createBookingSchema = z.object({
  slot_id: uuid,
  start_time: isoDate.optional(),
  end_time: isoDate.optional(),
});

export const verifyQrSchema = z.object({
  // The raw string decoded from the QR image by the scanner.
  qr_data: z.string().min(10, 'qr_data is required'),
});

// ── notifications / feedback ─────────────────────────────────────────────────
export const broadcastSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(500),
  user_id: uuid.optional(), // omit → broadcast to every user
});

export const feedbackSchema = z.object({
  message: z.string().trim().min(3).max(1000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  slot_id: uuid.optional(),
});

// ── admin / analytics queries ────────────────────────────────────────────────
export const userListQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const peakHoursQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});
