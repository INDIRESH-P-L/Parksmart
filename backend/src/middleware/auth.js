// Bearer-token authentication.
//
// Flow: extract token → reject if revoked (logout denylist) → verify the JWT
// signature → load the CURRENT user row from the DB → attach req.user/req.token.
//
// Loading the user fresh on every request (instead of trusting the token
// payload) means role changes, profile edits, and account deletion take effect
// immediately rather than at token expiry — worth one indexed PK lookup.
import { verifyToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/response.js';
import { isTokenRevoked } from '../services/authService.js';
import * as User from '../models/User.js';

export const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  if (isTokenRevoked(token)) {
    throw new ApiError(401, 'Session has been logged out — please log in again');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account no longer exists');

  req.user = user; // password hash already excluded by the model's SAFE_COLUMNS
  req.token = token; // used by POST /auth/logout to revoke this session
  next();
});
