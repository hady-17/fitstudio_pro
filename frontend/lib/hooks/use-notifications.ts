'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import type { ApiResponse, Notification } from '@/lib/types';

interface NotificationsData {
  notifications: Notification[];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<NotificationsData>>('/api/notifications?limit=20');
      setNotifications(res.data.data.notifications);
    } catch {
      // non-critical — bell stays empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  return { notifications, loading, fetch, markRead, unreadCount };
}
