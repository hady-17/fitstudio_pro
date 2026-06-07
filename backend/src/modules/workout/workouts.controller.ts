import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createWorkoutDay,
  createWorkoutItem,
  createWorkoutPlan,
  getWorkoutPlanById,
  listWorkoutPlans,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  updateWorkoutDay,
  deleteWorkoutDay,
  updateWorkoutItem,
  deleteWorkoutItem,
  createWorkoutLog,
  listWorkoutLogs,
} from './workouts.service.js';

export const createWorkoutPlanController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const workoutPlan = await createWorkoutPlan(
      req.user!.id,
      studioId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: {
        workoutPlan,
      },
    });
  },
);
export const getWorkoutPlanByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId } = req.params;

    const workoutPlan = await getWorkoutPlanById(
      req.user!.id,
      studioId,
      planId,
    );

    res.status(200).json({
      success: true,
      data: {
        workoutPlan,
      },
    });
  },
);
export const createWorkoutDayController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId } = req.params;

    const workoutDay = await createWorkoutDay(
      req.user!.id,
      studioId,
      planId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: {
        workoutDay,
      },
    });
  },
);
export const createWorkoutItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId, dayId } = req.params;

    const workoutItem = await createWorkoutItem(
      req.user!.id,
      studioId,
      planId,
      dayId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: {
        workoutItem,
      },
    });
  },
);

export const listWorkoutPlansController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const plans = await listWorkoutPlans(req.user!.id, studioId, req.query as any);

    res.status(200).json({ success: true, data: { plans } });
  },
);

export const updateWorkoutPlanController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId } = req.params;

    const workoutPlan = await updateWorkoutPlan(req.user!.id, studioId, planId, req.body);

    res.status(200).json({ success: true, data: { workoutPlan } });
  },
);

export const deleteWorkoutPlanController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId } = req.params;

    const result = await deleteWorkoutPlan(req.user!.id, studioId, planId);

    res.status(200).json({ success: true, data: result });
  },
);

export const updateWorkoutDayController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId, dayId } = req.params;

    const workoutDay = await updateWorkoutDay(req.user!.id, studioId, planId, dayId, req.body);

    res.status(200).json({ success: true, data: { workoutDay } });
  },
);

export const deleteWorkoutDayController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId, dayId } = req.params;

    const result = await deleteWorkoutDay(req.user!.id, studioId, planId, dayId);

    res.status(200).json({ success: true, data: result });
  },
);

export const updateWorkoutItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId, dayId, itemId } = req.params;

    const workoutItem = await updateWorkoutItem(req.user!.id, studioId, planId, dayId, itemId, req.body);

    res.status(200).json({ success: true, data: { workoutItem } });
  },
);

export const deleteWorkoutItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, planId, dayId, itemId } = req.params;

    const result = await deleteWorkoutItem(req.user!.id, studioId, planId, dayId, itemId);

    res.status(200).json({ success: true, data: result });
  },
);

export const createWorkoutLogController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const workoutLog = await createWorkoutLog(req.user!.id, clientId, req.body);

    res.status(201).json({ success: true, data: { workoutLog } });
  },
);

export const listWorkoutLogsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const logs = await listWorkoutLogs(req.user!.id, clientId, req.query as any);

    res.status(200).json({ success: true, data: { logs } });
  },
);