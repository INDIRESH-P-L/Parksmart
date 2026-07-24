// Central response envelope — every endpoint (success or failure) returns
// { success, data, message } so all three clients (web, mobile, curl) can
// parse responses uniformly.

export class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} message Human-readable, safe-to-display message
   * @param {Array=} errors  Optional detail list (e.g. zod field issues)
   */
  constructor(status, message, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const ok = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, data, message });

export const created = (res, data = null, message = 'Created') => ok(res, data, message, 201);

export const fail = (res, status = 500, message = 'Internal server error', errors = undefined) =>
  res.status(status).json({ success: false, data: null, message, ...(errors ? { errors } : {}) });

// Wraps async controllers so a thrown/rejected error reaches errorHandler
// without per-controller try/catch noise.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
