// Centralised environment loading + validation.
// Every other module imports `env` from here instead of touching process.env
// directly, so a missing or malformed variable fails fast at boot with a
// readable message instead of a mysterious runtime error later.
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Supabase creds are optional at the schema level: when they're absent or
  // still the shipped placeholders, the app boots against a built-in LOCAL
  // database (config/localDb.js) so it runs with zero cloud setup. Provide
  // real values (or set USE_LOCAL_DB=false) to use Supabase.
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  // 'true' forces the local DB; 'false' forces Supabase; unset = auto-detect.
  USE_LOCAL_DB: z.string().optional(),

  JWT_SECRET: z.string().default('super_secret_jwt_key_parksmart_2026_vercel_default_key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  QR_SECRET: z.string().default('super_secret_qr_key_parksmart_2026_vercel_default_key'),

  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173,https://*.vercel.app'),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().positive().default(20),
  RATE_LIMIT_MAX_BOOKING: z.coerce.number().positive().default(10),

  // How long a slot stays held for a user between selecting it and physically
  // checking in. Short by design — a long hold starves everyone else.
  RESERVATION_HOLD_MINUTES: z.coerce.number().positive().default(5),
  // A check-in older than this is treated as abandoned and force-released.
  AUTO_CHECKOUT_HOURS: z.coerce.number().positive().default(12),
  // Set false to keep the in-process sweep timers off (e.g. when a platform
  // cron drives /internal/sweep instead).
  ENABLE_SCHEDULER: z.string().optional(),
  // Shared secret for the internal sweep endpoint. When unset the endpoint is
  // disabled entirely rather than left open.
  SWEEP_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration — fix backend/.env:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

let rawSupabaseUrl = parsed.data.SUPABASE_URL || '';
if (rawSupabaseUrl.startsWith('postgresql://') || rawSupabaseUrl.startsWith('postgres://')) {
  const match = rawSupabaseUrl.match(/postgres\.([a-z0-9]+):/i);
  if (match && match[1]) {
    rawSupabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

export const env = {
  ...parsed.data,
  SUPABASE_URL: rawSupabaseUrl,
  isProd: parsed.data.NODE_ENV === 'production',
  // CORS_ORIGIN is a comma-separated allow-list → normalised to an array once here.
  corsOrigins: parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // In-process timers only make sense in a long-lived process. Serverless
  // invocations are short-lived, so this defaults ON only for `node server.js`
  // and is explicitly opt-out via ENABLE_SCHEDULER=false.
  schedulerEnabled: String(parsed.data.ENABLE_SCHEDULER ?? '').toLowerCase() !== 'false',
};
