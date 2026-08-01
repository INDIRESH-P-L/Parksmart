// Process entry point: boot the HTTP server, probe Supabase, wire graceful
// shutdown and last-resort error logging.
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkConnection } from './config/db.js';
import { startScheduler, stopScheduler } from './services/schedulerService.js';

await checkConnection();

const server = app.listen(env.PORT, () => {
  logger.info(`ParkSmart API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  // Only reached for a long-lived `node server.js`. Serverless imports app.js
  // (or api/index.js) directly and never gets here, which is why hold expiry is
  // also enforced lazily on read/write rather than relying on these timers.
  startScheduler();
});

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  stopScheduler();
  server.close(() => process.exit(0));
  // Safety hatch: if open connections refuse to drain, force-exit.
  setTimeout(() => process.exit(1), 10_000).unref();
};

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});
