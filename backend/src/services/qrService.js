// QR ticket generation + verification.
//
// The QR image encodes a small JSON payload:
//   { v: 1, bid: <booking uuid>, ref: <human ref>, iat: <epoch ms>, sig: <hmac> }
// where sig = HMAC-SHA256(`${bid}.${iat}`, QR_SECRET).
//
// Anyone can *read* a QR code, but only this server can *mint* a valid
// signature — so a ticket can't be forged by editing the booking id, and a
// screenshot of someone else's ticket is useless once their booking completes
// (verify-qr rejects re-use after check-out).
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/response.js';

const sign = (bookingId, iat) =>
  crypto
    .createHmac('sha256', env.QR_SECRET)
    .update(`${bookingId}.${iat}`)
    .digest('hex')
    .slice(0, 32); // 128 bits of the MAC — plenty, keeps the QR dense-but-scannable

export const createBookingQr = async (bookingId, ref) => {
  const iat = Date.now();
  const payload = JSON.stringify({ v: 1, bid: bookingId, ref, iat, sig: sign(bookingId, iat) });

  // A base64 data-URL PNG stored straight into bookings.qr_code_url — no file
  // storage bucket needed (per spec this is acceptable for the ticket view).
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 480,
    color: { dark: '#0A0A0A', light: '#FFFFFF' }, // on-theme near-black modules
  });

  return { payload, dataUrl };
};

export const verifyQrPayload = (raw) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(400, 'Unreadable QR code');
  }

  const { bid, iat, sig } = parsed ?? {};
  if (!bid || !iat || !sig) throw new ApiError(400, 'Unreadable QR code');

  // timingSafeEqual prevents signature-guessing via response-time analysis.
  const expected = Buffer.from(sign(bid, iat));
  const provided = Buffer.from(String(sig));
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new ApiError(401, 'QR signature is invalid');
  }

  return { bookingId: bid };
};
