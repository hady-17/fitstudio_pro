import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listNotificationsController,
  markNotificationReadController,
} from './notifications.controller.js';
import {
  listNotificationsSchema,
  markNotificationReadSchema,
} from './notifications.schema.js';

const router = Router();

/**
 * @route GET /api/notifications
 * @desc List the current user's notifications
 * @access Private (the recipient themselves)
 */
router.get(
  '/',
  authMiddleware,
  validate(listNotificationsSchema),
  listNotificationsController,
);

/**
 * @route PATCH /api/notifications/:notificationId/read
 * @desc Mark a notification as read
 * @access Private (the recipient themselves)
 */
router.patch(
  '/:notificationId/read',
  authMiddleware,
  validate(markNotificationReadSchema),
  markNotificationReadController,
);

export default router;
