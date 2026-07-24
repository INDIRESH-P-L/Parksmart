import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  listFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  favoriteSchema,
  slotIdParamSchema,
} from '../utils/validators.js';

const router = Router();

router.use(auth); // every /users route is authenticated

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

router.get('/favorites', listFavorites);
router.post('/favorites', validate(favoriteSchema), addFavorite);
router.delete('/favorites/:slotId', validate(slotIdParamSchema, 'params'), removeFavorite);

export default router;
