import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createSessionController,
  listSessionsController,
  updateSessionStatusController,
} from './sessions.controller.js';
import {
  createSessionSchema,
  listSessionsSchema,
  updateSessionStatusSchema,
} from './sessions.schema.js';

// Mounted at /api/studios/:studioId/sessions
export const studioSessionsRouter = Router({ mergeParams: true });

/**
 * @route POST /api/studios/:studioId/sessions
 * @desc Book a new session for a client with a trainer
 * @access Private (owner or trainer)
 */
studioSessionsRouter.post(
  '/',
  authMiddleware,
  validate(createSessionSchema),
  createSessionController,
);

/**
 * @route GET /api/studios/:studioId/sessions
 * @desc List sessions for a studio (owners see all, trainers see their own)
 * @access Private (owner or trainer)
 */
studioSessionsRouter.get(
  '/',
  authMiddleware,
  validate(listSessionsSchema),
  listSessionsController,
);

// Mounted at /api/sessions
export const sessionRouter = Router();

/**
 * @route PATCH /api/sessions/:sessionId/status
 * @desc Update a session status (completed, cancelled, no_show)
 * @access Private (owner or assigned trainer)
 */
sessionRouter.patch(
  '/:sessionId/status',
  authMiddleware,
  validate(updateSessionStatusSchema),
  updateSessionStatusController,
);
