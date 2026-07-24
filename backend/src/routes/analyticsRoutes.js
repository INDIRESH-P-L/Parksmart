import { Router } from 'express';
import { summary, peakHours, trends } from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import { peakHoursQuerySchema } from '../utils/validators.js';

const router = Router();

router.use(auth, admin); // analytics are admin-only aggregates

router.get('/summary', summary);
router.get('/peak-hours', validate(peakHoursQuerySchema, 'query'), peakHours);
router.get('/trends', validate(peakHoursQuerySchema, 'query'), trends);

export default router;
