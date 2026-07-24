// In-app notifications + feedback intake.
// Feedback lives here (not a separate service) because both are lightweight
// "messages to/from users" flows — keeps the controller → service → model
// layering without a one-function service file.
import * as Notification from '../models/Notification.js';
import * as Feedback from '../models/Feedback.js';
import * as User from '../models/User.js';
import * as ParkingSlot from '../models/ParkingSlot.js';
import { ApiError } from '../utils/response.js';

export const listForUser = (userId) => Notification.listByUser(userId);

export const markRead = async (user, notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (notification.user_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Not your notification');
  }
  return Notification.update(notificationId, { is_read: true });
};

// Used internally by bookingService for booking lifecycle events.
export const notifyUser = (userId, title, message) =>
  Notification.create({ user_id: userId, title, message });

// Admin announcement: with user_id → targeted message; without → fan out one
// row per user so read-state stays per-user.
export const broadcast = async ({ title, message, user_id }) => {
  if (user_id) {
    const target = await User.findById(user_id);
    if (!target) throw new ApiError(404, 'Target user not found');
    const row = await Notification.create({ user_id, title, message });
    return { count: 1, ids: [row.id] };
  }

  const users = await User.listIds();
  if (users.length === 0) return { count: 0, ids: [] };
  const rows = await Notification.createMany(
    users.map(({ id }) => ({ user_id: id, title, message }))
  );
  return { count: rows.length, ids: rows.map((r) => r.id) };
};

export const submitFeedback = async (user, { message, rating, slot_id }) => {
  // Validate the slot reference up front for a friendly 404 instead of a raw
  // foreign-key violation from Postgres.
  if (slot_id) {
    const slot = await ParkingSlot.findById(slot_id);
    if (!slot) throw new ApiError(404, 'Referenced parking slot not found');
  }
  return Feedback.create({ user_id: user.id, slot_id, message, rating });
};
