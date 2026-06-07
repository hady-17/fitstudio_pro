import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createWorkoutLogController,
  listWorkoutLogsController,
} from './workouts.controller.js';
import {
  createWorkoutLogSchema,
  listWorkoutLogsSchema,
} from './workouts.schema.js';

const router = Router({ mergeParams: true });

/**
 * @route POST /api/clients/:clientId/workout-logs
 * @desc Log a completed workout day for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
router.post(
  '/',
  authMiddleware,
  validate(createWorkoutLogSchema),
  createWorkoutLogController,
);

/**
 * @route GET /api/clients/:clientId/workout-logs
 * @desc List workout logs for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
router.get(
  '/',
  authMiddleware,
  validate(listWorkoutLogsSchema),
  listWorkoutLogsController,
);

export default router;
