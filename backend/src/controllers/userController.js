// Profile + favorites endpoints.
import { asyncHandler, ok, created } from '../utils/response.js';
import * as authService from '../services/authService.js';
import * as parkingService from '../services/parkingService.js';

export const getProfile = asyncHandler(async (req, res) =>
  ok(res, { user: req.user }, 'Profile')
);

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  return ok(res, { user }, 'Profile updated');
});

export const listFavorites = asyncHandler(async (req, res) =>
  ok(res, { favorites: await parkingService.listFavorites(req.user.id) }, 'Favorite slots')
);

export const addFavorite = asyncHandler(async (req, res) => {
  const favorite = await parkingService.addFavorite(req.user.id, req.body.slot_id);
  return created(res, { favorite }, 'Added to favorites');
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await parkingService.removeFavorite(req.user.id, req.params.slotId);
  return ok(res, null, 'Removed from favorites');
});
