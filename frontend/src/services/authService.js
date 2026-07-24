// Auth + profile + admin-users API calls.
import api from './api.js';

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const me = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

export const getProfile = () => api.get('/users/profile');
export const updateProfile = (payload) => api.put('/users/profile', payload);

// Admin: searchable user directory.
export const listUsers = ({ search = '', limit = 100, offset = 0 } = {}) =>
  api.get('/admin/users', { params: { search, limit, offset } });
