import { Router } from 'express';
import { listSlots, getSlot, availability, heatmap } from '../controllers/parkingController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import { slotFilterSchema, idParamSchema } from '../utils/validators.js';

const router = Router();

// Public: the map and availability widgets work without an account.
router.get('/slots', validate(slotFilterSchema, 'query'), listSlots);
router.get('/availability', availability);
// Registered before /slots/:id shadow risk doesn't exist here (different path),
// but heatmap must NOT be public — admin-only aggregate view.
router.get('/heatmap', auth, admin, heatmap);
router.get('/slots/:id', validate(idParamSchema, 'params'), getSlot);

export default router;
