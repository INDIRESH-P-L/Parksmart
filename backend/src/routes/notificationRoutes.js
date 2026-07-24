// Mounted at /api/v1 (not /api/v1/notifications) so this one router can serve
// both the /notifications endpoints and POST /feedback, matching the API
// contract without inventing an extra route file outside the agreed layout.
import { Router } from 'express';
import { list, markRead, broadcast, submitFeedback } from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import { broadcastSchema, feedbackSchema, idParamSchema } from '../utils/validators.js';

const router = Router();

router.get('/notifications', auth, list);
router.post('/notifications', auth, admin, validate(broadcastSchema), broadcast);
// Extra beyond the contract: without this, is_read could never change.
router.patch('/notifications/:id/read', auth, validate(idParamSchema, 'params'), markRead);

router.post('/feedback', auth, validate(feedbackSchema), submitFeedback);

export default router;
