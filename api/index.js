import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../backend/src/routes/authRoutes.js';
import parkingRoutes from '../backend/src/routes/parkingRoutes.js';
import adminRoutes from '../backend/src/routes/adminRoutes.js';
import bookingRoutes from '../backend/src/routes/bookingRoutes.js';
import userRoutes from '../backend/src/routes/userRoutes.js';
import internalRoutes from '../backend/src/routes/internalRoutes.js';
import { errorHandler } from '../backend/src/middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parking', parkingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/users', userRoutes);
// Serverless has no long-lived process for timers — a platform cron POSTs here.
app.use('/api/v1/internal', internalRoutes);

app.use(errorHandler);

export default app;
