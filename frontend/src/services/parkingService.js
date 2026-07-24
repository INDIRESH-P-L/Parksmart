// Parking domain API calls: slots, availability, favorites, admin slot CRUD,
// and analytics (placed here rather than a 6th service file to keep the agreed
// services/ layout — analytics is parking-occupancy data).
import api from './api.js';

// Public catalogue — filters map straight to the API's query params.
export const listSlots = (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.zone) params.zone = filters.zone;
  if (filters.search) params.search = filters.search;
  if (filters.include_inactive) params.include_inactive = true; // admin slot manager
  return api.get('/parking/slots', { params });
};

export const getSlot = (id) => api.get(`/parking/slots/${id}`);
export const availability = () => api.get('/parking/availability');
export const heatmap = () => api.get('/parking/heatmap'); // admin
export const checkIn = (id) => api.post(`/parking/slots/${id}/check-in`);
export const checkOut = (id) => api.post(`/parking/slots/${id}/check-out`);

// Favorites
export const listFavorites = () => api.get('/users/favorites');
export const addFavorite = (slotId) => api.post('/users/favorites', { slot_id: slotId });
export const removeFavorite = (slotId) => api.delete(`/users/favorites/${slotId}`);

// Admin slot CRUD
export const createSlot = (payload) => api.post('/admin/slots', payload);
export const updateSlot = (id, payload) => api.put(`/admin/slots/${id}`, payload);
export const deleteSlot = (id) => api.delete(`/admin/slots/${id}`);

// Analytics (admin)
export const analyticsSummary = () => api.get('/analytics/summary');
export const analyticsPeakHours = (days = 7) => api.get('/analytics/peak-hours', { params: { days } });
export const analyticsTrends = (days = 14) => api.get('/analytics/trends', { params: { days } });
