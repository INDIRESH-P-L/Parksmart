// Minimal dependency-free leveled logger with ISO timestamps and ANSI colors.
// debug lines are suppressed in production.
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

const threshold = process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

const log = (level, ...args) => {
  if (LEVELS[level] < threshold) return;
  const ts = new Date().toISOString();
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  writer(`${COLORS[level]}[${ts}] ${level.toUpperCase()}${RESET}`, ...args);
};

export const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};
