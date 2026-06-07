import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getStudioOverviewAnalytics } from './analytics.service.js';

export const getStudioOverviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const overview = await getStudioOverviewAnalytics(req.user!.id, studioId);

    res.status(200).json({ success: true, data: { overview } });
  },
);
