// Express application assembly: security headers → CORS allow-list → body
// parsing → request logging → rate limiting → routes → 404 → error funnel.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { ok, ApiError } from './utils/response.js';
import { requestLogger } from './middleware/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

app.disable('x-powered-by');
// Behind a reverse proxy / tunnel the client IP arrives in X-Forwarded-For;
// trusting exactly one hop keeps express-rate-limit keyed on real client IPs.
app.set('trust proxy', 1);

app.use(helmet());

// Strict CORS allow-list from CORS_ORIGIN (comma-separated env var, never *).
// Requests with no Origin header (curl, the Flutter app, server-to-server)
// are allowed through — CORS only governs browsers.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, `Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);

app.get('/api/v1/health', (_req, res) =>
  ok(res, { status: 'up', time: new Date().toISOString() }, 'ParkSmart API is healthy')
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/parking', parkingRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', notificationRoutes); // /notifications + /feedback

app.use(notFound);
app.use(errorHandler);

export default app;
