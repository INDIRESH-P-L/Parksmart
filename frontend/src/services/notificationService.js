// Notifications + feedback API calls.
import api from './api.js';

export const listNotifications = () => api.get('/notifications');
export const markRead = (id) => api.patch(`/notifications/${id}/read`);

// Admin broadcast — omit user_id to notify everyone.
export const broadcast = ({ title, message, user_id }) =>
  api.post('/notifications', { title, message, ...(user_id ? { user_id } : {}) });

export const sendFeedback = ({ message, rating, slot_id }) =>
  api.post('/feedback', {
    message,
    ...(rating ? { rating } : {}),
    ...(slot_id ? { slot_id } : {}),
  });
