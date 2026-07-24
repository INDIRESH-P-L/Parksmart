// Client-side form validation. Mirrors the backend zod rules so users get
// instant feedback; the server remains the source of truth.

export const isEmail = (value = '') => /^[^\s@]+@[^\s@]+$/.test(value.trim());

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateRegister = ({ name, email, password, confirm }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (confirm !== undefined && confirm !== password) errors.confirm = 'Passwords do not match';
  return errors;
};

export const validateProfile = ({ name, phone_number, vehicle_number, password }) => {
  const errors = {};
  if (name !== undefined && name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (phone_number && phone_number.trim().length < 7) errors.phone_number = 'Phone number looks too short';
  if (vehicle_number && vehicle_number.trim().length < 3) errors.vehicle_number = 'Vehicle number looks too short';
  if (password && password.length < 8) errors.password = 'New password must be at least 8 characters';
  return errors;
};

export const validateBookingWindow = (start, end) => {
  const errors = {};
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime())) errors.start = 'Pick a start time';
  if (Number.isNaN(endDate.getTime())) errors.end = 'Pick an end time';
  if (!errors.start && !errors.end) {
    if (endDate <= startDate) errors.end = 'End time must be after the start time';
    // match the server's 5-minute clock-skew grace
    if (startDate.getTime() < Date.now() - 5 * 60 * 1000) errors.start = 'Start time is in the past';
    if (endDate - startDate > 24 * 60 * 60 * 1000) errors.end = 'Bookings are limited to 24 hours';
  }
  return errors;
};

export const validateSlotForm = ({ slot_number, latitude, longitude, type, hourly_rate }) => {
  const errors = {};
  if (!slot_number?.trim()) errors.slot_number = 'Slot number is required';
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.latitude = 'Latitude must be −90…90';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.longitude = 'Longitude must be −180…180';
  if (!type) errors.type = 'Pick covered or open';
  if (hourly_rate !== '' && (!Number.isFinite(Number(hourly_rate)) || Number(hourly_rate) < 0)) {
    errors.hourly_rate = 'Rate must be a positive number';
  }
  return errors;
};

export const validateFeedback = ({ message }) => {
  const errors = {};
  if (!message || message.trim().length < 3) errors.message = 'Tell us a little more (min 3 characters)';
  return errors;
};
