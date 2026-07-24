// Notification + feedback endpoints.
import { asyncHandler, ok, created } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) =>
  ok(res, { notifications: await notificationService.listForUser(req.user.id) }, 'Notifications')
);

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user, req.params.id);
  return ok(res, { notification }, 'Marked as read');
});

export const broadcast = asyncHandler(async (req, res) => {
  const result = await notificationService.broadcast(req.body);
  return created(res, result, `Notification sent to ${result.count} user(s)`);
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await notificationService.submitFeedback(req.user, req.body);
  return created(res, { feedback }, 'Thanks for the feedback!');
});
