import { Router } from 'express';
import {
  createBooking,
  myBookings,
  getBooking,
  cancelBooking,
  verifyQr,
} from '../controllers/bookingController.js';
import { auth } from '../middleware/auth.js';
import { adminOrOperator } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';
import { createBookingSchema, verifyQrSchema, idParamSchema } from '../utils/validators.js';

const router = Router();

router.use(auth); // every booking route is authenticated

router.post('/create', bookingLimiter, validate(createBookingSchema), createBooking);

// NOTE: static paths are registered before '/:id' so 'my-bookings' and
// 'verify-qr' are never captured by the id parameter.
router.get('/my-bookings', myBookings);
router.post('/verify-qr', adminOrOperator, validate(verifyQrSchema), verifyQr);

router.get('/:id', validate(idParamSchema, 'params'), getBooking);
router.post('/:id/cancel', validate(idParamSchema, 'params'), cancelBooking);

export default router;
