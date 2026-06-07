import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { listExercisesController } from './exercises.controller.js';
import { listExercisesSchema } from './exercises.schema.js';

const router = Router();
/**
 * GET /exercises
 * Query params: search (string, optional), muscleGroup (string, optional), equipment (string, optional), difficulty (enum: 'beginner' | 'intermediate' | 'advanced', optional)
 * Returns a list of exercises filtered by the provided query parameters.
 */
router.get(
  '/',
  authMiddleware,
  validate(listExercisesSchema),
  listExercisesController,
);

export default router;