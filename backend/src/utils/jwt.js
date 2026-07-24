// JWT helpers — session tokens for API auth.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// The payload is deliberately minimal: subject (user id) + role snapshot.
// The role is re-checked against the DB on every request (middleware/auth.js),
// so demoting a user takes effect immediately — a stale token can't keep
// admin rights until expiry.
export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

// Throws (JsonWebTokenError / TokenExpiredError) on any invalid token —
// callers translate that into a 401.
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
