import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createWorkoutDayController,
  createWorkoutItemController,
  createWorkoutPlanController,
  getWorkoutPlanByIdController,
  listWorkoutPlansController,
  updateWorkoutPlanController,
  deleteWorkoutPlanController,
  updateWorkoutDayController,
  deleteWorkoutDayController,
  updateWorkoutItemController,
  deleteWorkoutItemController,
} from './workouts.controller.js';
import {
  createWorkoutDaySchema,
  createWorkoutItemSchema,
  createWorkoutPlanSchema,
  getWorkoutPlanByIdSchema,
  listWorkoutPlansSchema,
  updateWorkoutPlanSchema,
  updateWorkoutDaySchema,
  updateWorkoutItemSchema,
} from './workouts.schema.js';

const router = Router({ mergeParams: true });
/**
 * @route GET /api/studios/:studioId/workout-plans/:planId
 * @desc Get workout plan by id
 * @access Private (trainer or admin)
 */
router.get(
  '/:planId',
  authMiddleware,
  validate(getWorkoutPlanByIdSchema),
  getWorkoutPlanByIdController,
);

/**
 * @route GET /api/studios/:studioId/workout-plans
 * @desc List workout plans
 * @access Private (trainer or admin)
 */
router.get('/', authMiddleware, validate(listWorkoutPlansSchema), listWorkoutPlansController);
/**
 * @route POST /api/studios/:studioId/workout-plans
 * @desc Create a new workout plan
 * @access Private (trainer or admin)
 * @body { clientId: string, title: string, description?: string, startDate?: string, endDate?: string, status?: 'draft' | 'active' | 'completed' | 'archived' }
 */
router.post(
  '/',
  authMiddleware,
  validate(createWorkoutPlanSchema),
  createWorkoutPlanController,
);

/**
 * @route PATCH /api/studios/:studioId/workout-plans/:planId
 * @desc Update a workout plan
 */
router.patch('/:planId', authMiddleware, validate(updateWorkoutPlanSchema), updateWorkoutPlanController);

/**
 * @route DELETE /api/studios/:studioId/workout-plans/:planId
 * @desc Archive (soft-delete) a workout plan
 */
router.delete('/:planId', authMiddleware, validate(getWorkoutPlanByIdSchema), deleteWorkoutPlanController);
/**
 * @route POST /api/studios/:studioId/workout-plans/:planId/days
 * @desc Create a new workout day in a workout plan
 * @access Private (trainer or admin)
 * @body { date: string, exercises: Array<{ name: string, sets: number, reps: number, rest: number }> }
 */
router.post(
  '/:planId/days',
  authMiddleware,
  validate(createWorkoutDaySchema),
  createWorkoutDayController,
);
/**
 * @route PATCH /api/studios/:studioId/workout-plans/:planId/days/:dayId
 * @desc Update a workout day in a workout plan
 * @access Private (trainer or admin)
 * @body { date?: string, exercises?: Array<{ name: string, sets: number, reps: number, rest: number }> }
 */
router.patch('/:planId/days/:dayId', authMiddleware, validate(updateWorkoutDaySchema), updateWorkoutDayController);
/**
 * @route DELETE /api/studios/:studioId/workout-plans/:planId/days/:dayId
 * @desc Delete a workout day from a workout plan
 * @access Private (trainer or admin)
 */
router.delete('/:planId/days/:dayId', authMiddleware, deleteWorkoutDayController);
/**
 * @route POST /api/studios/:studioId/workout-plans/:planId/days/:dayId/items
 * @desc Create a new workout item in a workout day
 * @access Private (trainer or admin)
 * @body { name: string, sets: number, reps: number, rest: number }
 */
router.post(
  '/:planId/days/:dayId/items',
  authMiddleware,
  validate(createWorkoutItemSchema),
  createWorkoutItemController,
);

router.patch('/:planId/days/:dayId/items/:itemId', authMiddleware, validate(updateWorkoutItemSchema), updateWorkoutItemController);

router.delete('/:planId/days/:dayId/items/:itemId', authMiddleware, deleteWorkoutItemController);

export default router;