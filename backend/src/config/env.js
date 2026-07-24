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

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  QR_SECRET: z.string().min(32, 'QR_SECRET must be at least 32 chars'),

  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required (comma-separated allow-list, never *)'),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().positive().default(20),
  RATE_LIMIT_MAX_BOOKING: z.coerce.number().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration — fix backend/.env:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  // CORS_ORIGIN is a comma-separated allow-list → normalised to an array once here.
  corsOrigins: parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
