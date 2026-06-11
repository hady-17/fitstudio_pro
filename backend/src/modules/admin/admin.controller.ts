import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getSystemStats,
  listUsers,
  updateUserRole,
  resetUserPassword,
  listStudios,
  deleteStudio,
  listAllClients,
  updateClientStatus,
  createExercise,
  updateExercise,
  deleteExercise,
  listPayments,
  listAuditLogs,
} from './admin.service.js';

export const getSystemStatsController = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getSystemStats();
  res.status(200).json({ success: true, data: { stats } });
});

export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUsers(req.query as never);
  res.status(200).json({ success: true, data: result });
});

export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateUserRole(req.user!.id, req.params.userId, req.body);
  res.status(200).json({ success: true, data: result });
});

export const resetUserPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const result = await resetUserPassword(req.user!.id, req.params.userId);
  res.status(200).json({ success: true, data: result });
});

export const listStudiosController = asyncHandler(async (req: Request, res: Response) => {
  const result = await listStudios(req.query as never);
  res.status(200).json({ success: true, data: result });
});

export const deleteStudioController = asyncHandler(async (req: Request, res: Response) => {
  await deleteStudio(req.user!.id, req.params.studioId);
  res.status(200).json({ success: true, data: null });
});

export const listAllClientsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAllClients(req.query as never);
  res.status(200).json({ success: true, data: result });
});

export const updateClientStatusController = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateClientStatus(req.user!.id, req.params.clientId, req.body);
  res.status(200).json({ success: true, data: result });
});

export const createExerciseController = asyncHandler(async (req: Request, res: Response) => {
  const exercise = await createExercise(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { exercise } });
});

export const updateExerciseController = asyncHandler(async (req: Request, res: Response) => {
  const exercise = await updateExercise(req.user!.id, req.params.exerciseId, req.body);
  res.status(200).json({ success: true, data: { exercise } });
});

export const deleteExerciseController = asyncHandler(async (req: Request, res: Response) => {
  await deleteExercise(req.user!.id, req.params.exerciseId);
  res.status(200).json({ success: true, data: null });
});

export const listPaymentsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await listPayments(req.query as never);
  res.status(200).json({ success: true, data: result });
});

export const listAuditLogsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAuditLogs(req.query as never);
  res.status(200).json({ success: true, data: result });
});
