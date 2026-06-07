import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createCheckIn,
  listCheckIns,
  createMeasurement,
  listMeasurements,
  getClientProgressTrend,
} from './checkins.service.js';

export const createCheckInController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const checkIn = await createCheckIn(req.user!.id, clientId, req.body);

    res.status(201).json({ success: true, data: { checkIn } });
  },
);

export const listCheckInsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const checkIns = await listCheckIns(req.user!.id, clientId, req.query as any);

    res.status(200).json({ success: true, data: { checkIns } });
  },
);

export const createMeasurementController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const measurement = await createMeasurement(req.user!.id, clientId, req.body);

    res.status(201).json({ success: true, data: { measurement } });
  },
);

export const listMeasurementsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const measurements = await listMeasurements(req.user!.id, clientId, req.query as any);

    res.status(200).json({ success: true, data: { measurements } });
  },
);

export const getClientProgressTrendController = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const trend = await getClientProgressTrend(req.user!.id, clientId);

    res.status(200).json({ success: true, data: { trend } });
  },
);
