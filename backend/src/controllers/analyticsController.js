// Analytics endpoints (admin-only, aggregate data).
import { asyncHandler, ok } from '../utils/response.js';
import * as analyticsService from '../services/analyticsService.js';

export const summary = asyncHandler(async (_req, res) =>
  ok(res, await analyticsService.summary(), 'Analytics summary')
);

export const peakHours = asyncHandler(async (req, res) => {
  const { days } = req.validatedQuery ?? { days: 7 };
  return ok(res, await analyticsService.peakHours(days), 'Peak hours');
});

export const trends = asyncHandler(async (req, res) => {
  const { days } = req.validatedQuery ?? { days: 14 };
  return ok(res, await analyticsService.trends(days), 'Booking trends');
});
