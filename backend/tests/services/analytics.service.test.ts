jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import { getStudioOverviewAnalytics } from '../../src/modules/analytics/analytics.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

const OWNER   = 'owner-0000-0000-0000-000000000001';
const TRAINER = 'trainer-00-0000-0000-000000000002';
const STUDIO  = 'studio-000-0000-0000-000000000004';

const ownerMembership   = { id: 'mem-1', role: 'owner' };
const trainerMembership = { id: 'mem-2', role: 'trainer' };

// "Now" pinned to Wednesday 2026-06-10T12:00:00Z so date-range math is deterministic:
//   week range  → [2026-06-08T00:00:00.000Z, 2026-06-15T00:00:00.000Z) (Mon–Mon)
//   month range → [2026-06-01T00:00:00.000Z, 2026-07-01T00:00:00.000Z)
//   7 days ago  → 2026-06-03T12:00:00.000Z
const NOW = new Date('2026-06-10T12:00:00.000Z');

beforeEach(() => {
  from.mockReset();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const activePlans = [{ id: 'plan-1' }, { id: 'plan-2' }];
const workoutDays = [{ id: 'day-1' }, { id: 'day-2' }, { id: 'day-3' }, { id: 'day-4' }];
const workoutLogs = [
  { workout_day_id: 'day-1' },
  { workout_day_id: 'day-1' },
  { workout_day_id: 'day-3' },
];
const activeClients = [{ id: 'client-1' }, { id: 'client-2' }, { id: 'client-3' }];
const recentCheckIns = [{ client_id: 'client-1' }];

function setupFullOverviewMocks(membership: { id: string; role: string }) {
  from
    .mockReturnValueOnce(qb({ data: membership }))           // membership
    .mockReturnValueOnce(qb({ count: 12 }))                   // activeClientsCount
    .mockReturnValueOnce(qb({ count: 3 }))                    // newClientsThisMonth
    .mockReturnValueOnce(qb({ count: 5 }))                    // sessionsThisWeek
    .mockReturnValueOnce(qb({ count: 8 }))                    // completedSessionsThisMonth
    .mockReturnValueOnce(qb({ count: 2 }))                    // missedSessionsThisMonth
    .mockReturnValueOnce(qb({ data: activePlans }))           // active workout plans
    .mockReturnValueOnce(qb({ data: workoutDays }))           // workout days
    .mockReturnValueOnce(qb({ data: workoutLogs }))           // workout logs
    .mockReturnValueOnce(qb({ data: activeClients }))         // active clients (for missed check-ins)
    .mockReturnValueOnce(qb({ data: recentCheckIns }));       // recent check-ins
}

describe('getStudioOverviewAnalytics', () => {
  it('owner gets studio-wide overview numbers', async () => {
    setupFullOverviewMocks(ownerMembership);

    const result = await getStudioOverviewAnalytics(OWNER, STUDIO);

    expect(result).toEqual({
      activeClients: 12,
      newClientsThisMonth: 3,
      sessionsThisWeek: 5,
      completedSessionsThisMonth: 8,
      missedSessionsThisMonth: 2,
      workoutCompletionRate: 50,
      missedCheckIns: 2,
    });
    expect(from).toHaveBeenCalledTimes(11);
  });

  it('trainer gets the same overview shape scoped to their clients', async () => {
    setupFullOverviewMocks(trainerMembership);

    const result = await getStudioOverviewAnalytics(TRAINER, STUDIO);

    expect(result).toEqual({
      activeClients: 12,
      newClientsThisMonth: 3,
      sessionsThisWeek: 5,
      completedSessionsThisMonth: 8,
      missedSessionsThisMonth: 2,
      workoutCompletionRate: 50,
      missedCheckIns: 2,
    });
  });

  it('returns workoutCompletionRate of null when there are no active workout plans', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 12 }))
      .mockReturnValueOnce(qb({ count: 3 }))
      .mockReturnValueOnce(qb({ count: 5 }))
      .mockReturnValueOnce(qb({ count: 8 }))
      .mockReturnValueOnce(qb({ count: 2 }))
      .mockReturnValueOnce(qb({ data: [] }))                  // no active plans
      .mockReturnValueOnce(qb({ data: activeClients }))
      .mockReturnValueOnce(qb({ data: recentCheckIns }));

    const result = await getStudioOverviewAnalytics(OWNER, STUDIO);

    expect(result.workoutCompletionRate).toBeNull();
    expect(from).toHaveBeenCalledTimes(9); // skips workout_days / workout_logs lookups
  });

  it('returns workoutCompletionRate of 0 when active plans have no workout days', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 12 }))
      .mockReturnValueOnce(qb({ count: 3 }))
      .mockReturnValueOnce(qb({ count: 5 }))
      .mockReturnValueOnce(qb({ count: 8 }))
      .mockReturnValueOnce(qb({ count: 2 }))
      .mockReturnValueOnce(qb({ data: activePlans }))
      .mockReturnValueOnce(qb({ data: [] }))                  // no workout days
      .mockReturnValueOnce(qb({ data: activeClients }))
      .mockReturnValueOnce(qb({ data: recentCheckIns }));

    const result = await getStudioOverviewAnalytics(OWNER, STUDIO);

    expect(result.workoutCompletionRate).toBe(0);
  });

  it('returns missedCheckIns of 0 when there are no active clients', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: [] }));

    const result = await getStudioOverviewAnalytics(OWNER, STUDIO);

    expect(result.missedCheckIns).toBe(0);
    expect(from).toHaveBeenCalledTimes(8); // skips check_ins lookup — no active clients to check
  });

  it('counts every active client without a check-in in the last 7 days as missed', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: activeClients }))
      .mockReturnValueOnce(qb({ data: [] }));               // nobody checked in recently

    const result = await getStudioOverviewAnalytics(OWNER, STUDIO);

    expect(result.missedCheckIns).toBe(3);
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(getStudioOverviewAnalytics('random-user', STUDIO)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this studio',
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('throws 403 when requester is a client member (not owner or trainer)', async () => {
    from.mockReturnValueOnce(qb({ data: { id: 'mem-c', role: 'client' } }));

    await expect(getStudioOverviewAnalytics('client-user', STUDIO)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only studio owners or trainers can view studio analytics',
    });
  });

  it('throws 500 when membership lookup fails', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioOverviewAnalytics(OWNER, STUDIO)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to check studio permissions',
    });
  });

  it('throws 500 when a count query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioOverviewAnalytics(OWNER, STUDIO)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to count active clients',
    });
  });

  it('throws 500 when the workout completion rate lookup fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioOverviewAnalytics(OWNER, STUDIO)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to calculate workout completion rate',
    });
  });

  it('throws 500 when the missed check-ins lookup fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ count: 0 }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioOverviewAnalytics(OWNER, STUDIO)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to count missed check-ins',
    });
  });
});
