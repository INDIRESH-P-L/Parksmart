// Rate limiting — three tiers:
//  - apiLimiter:     broad safety net for the whole API
//  - authLimiter:    brute-force protection on register/login
//  - bookingLimiter: booking-spam protection (per IP, per minute)
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Keep the limiter's rejection body in the standard response envelope.
const envelope = (message) => ({ success: false, data: null, message });

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: envelope('Too many requests — please slow down and try again shortly'),
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.RATE_LIMIT_MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: envelope('Too many authentication attempts — try again in a few minutes'),
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_MAX_BOOKING,
  standardHeaders: true,
  legacyHeaders: false,
  message: envelope('Too many booking attempts — please wait a minute'),
});
