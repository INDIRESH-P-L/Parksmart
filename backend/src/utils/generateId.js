// Human-friendly reference codes (e.g. the booking ref printed on QR tickets).
// NOT a security token — uniqueness/identity comes from the DB uuid primary
// key; this exists purely so gate staff and users have something short to read
// out loud ("PS-8F3K2Q").
import crypto from 'node:crypto';

// No 0/O/1/I/L — avoids misreads on a phone screen at a gate.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const generateRef = (prefix = 'PS', length = 6) => {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${out}`;
};
