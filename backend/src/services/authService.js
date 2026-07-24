// Auth business logic: registration, login, profile updates, and
// stateless-JWT logout via an in-memory denylist.
import bcrypt from 'bcrypt';
import * as User from '../models/User.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/response.js';

const SALT_ROUNDS = 12; // per spec — ~250ms per hash, deliberate brute-force cost

// ── logout denylist ──────────────────────────────────────────────────────────
// JWTs are stateless, so server-side "logout" = remember revoked tokens until
// they would have expired anyway. In-memory is a deliberate trade-off for this
// deployment shape (single instance; resets on restart, which only *shortens*
// revocation, never extends a session). Swap for Redis if this scales out.
const revoked = new Map(); // token → expiry (epoch ms)

const purgeExpired = () => {
  const now = Date.now();
  for (const [token, exp] of revoked) {
    if (exp <= now) revoked.delete(token);
  }
};
// unref() so this timer never keeps the process alive on shutdown.
setInterval(purgeExpired, 10 * 60 * 1000).unref();

export const isTokenRevoked = (token) => {
  const exp = revoked.get(token);
  if (!exp) return false;
  if (exp <= Date.now()) {
    revoked.delete(token); // expired anyway — no longer needs tracking
    return false;
  }
  return true;
};

export const revokeToken = (token) => {
  try {
    const { exp } = verifyToken(token); // exp is in seconds
    revoked.set(token, exp * 1000);
  } catch {
    // Token already invalid/expired — nothing to revoke.
  }
};

// ── flows ────────────────────────────────────────────────────────────────────
export const register = async (input) => {
  const existing = await User.findByEmail(input.email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  // Role is NEVER taken from the request — the DB default assigns 'user'.
  const user = await User.create({ ...input, password: hash });
  return { user, token: signToken(user) };
};

export const login = async ({ email, password }) => {
  const row = await User.findByEmail(email);
  // Identical error for unknown email vs wrong password — don't leak which
  // accounts exist (user-enumeration protection).
  if (!row) throw new ApiError(401, 'Invalid email or password');

  const matches = await bcrypt.compare(password, row.password);
  if (!matches) throw new ApiError(401, 'Invalid email or password');

  const { password: _hash, ...user } = row;
  return { user, token: signToken(user) };
};

export const updateProfile = async (userId, fields) => {
  const updates = { ...fields };
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }
  return User.updateById(userId, updates);
};

// Admin user directory (searchable) — lives here because "users" is the auth
// domain; adminController stays a thin pass-through.
export const listUsers = (options) => User.list(options);
