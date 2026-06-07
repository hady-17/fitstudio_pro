jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import {
  createCheckIn,
  listCheckIns,
  createMeasurement,
  listMeasurements,
  getClientProgressTrend,
} from '../../src/modules/checkins/checkins.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const OWNER   = 'owner-0000-0000-0000-000000000001';
const TRAINER = 'trainer-00-0000-0000-000000000002';
const TRAINER2= 'trainer-00-0000-0000-000000000099';
const CLIENT  = 'client-000-0000-0000-000000000003';
const STUDIO  = 'studio-000-0000-0000-000000000004';
const CHECKIN = 'checkin-0-0000-0000-000000000005';
const MEASUREMENT = 'measure-0-0000-0000-000000000006';

const trainerStudioMembership = { id: 'mem-t', role: 'trainer' };
const ownerStudioMembership = { id: 'mem-o', role: 'owner' };

const mockClient = {
  id: CLIENT,
  studio_id: STUDIO,
  user_id: null,
  trainer_id: TRAINER,
};

const mockCheckIn = {
  id: CHECKIN,
  client_id: CLIENT,
  weight: 80.5,
  mood: 7,
  energy_level: 6,
  sleep_hours: 7.5,
  notes: 'Feeling good',
  created_at: '2026-06-01T10:00:00Z',
};

const mockMeasurement = {
  id: MEASUREMENT,
  client_id: CLIENT,
  weight: 80.5,
  waist: 85,
  chest: 100,
  arms: 35,
  legs: 55,
  created_at: '2026-06-01T10:00:00Z',
};

beforeEach(() => {
  from.mockReset();
});

// ── createCheckIn ─────────────────────────────────────────────────────────────
describe('createCheckIn', () => {
  const input = { weight: 80.5, mood: 7, energyLevel: 6, sleepHours: 7.5, notes: 'Feeling good' };

  it('trainer creates a check-in for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: mockCheckIn }));

    const result = await createCheckIn(TRAINER, CLIENT, input);

    expect(result).toEqual(mockCheckIn);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('client creates their own check-in (skips membership check)', async () => {
    const clientUser = { ...mockClient, user_id: 'auth-user-id' };
    from
      .mockReturnValueOnce(qb({ data: clientUser }))
      .mockReturnValueOnce(qb({ data: mockCheckIn }));

    const result = await createCheckIn('auth-user-id', CLIENT, input);

    expect(result).toEqual(mockCheckIn);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('studio owner creates a check-in for any client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: ownerStudioMembership }))
      .mockReturnValueOnce(qb({ data: mockCheckIn }));

    const result = await createCheckIn(OWNER, CLIENT, input);

    expect(result).toEqual(mockCheckIn);
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(createCheckIn(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Client not found',
    });
  });

  it('throws 403 when requester is not a studio staff member', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(createCheckIn('random-user', CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this client',
    });
  });

  it('throws 403 when trainer accesses a client not assigned to them', async () => {
    const unassignedClient = { ...mockClient, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: unassignedClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }));

    await expect(createCheckIn(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers can only access progress data for assigned clients',
    });
  });

  it('throws 500 when insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(createCheckIn(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to create check-in',
    });
  });
});

// ── listCheckIns ──────────────────────────────────────────────────────────────
describe('listCheckIns', () => {
  const checkIns = [mockCheckIn, { ...mockCheckIn, id: 'checkin-2', created_at: '2026-06-08T10:00:00Z' }];

  it('trainer lists check-ins for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: checkIns }));

    const result = await listCheckIns(TRAINER, CLIENT);

    expect(result).toEqual(checkIns);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('client lists their own check-ins (no membership check)', async () => {
    const clientUser = { ...mockClient, user_id: 'auth-user-id' };
    from
      .mockReturnValueOnce(qb({ data: clientUser }))
      .mockReturnValueOnce(qb({ data: checkIns }));

    const result = await listCheckIns('auth-user-id', CLIENT);

    expect(result).toEqual(checkIns);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when no check-ins exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    const result = await listCheckIns(TRAINER, CLIENT);

    expect(result).toEqual([]);
  });

  it('applies pagination via limit and offset', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: checkIns }));

    const result = await listCheckIns(TRAINER, CLIENT, { limit: 10, offset: 0 });

    expect(result).toEqual(checkIns);
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(listCheckIns(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 500 on DB error fetching check-ins', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listCheckIns(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── createMeasurement ─────────────────────────────────────────────────────────
describe('createMeasurement', () => {
  const input = { weight: 80.5, waist: 85, chest: 100, arms: 35, legs: 55 };

  it('trainer creates a measurement for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: mockMeasurement }));

    const result = await createMeasurement(TRAINER, CLIENT, input);

    expect(result).toEqual(mockMeasurement);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('client creates their own measurement (skips membership check)', async () => {
    const clientUser = { ...mockClient, user_id: 'auth-user-id' };
    from
      .mockReturnValueOnce(qb({ data: clientUser }))
      .mockReturnValueOnce(qb({ data: mockMeasurement }));

    const result = await createMeasurement('auth-user-id', CLIENT, input);

    expect(result).toEqual(mockMeasurement);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(createMeasurement(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when trainer accesses a client not assigned to them', async () => {
    const unassignedClient = { ...mockClient, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: unassignedClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }));

    await expect(createMeasurement(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers can only access progress data for assigned clients',
    });
  });

  it('throws 500 when insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(createMeasurement(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to create measurement',
    });
  });
});

// ── listMeasurements ──────────────────────────────────────────────────────────
describe('listMeasurements', () => {
  const measurements = [mockMeasurement, { ...mockMeasurement, id: 'measure-2', created_at: '2026-06-08T10:00:00Z' }];

  it('trainer lists measurements for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: measurements }));

    const result = await listMeasurements(TRAINER, CLIENT);

    expect(result).toEqual(measurements);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('returns empty array when no measurements exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    const result = await listMeasurements(TRAINER, CLIENT);

    expect(result).toEqual([]);
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(listMeasurements(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 500 on DB error fetching measurements', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listMeasurements(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── getClientProgressTrend ────────────────────────────────────────────────────
describe('getClientProgressTrend', () => {
  it('computes weight trend deltas from latest two check-ins and measurements', async () => {
    const checkInRows = [
      { weight: 79, created_at: '2026-06-08T10:00:00Z' },
      { weight: 80.5, created_at: '2026-06-01T10:00:00Z' },
    ];
    const measurementRows = [
      { weight: 79, created_at: '2026-06-08T10:00:00Z' },
      { weight: 80.5, created_at: '2026-06-01T10:00:00Z' },
    ];

    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: checkInRows }))
      .mockReturnValueOnce(qb({ data: measurementRows }));

    const result = await getClientProgressTrend(TRAINER, CLIENT);

    expect(result.checkInWeight).toEqual({
      latest: { weight: 79, recordedAt: '2026-06-08T10:00:00Z' },
      previous: { weight: 80.5, recordedAt: '2026-06-01T10:00:00Z' },
      change: -1.5,
      direction: 'down',
    });
    expect(result.measurementWeight.direction).toBe('down');
  });

  it('returns null trend fields when fewer than two weight entries exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: [{ weight: 80, created_at: '2026-06-08T10:00:00Z' }] }))
      .mockReturnValueOnce(qb({ data: [] }));

    const result = await getClientProgressTrend(TRAINER, CLIENT);

    expect(result.checkInWeight).toEqual({
      latest: { weight: 80, recordedAt: '2026-06-08T10:00:00Z' },
      previous: null,
      change: null,
      direction: null,
    });
    expect(result.measurementWeight).toEqual({
      latest: null,
      previous: null,
      change: null,
      direction: null,
    });
  });

  it('ignores entries with null weight when computing trend', async () => {
    const rows = [
      { weight: null, created_at: '2026-06-08T10:00:00Z' },
      { weight: 80, created_at: '2026-06-01T10:00:00Z' },
      { weight: 82, created_at: '2026-05-25T10:00:00Z' },
    ];

    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: rows }))
      .mockReturnValueOnce(qb({ data: [] }));

    const result = await getClientProgressTrend(TRAINER, CLIENT);

    expect(result.checkInWeight).toEqual({
      latest: { weight: 80, recordedAt: '2026-06-01T10:00:00Z' },
      previous: { weight: 82, recordedAt: '2026-05-25T10:00:00Z' },
      change: -2,
      direction: 'down',
    });
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(getClientProgressTrend(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 500 when trend queries fail', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }))
      .mockReturnValueOnce(qb({ data: [] }));

    await expect(getClientProgressTrend(TRAINER, CLIENT)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to calculate progress trend',
    });
  });
});
