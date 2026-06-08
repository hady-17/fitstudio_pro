import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type { ListNotificationsQuery } from './notifications.schema.js';

const NOTIFICATION_COLUMNS = 'id, user_id, type, title, message, read_at, created_at';

const getNotificationOrThrow = async (notificationId: string) => {
  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('id', notificationId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch notification');
  }

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return notification;
};

export const listNotifications = async (
  requesterId: string,
  query?: ListNotificationsQuery,
) => {
  const limit = query?.limit ?? 50;
  const offset = query?.offset ?? 0;

  let request = supabaseAdmin
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('user_id', requesterId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query?.unreadOnly) {
    request = request.is('read_at', null);
  }

  const { data: notifications, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to fetch notifications');
  }

  return notifications ?? [];
};

export const markNotificationRead = async (
  requesterId: string,
  notificationId: string,
) => {
  const notification = await getNotificationOrThrow(notificationId);

  if (notification.user_id !== requesterId) {
    throw new ApiError(403, 'You do not have access to this notification');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error || !updated) {
    throw new ApiError(500, 'Failed to mark notification as read');
  }

  return updated;
};
