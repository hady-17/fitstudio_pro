import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createCheckInController,
  listCheckInsController,
  createMeasurementController,
  listMeasurementsController,
  getClientProgressTrendController,
} from './checkins.controller.js';
import {
  createCheckInSchema,
  listCheckInsSchema,
  createMeasurementSchema,
  listMeasurementsSchema,
  getProgressTrendSchema,
} from './checkins.schema.js';

const checkInsRouter = Router({ mergeParams: true });

/**
 * @route POST /api/clients/:clientId/check-ins
 * @desc Submit a check-in for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
checkInsRouter.post(
  '/',
  authMiddleware,
  validate(createCheckInSchema),
  createCheckInController,
);

/**
 * @route GET /api/clients/:clientId/check-ins
 * @desc List check-ins for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
checkInsRouter.get(
  '/',
  authMiddleware,
  validate(listCheckInsSchema),
  listCheckInsController,
);

const measurementsRouter = Router({ mergeParams: true });

/**
 * @route POST /api/clients/:clientId/measurements
 * @desc Submit body measurements for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
measurementsRouter.post(
  '/',
  authMiddleware,
  validate(createMeasurementSchema),
  createMeasurementController,
);

/**
 * @route GET /api/clients/:clientId/measurements
 * @desc List measurements for a client
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
measurementsRouter.get(
  '/',
  authMiddleware,
  validate(listMeasurementsSchema),
  listMeasurementsController,
);

const progressRouter = Router({ mergeParams: true });

/**
 * @route GET /api/clients/:clientId/progress/trend
 * @desc Get a simple weight trend (latest vs previous) from check-ins and measurements
 * @access Private (client themselves, assigned trainer, or studio owner)
 */
progressRouter.get(
  '/trend',
  authMiddleware,
  validate(getProgressTrendSchema),
  getClientProgressTrendController,
);

export { checkInsRouter, measurementsRouter, progressRouter };
