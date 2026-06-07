import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getMe, linkClientProfileController } from './auth.controller.js';

const router = Router();

router.get('/me', authMiddleware, getMe);
router.post(
  '/link-client-profile',
  authMiddleware,
  linkClientProfileController,
);  

export default router;