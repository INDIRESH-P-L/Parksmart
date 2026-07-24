// Role gates. `auth` must run first in the chain so req.user exists.
import { ApiError } from '../utils/response.js';

export const requireRole = (...allowed) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!allowed.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  return next();
};

export const admin = requireRole('admin');

// Gate staff: operators can verify QR check-in/check-out but cannot manage
// slots, see analytics, or administer users.
export const adminOrOperator = requireRole('admin', 'operator');
