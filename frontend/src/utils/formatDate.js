// Date/time display helpers — one place so every card renders times the same way.

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDateTime = (iso) => (iso ? `${formatDate(iso)} · ${formatTime(iso)}` : '—');

// "in 2 h", "35 min ago" — for booking cards and notifications.
export const relativeTime = (iso) => {
  if (!iso) return '';
  const diffMs = new Date(iso) - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (abs < 60 * 60 * 1000) return rtf.format(Math.round(diffMs / 60000), 'minute');
  if (abs < 24 * 60 * 60 * 1000) return rtf.format(Math.round(diffMs / 3600000), 'hour');
  return rtf.format(Math.round(diffMs / 86400000), 'day');
};

// Date → value usable by <input type="datetime-local"> (local tz, no seconds).
export const toLocalInputValue = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const isToday = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};
