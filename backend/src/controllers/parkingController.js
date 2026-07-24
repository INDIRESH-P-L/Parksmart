// Public parking catalogue + admin heat map endpoints.
import { asyncHandler, ok } from '../utils/response.js';
import * as parkingService from '../services/parkingService.js';

export const listSlots = asyncHandler(async (req, res) => {
  // validatedQuery is set by validate(slotFilterSchema, 'query').
  const { include_inactive: includeInactive, ...filters } = req.validatedQuery ?? {};
  const slots = await parkingService.listSlots({ ...filters, includeInactive });
  return ok(res, { slots, count: slots.length }, 'Parking slots');
});

export const getSlot = asyncHandler(async (req, res) =>
  ok(res, { slot: await parkingService.getSlot(req.params.id) }, 'Parking slot')
);

export const availability = asyncHandler(async (_req, res) =>
  ok(res, await parkingService.availability(), 'Live availability by zone')
);

export const heatmap = asyncHandler(async (_req, res) =>
  ok(res, { zones: await parkingService.heatmap() }, 'Occupancy heat map')
);

export const checkInSlot = asyncHandler(async (req, res) =>
  ok(res, await parkingService.checkInSlot(req.params.id, req.user), 'Check-in successful')
);

export const checkOutSlot = asyncHandler(async (req, res) =>
  ok(res, await parkingService.checkOutSlot(req.params.id, req.user), 'Check-out successful')
);

