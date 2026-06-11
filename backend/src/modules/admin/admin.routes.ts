import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { adminMiddleware } from '../../middleware/admin.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listUsersSchema,
  updateUserRoleSchema,
  resetUserPasswordSchema,
  listStudiosSchema,
  studioIdParamSchema,
  listClientsSchema,
  updateClientStatusSchema,
  createExerciseSchema,
  updateExerciseSchema,
  exerciseIdParamSchema,
  listPaymentsSchema,
  listAuditLogsSchema,
} from './admin.schema.js';
import {
  getSystemStatsController,
  listUsersController,
  updateUserRoleController,
  resetUserPasswordController,
  listStudiosController,
  deleteStudioController,
  listAllClientsController,
  updateClientStatusController,
  createExerciseController,
  updateExerciseController,
  deleteExerciseController,
  listPaymentsController,
  listAuditLogsController,
} from './admin.controller.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Stats
router.get('/stats', getSystemStatsController);

// Users
router.get('/users', validate(listUsersSchema), listUsersController);
router.patch('/users/:userId/role', validate(updateUserRoleSchema), updateUserRoleController);
router.post('/users/:userId/reset-password', validate(resetUserPasswordSchema), resetUserPasswordController);

// Studios
router.get('/studios', validate(listStudiosSchema), listStudiosController);
router.delete('/studios/:studioId', validate(studioIdParamSchema), deleteStudioController);

// Clients
router.get('/clients', validate(listClientsSchema), listAllClientsController);
router.patch('/clients/:clientId/status', validate(updateClientStatusSchema), updateClientStatusController);

// Exercises
router.post('/exercises', validate(createExerciseSchema), createExerciseController);
router.patch('/exercises/:exerciseId', validate(updateExerciseSchema), updateExerciseController);
router.delete('/exercises/:exerciseId', validate(exerciseIdParamSchema), deleteExerciseController);

// Payments
router.get('/payments', validate(listPaymentsSchema), listPaymentsController);

// Audit logs
router.get('/audit-logs', validate(listAuditLogsSchema), listAuditLogsController);

export default router;
