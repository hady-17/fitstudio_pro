'use client';

import * as Popover from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function NotificationsDropdown() {
  const { notifications, loading, fetch, markRead, unreadCount } = useNotifications();

  return (
    <Popover.Root onOpenChange={(open) => { if (open) fetch(); }}>
      <Popover.Trigger asChild>
        <button
          aria-label="Notifications"
          className="relative rounded-xl p-2 text-secondary-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl border border-border bg-elevated shadow-lg focus:outline-none"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted">{unreadCount} unread</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const isUnread = n.read_at === null;

  return (
    <button
      onClick={() => { if (isUnread) onRead(n.id); }}
      className={cn(
        'flex w-full flex-col gap-0.5 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0',
        'hover:bg-surface',
        isUnread && 'bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-sm font-medium leading-snug',
            isUnread ? 'text-foreground' : 'text-secondary-foreground',
          )}
        >
          {n.title}
        </span>
        <span className="shrink-0 text-xs text-muted">{timeAgo(n.created_at)}</span>
      </div>
      <p className="text-xs leading-relaxed text-secondary-foreground">{n.message}</p>
      {isUnread && (
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
          Mark as read
        </span>
      )}
    </button>
  );
}
