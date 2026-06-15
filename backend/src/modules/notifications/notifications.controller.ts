import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listNotifications, markNotificationRead } from './notifications.service.js';
import type { ListNotificationsQuery } from './notifications.schema.js';

export const listNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const notifications = await listNotifications(req.user!.id, req.query as unknown as ListNotificationsQuery);

    res.status(200).json({ success: true, data: { notifications } });
  },
);

export const markNotificationReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    const notification = await markNotificationRead(req.user!.id, notificationId);

    res.status(200).json({ success: true, data: { notification } });
  },
);
