import { AVG_WALK_KMH } from './constants.js';

// Tiny conditional-classname joiner (clsx-style, no dependency).
export const cn = (...parts) => parts.filter(Boolean).join(' ');

// ── geo ──────────────────────────────────────────────────────────────────────
// Haversine great-circle distance in km — no paid API needed for "walking
// distance to slot" (spec bonus). Accurate to well under 1% at campus scale.
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const walkingEstimate = (lat1, lng1, lat2, lng2) => {
  const km = haversineKm(lat1, lng1, lat2, lng2);
  const minutes = Math.max(1, Math.round((km / AVG_WALK_KMH) * 60));
  const distance = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  return { km, distance, minutes };
};

// ── money / pricing ──────────────────────────────────────────────────────────
export const formatCurrency = (value) => `₹${Number(value ?? 0).toFixed(2)}`;

// Mirrors the backend's pricing rule (15-minute increments, minimum one) so
// the Booking page can preview the exact price the server will charge.
export const estimatePrice = (hourlyRate, start, end) => {
  const ms = new Date(end) - new Date(start);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  const quarters = Math.max(1, Math.ceil(ms / (15 * 60 * 1000)));
  return Math.round(Number(hourlyRate || 0) * (quarters / 4) * 100) / 100;
};

// ── misc ─────────────────────────────────────────────────────────────────────
export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export const debounce = (fn, wait = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

// Average centre of a set of slots — keeps the map centred on real data.
export const centerOfSlots = (slots, fallback) => {
  if (!slots?.length) return fallback;
  const lat = slots.reduce((sum, s) => sum + s.latitude, 0) / slots.length;
  const lng = slots.reduce((sum, s) => sum + s.longitude, 0) / slots.length;
  return [lat, lng];
};
