// Axios instance for the ParkSmart API.
// - attaches the Bearer token from localStorage on every request
// - unwraps the server's { success, data, message } envelope
// - normalises errors into Error objects with .status / .errors
// - on 401 (expired/revoked session) clears the session and sends the user
//   to /login — except for auth endpoints themselves, where the page shows
//   the error inline.
import axios from 'axios';
import { API_URL, STORAGE_KEYS } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_PATHS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  // Success: hand back the envelope ({ success, data, message }).
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401 && !AUTH_PATHS.some((p) => error.config?.url?.includes(p))) {
      // Session died mid-use — clean up and restart at login.
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    const err = new Error(
      payload?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The server took too long to respond'
          : 'Cannot reach the ParkSmart server — is the backend running?')
    );
    err.status = status;
    err.errors = payload?.errors; // zod field issues from the API, when present
    return Promise.reject(err);
  }
);

export default api;
