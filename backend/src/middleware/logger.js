// Request logging: method, path, status, duration — colored by status class.
// Health-check noise is skipped.
import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  if (req.path === '/api/v1/health') return next();

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`;
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else logger.info(line);
  });
  return next();
};
