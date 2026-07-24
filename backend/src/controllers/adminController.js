// Admin endpoints: slot CRUD + user directory.
// (All routes here sit behind auth + admin middleware.)
import { asyncHandler, ok, created } from '../utils/response.js';
import * as parkingService from '../services/parkingService.js';
import * as authService from '../services/authService.js';

export const createSlot = asyncHandler(async (req, res) => {
  const slot = await parkingService.createSlot(req.body);
  return created(res, { slot }, 'Slot created');
});

export const updateSlot = asyncHandler(async (req, res) => {
  const slot = await parkingService.updateSlot(req.params.id, req.body);
  return ok(res, { slot }, 'Slot updated');
});

export const deleteSlot = asyncHandler(async (req, res) => {
  const result = await parkingService.deleteSlot(req.params.id);
  const message =
    result.deleted === 'hard'
      ? 'Slot deleted'
      : 'Slot deactivated instead of deleted (it has booking history)';
  return ok(res, result, message);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { users, total } = await authService.listUsers(req.validatedQuery ?? {});
  return ok(res, { users, total }, 'Users');
});
