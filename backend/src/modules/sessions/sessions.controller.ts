import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createSession,
  listSessions,
  updateSessionStatus,
} from './sessions.service.js';
import type { ListSessionsQuery } from './sessions.schema.js';

export const createSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const session = await createSession(req.user!.id, studioId, req.body);

    res.status(201).json({ success: true, data: { session } });
  },
);

export const listSessionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const sessions = await listSessions(req.user!.id, studioId, req.query as ListSessionsQuery);

    res.status(200).json({ success: true, data: { sessions } });
  },
);

export const updateSessionStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await updateSessionStatus(req.user!.id, sessionId, req.body);

    res.status(200).json({ success: true, data: { session } });
  },
);
