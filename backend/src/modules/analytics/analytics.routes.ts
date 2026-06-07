import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getStudioOverviewController } from './analytics.controller.js';
import { getStudioOverviewSchema } from './analytics.schema.js';

const router = Router({ mergeParams: true });

/**
 * @route GET /api/studios/:studioId/analytics/overview
 * @desc Get dashboard overview numbers for a studio (owners see studio-wide
 *       numbers, trainers see numbers scoped to their assigned clients)
 * @access Private (studio owner or trainer)
 */
router.get(
  '/overview',
  authMiddleware,
  validate(getStudioOverviewSchema),
  getStudioOverviewController,
);

export default router;
