import { Router } from 'express';
import { createSlot, updateSlot, deleteSlot, listUsers } from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import {
  slotCreateSchema,
  slotUpdateSchema,
  idParamSchema,
  userListQuerySchema,
} from '../utils/validators.js';

const router = Router();

router.use(auth, admin); // the entire /admin surface is admin-only

router.post('/slots', validate(slotCreateSchema), createSlot);
router.put('/slots/:id', validate(idParamSchema, 'params'), validate(slotUpdateSchema), updateSlot);
router.delete('/slots/:id', validate(idParamSchema, 'params'), deleteSlot);

router.get('/users', validate(userListQuerySchema, 'query'), listUsers);

export default router;
