// Auth endpoints — thin HTTP adapters over authService.
import { asyncHandler, ok, created } from '../utils/response.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  return created(res, { user, token }, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  return ok(res, { user, token }, 'Logged in');
});

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user }, 'Current user'));

export const logout = asyncHandler(async (req, res) => {
  authService.revokeToken(req.token);
  return ok(res, null, 'Logged out');
});
