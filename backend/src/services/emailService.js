// Email delivery.
//
// ASSUMPTION (noted per spec): no SMTP provider is part of this stack, so the
// default transport renders the email to the server log — fully functional and
// visible during demos/tests. sendEmail() is the single seam where a real
// provider (Resend / SES / nodemailer SMTP) plugs in later without touching
// any caller.
import { logger } from '../utils/logger.js';

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

export const sendEmail = async ({ to, subject, text }) => {
  logger.info(
    [
      '┌── EMAIL (log transport) ─────────────────────',
      `│ To:      ${to}`,
      `│ Subject: ${subject}`,
      ...text.split('\n').map((line) => `│ ${line}`),
      '└──────────────────────────────────────────────',
    ].join('\n')
  );
  return { delivered: true, transport: 'log' };
};

export const sendBookingConfirmation = (user, booking) =>
  sendEmail({
    to: user.email,
    subject: `ParkSmart — slot ${booking.slot?.slot_number ?? ''} confirmed`,
    text: [
      `Hi ${user.name},`,
      '',
      `Your parking slot ${booking.slot?.slot_number ?? ''} (${booking.slot?.zone_name ?? 'campus'}) is booked.`,
      `From: ${formatWhen(booking.start_time)}`,
      `To:   ${formatWhen(booking.end_time)}`,
      `Total: ₹${booking.total_price}`,
      '',
      'Show the QR ticket in the app at the gate to check in.',
      '— ParkSmart',
    ].join('\n'),
  });

export const sendBookingCancellation = (user, booking) =>
  sendEmail({
    to: user.email,
    subject: `ParkSmart — booking for slot ${booking.slot?.slot_number ?? ''} cancelled`,
    text: [
      `Hi ${user.name},`,
      '',
      `Your booking for slot ${booking.slot?.slot_number ?? ''} has been cancelled.`,
      'The slot has been released for other drivers.',
      '— ParkSmart',
    ].join('\n'),
  });
