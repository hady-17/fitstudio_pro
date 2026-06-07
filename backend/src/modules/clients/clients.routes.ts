import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createClientController, deleteClientController, getClientByIdController, listClientsController, updateClientController } from './clients.controller.js';
import { createClientSchema, deleteClientSchema, getClientByIdSchema, listClientsSchema, updateClientSchema } from './clients.schema.js';

const router = Router({ mergeParams: true });

// GET /studios/:studioId/clients
// Query: ?status=active|paused|cancelled&search=string
// Returns a list of clients for the studio. Only authenticated users.
router.get(
  '/',
  authMiddleware,
  validate(listClientsSchema),
  listClientsController,
);
// GET /studios/:studioId/clients/:clientId
// Path params: studioId (uuid), clientId (uuid)
// Returns a single client by ID. Only authenticated users.
router.get(
  '/:clientId',
  authMiddleware,
  validate(getClientByIdSchema),
  getClientByIdController,
);
// PATCH /studios/:studioId/clients/:clientId
// Path params: studioId (uuid), clientId (uuid)
// Body: Any of { fullName, email, trainerId, status, goal, notes, joinedAt } (at least one required)
// Updates a client. Only authenticated users.
router.patch(
  '/:clientId',
  authMiddleware,
  validate(updateClientSchema),
  updateClientController,
);
// DELETE /studios/:studioId/clients/:clientId
// Path params: studioId (uuid), clientId (uuid)
// Deletes a client. Only authenticated users.
router.delete(
  '/:clientId',
  authMiddleware,
  validate(deleteClientSchema),
  deleteClientController,
);
// POST /studios/:studioId/clients
// Body: { fullName (required), email (optional), trainerId (optional), status (optional), goal (optional), notes (optional), joinedAt (optional, YYYY-MM-DD) }
// Creates a new client in the studio. Only authenticated users.
router.post(
  '/',
  authMiddleware,
  validate(createClientSchema),
  createClientController,
);

export default router;