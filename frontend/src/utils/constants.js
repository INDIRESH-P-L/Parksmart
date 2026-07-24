// App-wide constants. The API base URL always comes from the environment —
// never hardcoded (see frontend/.env / .env.example).
export const API_URL = import.meta.env.VITE_API_URL;

export const STORAGE_KEYS = {
  token: 'ps_token',
  user: 'ps_user',
  theme: 'ps_theme',
};

export const SLOT_STATUS = {
  available: { label: 'Available', color: '#9FFF2D', badge: 'bg-lime/15 text-lime' },
  occupied: { label: 'Occupied', color: '#FF5A5A', badge: 'bg-danger/15 text-danger' },
  reserved: { label: 'Reserved', color: '#FFC93D', badge: 'bg-warn/15 text-warn' },
};

export const BOOKING_STATUS = {
  pending: { label: 'Pending', badge: 'bg-warn/15 text-warn' },
  confirmed: { label: 'Confirmed', badge: 'bg-accent/15 text-accent' },
  active: { label: 'Active', badge: 'bg-lime/15 text-lime' },
  completed: { label: 'Completed', badge: 'bg-mint/15 text-mint-soft' },
  cancelled: { label: 'Cancelled', badge: 'bg-danger/15 text-danger' },
};

export const SLOT_TYPES = {
  standard: { label: 'Standard', icon: '🚗' },
  ev: { label: 'EV Charging', icon: '⚡' },
  disability: { label: 'Accessible', icon: '♿' },
  vip: { label: 'VIP', icon: '⭐' },
};

// Fallback map centre — the seeded "Evergreen Institute" campus. The map
// recentres on real slot data as soon as it loads.
export const CAMPUS_CENTER = [12.9716, 77.5946];
export const MAP_ZOOM = 16;

// Dark map tiles (CARTO) — free for hackathon/demo use with attribution.
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILE_URL_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const AVG_WALK_KMH = 4.8; // used for walking-time estimates
