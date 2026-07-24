// Supabase client (server-side).
//
// This client uses the SERVICE ROLE key: full database access, bypasses RLS.
// It must NEVER be exposed to a browser or mobile app — backend only.
//
// RLS policies (database/rls_policies.sql) still exist as defense in depth:
// they protect the data from anyone hitting Supabase directly with the public
// anon key. For API traffic, authorization is enforced by the Express
// middleware layer (middleware/auth.js + middleware/admin.js).
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Only instantiate a real client when a URL is configured. Without one the app
// runs on the built-in local database (config/db.js decides), so `supabase`
// stays null and is never dereferenced. createClient() would otherwise throw
// "supabaseUrl is required" at import and crash the local-mode boot.
export const supabase = env.SUPABASE_URL
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        // No browser session semantics on a server — plain key auth per request.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
