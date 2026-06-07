import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createStudioController,getMyStudiosController,getStudioByIdController,getStudioMembersController,updateStudioController,addTrainerController, removeStudioMemberController, deleteStudioController } from './studios.controller.js';
import { createStudioSchema, getStudioByIdSchema,getStudioMembersSchema,updateStudioSchema, addtrainerSchema, removeStudioMemberSchema, deleteStudioSchema } from './studios.schema.js';

const router = Router();

// GET /studios/me
// Returns all studios the authenticated user is a member of.
router.get('/me', authMiddleware, getMyStudiosController);
// GET /studios/:studioId
// Path params: studioId (uuid)
// Returns a studio by ID.
router.get(
  '/:studioId',
  authMiddleware,
  validate(getStudioByIdSchema),
  getStudioByIdController,
);
// GET /studios/:studioId/members
// Path params: studioId (uuid)
// Returns all members of a studio.
router.get(
  '/:studioId/members',
  authMiddleware,
  validate(getStudioMembersSchema),
  getStudioMembersController,
);
// PATCH /studios/:studioId
// Path params: studioId (uuid)
// Body: Any of { name, slug, description } (at least one required)
// Updates studio details.
router.patch(
  '/:studioId',
  authMiddleware,
  validate(updateStudioSchema),
  updateStudioController,
);
// POST /studios
// Body: { name (required), slug (required), description (optional) }
// Creates a new studio.
router.post(
  '/',
  authMiddleware,
  validate(createStudioSchema),
  createStudioController,
);
// POST /studios/:studioId/trainers
// Path params: studioId (uuid)
// Body: { email (required) }
// Adds a trainer to the studio by email.
router.post(
  '/:studioId/trainers',
  authMiddleware,
  validate(addtrainerSchema),
  addTrainerController,
);
// DELETE /studios/:studioId/members/:memberId
// Path params: studioId (uuid), memberId (uuid)
// Removes a member from the studio.
router.delete(
  '/:studioId/members/:memberId',
  authMiddleware,
  validate(removeStudioMemberSchema),
  removeStudioMemberController,
);
// DELETE /studios/:studioId
// Path params: studioId (uuid)
// Deletes a studio.
router.delete(
  '/:studioId',
  authMiddleware,
  validate(deleteStudioSchema),
  deleteStudioController,
);
export default router;