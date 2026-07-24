// Campus reservation vocabulary. This is a college-campus platform, so there is
// NO pricing/payment anywhere — a reservation is a free, time-limited hold on a
// slot. Colours reuse the existing palette (constants.js / tailwind config), so
// nothing here introduces a new design token.

// Vehicle types the reserver picks first. `slotType` maps a vehicle to the
// preferred DB slot_type so the grid can flag recommended slots.
export const VEHICLE_TYPES = [
  { key: 'car', label: 'Car', icon: '🚗', slotType: 'standard' },
  { key: 'bike', label: 'Bike', icon: '🏍️', slotType: 'standard' },
  { key: 'ev', label: 'Electric Vehicle', icon: '⚡', slotType: 'ev' },
  { key: 'faculty', label: 'Faculty Vehicle', icon: '🎓', slotType: 'vip' },
  { key: 'visitor', label: 'Visitor Vehicle', icon: '🪪', slotType: 'standard' },
];

export const getVehicleType = (key) =>
  VEHICLE_TYPES.find((v) => v.key === key) ?? VEHICLE_TYPES[0];

// Purpose captured on the confirmation step.
export const PURPOSES = ['Faculty', 'Student', 'Visitor'];

// How long a reservation is held before it auto-cancels (spec: ~18 minutes).
export const HOLD_MINUTES = 18;
export const HOLD_MS = HOLD_MINUTES * 60 * 1000;
// Warn the user once when this little time remains.
export const HOLD_WARN_MS = 2 * 60 * 1000;

// Reservation-grid slot states → palette colours + tailwind badge classes.
// NOTE: the spec asked for a blue "selected" state, but the project palette has
// no blue and the brief forbids changing the palette — so "selected" reuses the
// app's primary accent (volt) with a glow ring, which reads as clearly distinct
// from the green "available" state while staying on-brand.
export const SLOT_CELL = {
  available: {
    label: 'Available',
    dot: '#9FFF2D',
    cell: 'bg-lime/15 border-lime/40 text-lime hover:bg-lime/25',
    selectable: true,
  },
  occupied: {
    label: 'Occupied',
    dot: '#FF5A5A',
    cell: 'bg-danger/10 border-danger/30 text-danger/80 cursor-not-allowed',
    selectable: false,
  },
  reserved: {
    label: 'Reserved',
    dot: '#FFC93D',
    cell: 'bg-warn/10 border-warn/30 text-warn/80 cursor-not-allowed',
    selectable: false,
  },
  selected: {
    label: 'Your pick',
    dot: '#D7FF1F',
    cell: 'bg-accent/20 border-accent text-accent ring-2 ring-accent shadow-glow-accent',
    selectable: true,
  },
  disabled: {
    label: 'Disabled',
    dot: '#6F6F6F',
    cell: 'bg-white/5 border-edge text-[var(--text-mut)] opacity-50 cursor-not-allowed',
    selectable: false,
  },
};

// Resolve a slot's cell state (client selection wins over server status).
export const cellStateOf = (slot, selectedId) => {
  if (slot.id === selectedId) return 'selected';
  if (slot.is_active === false) return 'disabled';
  if (slot.status === 'occupied') return 'occupied';
  if (slot.status === 'reserved') return 'reserved';
  return 'available';
};

// A campus icon per zone, matched loosely by keyword so it works with whatever
// zones the seed/admin created (no hardcoded zone list).
export const zoneIcon = (zoneName = '') => {
  const z = zoneName.toLowerCase();
  if (z.includes('librar')) return '📚';
  if (z.includes('hostel')) return '🏨';
  if (z.includes('admin')) return '🏛️';
  if (z.includes('sport')) return '🏟️';
  if (z.includes('audi')) return '🎭';
  if (z.includes('ev') || z.includes('charg')) return '⚡';
  if (z.includes('gate')) return '🚪';
  if (z.includes('academ') || z.includes('block')) return '🎓';
  return '📍';
};

// mm:ss for the reservation countdown.
export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
