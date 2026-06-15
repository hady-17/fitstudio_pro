jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import { listNotifications, markNotificationRead } from '../../src/modules/notifications/notifications.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const USER  = 'user-0000-0000-0000-000000000001';
const OTHER_USER = 'user-0000-0000-0000-000000000099';
const NOTIFICATION = 'notif-000-0000-0000-000000000002';

const mockNotification = {
  id: NOTIFICATION,
  user_id: USER,
  type: 'session_reminder',
  title: 'Upcoming session',
  message: 'Your session with Jane Doe starts in 1 hour',
  read_at: null,
  created_at: '2026-06-01T10:00:00Z',
};

beforeEach(() => {
  from.mockReset();
});

// ── listNotifications ────────────────────────────────────────────────────────
describe('listNotifications', () => {
  it('lists the requester own notifications', async () => {
    from.mockReturnValueOnce(qb({ data: [mockNotification] }));

    const result = await listNotifications(USER);

    expect(result).toEqual([mockNotification]);
    expect(from).toHaveBeenCalledWith('notifications');
  });

  it('filters to unread only when unreadOnly is true', async () => {
    const builder = qb({ data: [mockNotification] });
    from.mockReturnValueOnce(builder);

    await listNotifications(USER, { unreadOnly: true });

    expect(builder.is).toHaveBeenCalledWith('read_at', null);
  });

  it('returns an empty array when there are no notifications', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    const result = await listNotifications(USER);

    expect(result).toEqual([]);
  });

  it('throws a 500 error on database failure', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listNotifications(USER)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── markNotificationRead ─────────────────────────────────────────────────────
describe('markNotificationRead', () => {
  it('marks the requester own notification as read', async () => {
    const updated = { ...mockNotification, read_at: '2026-06-01T11:00:00Z' };
    from
      .mockReturnValueOnce(qb({ data: mockNotification }))
      .mockReturnValueOnce(qb({ data: updated }));

    const result = await markNotificationRead(USER, NOTIFICATION);

    expect(result).toEqual(updated);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('throws a 404 error when the notification does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(markNotificationRead(USER, NOTIFICATION)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws a 403 error when the notification belongs to another user', async () => {
    from.mockReturnValueOnce(qb({ data: mockNotification }));

    await expect(markNotificationRead(OTHER_USER, NOTIFICATION)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws a 500 error when fetching the notification fails', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(markNotificationRead(USER, NOTIFICATION)).rejects.toMatchObject({ statusCode: 500 });
  });

  it('throws a 500 error when the update fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockNotification }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(markNotificationRead(USER, NOTIFICATION)).rejects.toMatchObject({ statusCode: 500 });
  });
});
