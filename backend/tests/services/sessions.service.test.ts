jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import {
  createSession,
  listSessions,
  updateSessionStatus,
} from '../../src/modules/sessions/sessions.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────
const OWNER    = 'owner-000-0000-0000-000000000001';
const TRAINER  = 'trainer-0-0000-0000-000000000002';
const TRAINER2 = 'trainer-0-0000-0000-000000000099';
const CLIENT   = 'client-00-0000-0000-000000000003';
const STUDIO   = 'studio-00-0000-0000-000000000004';
const SESSION  = 'session-0-0000-0000-000000000005';

const FUTURE_START = new Date(Date.now() + 86_400_000).toISOString();
const FUTURE_END   = new Date(Date.now() + 90_000_000).toISOString();
const PAST_START   = new Date(Date.now() - 7_200_000).toISOString();

const ownerMembership   = { id: 'mem-1', role: 'owner' };
const trainerMembership = { id: 'mem-2', role: 'trainer' };
const trainerInStudio   = { id: 'mem-3', role: 'trainer' };
const clientInStudio    = { id: CLIENT, studio_id: STUDIO, full_name: 'Alice', user_id: 'client-user-0000-0000-000000000006' };

const mockSession = {
  id: SESSION,
  studio_id: STUDIO,
  trainer_id: TRAINER,
  client_id: CLIENT,
  start_time: FUTURE_START,
  end_time: FUTURE_END,
  status: 'scheduled',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  trainer: { id: TRAINER, full_name: 'Bob', email: 'bob@test.com', avatar_url: null },
  client:  { id: CLIENT,  full_name: 'Alice', email: 'alice@test.com' },
};

const scheduledSessionRow = {
  id: SESSION,
  studio_id: STUDIO,
  trainer_id: TRAINER,
  status: 'scheduled',
};

beforeEach(() => from.mockReset());

// ── createSession ─────────────────────────────────────────────────────────────
describe('createSession', () => {
  const input = {
    trainerId: TRAINER,
    clientId: CLIENT,
    startTime: FUTURE_START,
    endTime: FUTURE_END,
  };

  // call order: membership → client → trainer → trainerConflict → clientConflict → insert → reminder jobs insert
  function setupSuccess(membershipData = ownerMembership) {
    from
      .mockReturnValueOnce(qb({ data: membershipData }))   // requester membership
      .mockReturnValueOnce(qb({ data: clientInStudio }))   // client in studio
      .mockReturnValueOnce(qb({ data: trainerInStudio }))  // trainer in studio
      .mockReturnValueOnce(qb({ data: [] }))               // trainer conflict (none)
      .mockReturnValueOnce(qb({ data: [] }))               // client conflict (none)
      .mockReturnValueOnce(qb({ data: mockSession }))      // insert
      .mockReturnValueOnce(qb({ data: null }));            // reminder jobs insert
  }

  it('owner books a session successfully', async () => {
    setupSuccess();
    const result = await createSession(OWNER, STUDIO, input);
    expect(result).toEqual(mockSession);
    expect(from).toHaveBeenCalledTimes(7);
  });

  it('trainer books a session successfully', async () => {
    setupSuccess(trainerMembership);
    const result = await createSession(TRAINER, STUDIO, input);
    expect(result).toEqual(mockSession);
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this studio',
    });
  });

  it('throws 404 when client does not belong to the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Client not found in this studio',
    });
  });

  it('throws 404 when trainer is not a studio member', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: null }));
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Trainer not found in this studio',
    });
  });

  it('throws 400 when start time is in the past', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: trainerInStudio }));
    await expect(
      createSession(OWNER, STUDIO, { ...input, startTime: PAST_START }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cannot schedule a session in the past',
    });
  });

  it('throws 409 when trainer has an overlapping session', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: trainerInStudio }))
      .mockReturnValueOnce(qb({ data: [{ id: 'conflict-session' }] })); // trainer conflict
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Trainer already has a session scheduled during this time',
    });
  });

  it('throws 409 when client has an overlapping session', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: trainerInStudio }))
      .mockReturnValueOnce(qb({ data: [] }))                            // trainer: no conflict
      .mockReturnValueOnce(qb({ data: [{ id: 'conflict-session' }] })); // client conflict
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Client already has a session scheduled during this time',
    });
  });

  it('throws 500 when insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: trainerInStudio }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));
    await expect(createSession(OWNER, STUDIO, input)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── listSessions ──────────────────────────────────────────────────────────────
describe('listSessions', () => {
  it('owner retrieves all sessions in the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [mockSession] }));
    const result = await listSessions(OWNER, STUDIO);
    expect(result).toEqual([mockSession]);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('trainer retrieves only their own sessions', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: [mockSession] }));
    const result = await listSessions(TRAINER, STUDIO);
    expect(result).toEqual([mockSession]);
  });

  it('returns empty array when no sessions exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));
    const result = await listSessions(OWNER, STUDIO);
    expect(result).toEqual([]);
  });

  it('applies pagination via limit and offset', async () => {
    const sessions = [mockSession, { ...mockSession, id: 'session-2' }, { ...mockSession, id: 'session-3' }];
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: sessions }));
    const result = await listSessions(OWNER, STUDIO, { limit: 2, offset: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('session-2');
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));
    await expect(listSessions(OWNER, STUDIO)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 500 when query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));
    await expect(listSessions(OWNER, STUDIO)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── updateSessionStatus ───────────────────────────────────────────────────────
describe('updateSessionStatus', () => {
  const input = { status: 'completed' as const };

  // call order: fetch session → membership → update
  function setupSuccess(membershipData = ownerMembership, sessionRow = scheduledSessionRow) {
    from
      .mockReturnValueOnce(qb({ data: sessionRow }))       // fetch session
      .mockReturnValueOnce(qb({ data: membershipData }))   // membership check
      .mockReturnValueOnce(qb({ data: mockSession }));     // update
  }

  it('owner marks a session as completed', async () => {
    setupSuccess();
    const result = await updateSessionStatus(OWNER, SESSION, input);
    expect(result).toEqual(mockSession);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('trainer updates their own session to cancelled', async () => {
    setupSuccess(trainerMembership);
    const result = await updateSessionStatus(TRAINER, SESSION, { status: 'cancelled' });
    expect(result).toEqual(mockSession);
  });

  it('trainer marks session as no_show', async () => {
    setupSuccess(trainerMembership);
    const result = await updateSessionStatus(TRAINER, SESSION, { status: 'no_show' });
    expect(result).toEqual(mockSession);
  });

  it('throws 403 when trainer tries to update another trainer\'s session', async () => {
    const otherTrainerSession = { ...scheduledSessionRow, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: otherTrainerSession }))
      .mockReturnValueOnce(qb({ data: trainerMembership }));
    await expect(updateSessionStatus(TRAINER, SESSION, input)).rejects.toMatchObject({
      statusCode: 403,
      message: "Trainers can only update their own sessions",
    });
  });

  it('throws 400 when session is already completed', async () => {
    const completedSession = { ...scheduledSessionRow, status: 'completed' };
    from
      .mockReturnValueOnce(qb({ data: completedSession }))
      .mockReturnValueOnce(qb({ data: ownerMembership }));
    await expect(updateSessionStatus(OWNER, SESSION, input)).rejects.toMatchObject({
      statusCode: 400,
      message: "Cannot update a session with status 'completed'",
    });
  });

  it('throws 400 when session is already cancelled', async () => {
    const cancelledSession = { ...scheduledSessionRow, status: 'cancelled' };
    from
      .mockReturnValueOnce(qb({ data: cancelledSession }))
      .mockReturnValueOnce(qb({ data: ownerMembership }));
    await expect(updateSessionStatus(OWNER, SESSION, input)).rejects.toMatchObject({
      statusCode: 400,
      message: "Cannot update a session with status 'cancelled'",
    });
  });

  it('throws 404 when session does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));
    await expect(updateSessionStatus(OWNER, SESSION, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Session not found',
    });
  });

  it('throws 403 when requester is not a studio member', async () => {
    from
      .mockReturnValueOnce(qb({ data: scheduledSessionRow }))
      .mockReturnValueOnce(qb({ data: null }));
    await expect(updateSessionStatus(OWNER, SESSION, input)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 500 when update fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: scheduledSessionRow }))
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));
    await expect(updateSessionStatus(OWNER, SESSION, input)).rejects.toMatchObject({ statusCode: 500 });
  });
});
