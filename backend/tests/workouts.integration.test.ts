/// <reference types="jest" />

import request from 'supertest';
import app from '../src/app.js';

type SupabaseResponse = {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
  count?: number | null;
};

type MockSupabaseState = {
  authGetUser: jest.Mock;
  from: jest.Mock;
  responses: SupabaseResponse[];
};

jest.mock('../src/lib/supabase.js', () => {
  const authGetUser = jest.fn();
  const from = jest.fn();
  const responses: SupabaseResponse[] = [];

  const consumeResponse = () => {
    const nextResponse = responses.shift();

    if (!nextResponse) {
      throw new Error('Missing queued Supabase mock response');
    }

    return nextResponse;
  };

  type SupabaseChainMock = {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    neq: jest.Mock;
    or: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
    single: jest.Mock;
    then: (resolve: unknown, reject: unknown) => Promise<unknown>;
  };

  const createChain = (): SupabaseChainMock => {
    const chain: SupabaseChainMock = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => chain),
      update: jest.fn(() => chain),
      delete: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      neq: jest.fn(() => chain),
      or: jest.fn(() => chain),
      order: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      maybeSingle: jest.fn(async () => consumeResponse()),
      single: jest.fn(async () => consumeResponse()),
      then: (resolve: unknown, reject: unknown) =>
        Promise.resolve(consumeResponse()).then(resolve as never, reject as never),
    };

    return chain;
  };

  (globalThis as typeof globalThis & {
    __mockSupabaseState?: MockSupabaseState;
  }).__mockSupabaseState = {
    authGetUser,
    from,
    responses,
  };

  return {
    supabaseAdmin: {
      auth: {
        getUser: authGetUser,
      },
      from: from.mockImplementation(() => createChain()),
    },
  };
});

describe('Workout routes integration', () => {
  const studioId = '00000000-0000-0000-0000-000000000101';
  const planId = '00000000-0000-0000-0000-000000000102';
  const dayId = '00000000-0000-0000-0000-000000000103';
  const itemId = '00000000-0000-0000-0000-000000000104';
  const userId = '00000000-0000-0000-0000-000000000900';
  const clientId = '00000000-0000-0000-0000-000000000201';
  const exerciseId = '00000000-0000-0000-0000-000000000301';
  const token = 'valid-test-token';

  const authenticatedUser = {
    id: userId,
    email: 'owner@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const getMockSupabaseState = () =>
    (globalThis as typeof globalThis & {
      __mockSupabaseState: MockSupabaseState;
    }).__mockSupabaseState;

  beforeEach(() => {
    const mockSupabaseState = getMockSupabaseState();

    mockSupabaseState.responses.length = 0;
    mockSupabaseState.authGetUser.mockReset();
    mockSupabaseState.from.mockClear();

    mockSupabaseState.authGetUser.mockResolvedValue({
      data: { user: authenticatedUser },
      error: null,
    });
  });

  const enqueueResponses = (...responses: SupabaseResponse[]) => {
    getMockSupabaseState().responses.push(...responses);
  };

  it('GET /api/studios/:studioId/workout-plans returns plans for an authenticated user', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: [
          {
            id: planId,
            studio_id: studioId,
            client_id: clientId,
            trainer_id: userId,
            title: 'Upper Body Strength',
            description: 'Push-focused plan',
            start_date: '2026-06-01',
            end_date: '2026-06-28',
            status: 'active',
            created_at: '2026-06-01T00:00:00.000Z',
            updated_at: '2026-06-01T00:00:00.000Z',
            client: {
              id: clientId,
              full_name: 'Test Client',
              email: 'client@example.com',
              trainer_id: userId,
              status: 'active',
            },
            trainer: {
              id: userId,
              full_name: 'Test Trainer',
              email: 'owner@example.com',
              avatar_url: null,
            },
          },
        ],
        error: null,
      },
    );

    const response = await request(app)
      .get(`/api/studios/${studioId}/workout-plans`)
      .set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.plans).toHaveLength(1);
    expect(response.body.data.plans[0].id).toBe(planId);
  });

  it('POST /api/studios/:studioId/workout-plans creates a workout plan', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: clientId,
          studio_id: studioId,
          trainer_id: userId,
          full_name: 'Test Client',
        },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          title: 'Upper Body Strength',
          description: 'Push-focused plan',
          start_date: '2026-06-01',
          end_date: '2026-06-28',
          status: 'draft',
        },
        error: null,
      },
    );

    const response = await request(app)
      .post(`/api/studios/${studioId}/workout-plans`)
      .set(authHeaders)
      .send({
        clientId,
        title: 'Upper Body Strength',
        description: 'Push-focused plan',
        startDate: '2026-06-01',
        endDate: '2026-06-28',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutPlan.id).toBe(planId);
    expect(response.body.data.workoutPlan.client_id).toBe(clientId);
  });

  it('GET /api/studios/:studioId/workout-plans/:planId returns a workout plan', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          title: 'Upper Body Strength',
          description: 'Push-focused plan',
          start_date: '2026-06-01',
          end_date: '2026-06-28',
          status: 'active',
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
          client: {
            id: clientId,
            full_name: 'Test Client',
            email: 'client@example.com',
            trainer_id: userId,
            status: 'active',
            goal: 'Build muscle',
          },
          trainer: {
            id: userId,
            full_name: 'Test Trainer',
            email: 'owner@example.com',
            avatar_url: null,
          },
        },
        error: null,
      },
    );

    const response = await request(app)
      .get(`/api/studios/${studioId}/workout-plans/${planId}`)
      .set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutPlan.id).toBe(planId);
  });

  it('PATCH /api/studios/:studioId/workout-plans/:planId updates a workout plan', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          title: 'Updated Workout Plan',
          description: 'Push-focused plan',
          start_date: '2026-06-01',
          end_date: '2026-06-28',
          status: 'active',
        },
        error: null,
      },
    );

    const response = await request(app)
      .patch(`/api/studios/${studioId}/workout-plans/${planId}`)
      .set(authHeaders)
      .send({
        title: 'Updated Workout Plan',
        status: 'active',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutPlan.title).toBe('Updated Workout Plan');
  });

  it('DELETE /api/studios/:studioId/workout-plans/:planId archives a workout plan', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: { id: planId },
        error: null,
      },
    );

    const response = await request(app)
      .delete(`/api/studios/${studioId}/workout-plans/${planId}`)
      .set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);
    expect(response.body.data.planId).toBe(planId);
  });

  it('POST /api/studios/:studioId/workout-plans/:planId/days creates a workout day', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        count: 1,
        data: null,
        error: null,
      },
      {
        data: null,
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
          notes: 'Chest, shoulders, triceps',
        },
        error: null,
      },
    );

    const response = await request(app)
      .post(`/api/studios/${studioId}/workout-plans/${planId}/days`)
      .set(authHeaders)
      .send({
        dayNumber: 1,
        title: 'Push Day',
        notes: 'Chest, shoulders, triceps',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutDay.id).toBe(dayId);
  });

  it('PATCH /api/studios/:studioId/workout-plans/:planId/days/:dayId updates a workout day', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
        },
        error: null,
      },
      {
        data: null,
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 2,
          title: 'Updated Push Day',
          notes: 'Updated notes',
        },
        error: null,
      },
    );

    const response = await request(app)
      .patch(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}`)
      .set(authHeaders)
      .send({
        dayNumber: 2,
        title: 'Updated Push Day',
        notes: 'Updated notes',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutDay.day_number).toBe(2);
  });

  it('DELETE /api/studios/:studioId/workout-plans/:planId/days/:dayId deletes a workout day', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
        },
        error: null,
      },
      {
        data: undefined,
        error: null,
      },
    );

    const response = await request(app)
      .delete(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}`)
      .set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);
    expect(response.body.data.dayId).toBe(dayId);
  });

  it('POST /api/studios/:studioId/workout-plans/:planId/days/:dayId/items creates a workout item', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
        },
        error: null,
      },
      {
        data: {
          id: exerciseId,
          name: 'Bench Press',
        },
        error: null,
      },
      {
        data: {
          id: itemId,
          workout_day_id: dayId,
          exercise_id: exerciseId,
          sets: 4,
          reps: '8-10',
          target_weight: '100kg',
          rest_seconds: 90,
          notes: 'Top set first',
          exercise: {
            id: exerciseId,
            name: 'Bench Press',
            muscle_group: 'chest',
            equipment: 'barbell',
            difficulty: 'intermediate',
          },
        },
        error: null,
      },
    );

    const response = await request(app)
      .post(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}/items`)
      .set(authHeaders)
      .send({
        exerciseId,
        sets: 4,
        reps: '8-10',
        targetWeight: '100kg',
        restSeconds: 90,
        notes: 'Top set first',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutItem.id).toBe(itemId);
  });

  it('PATCH /api/studios/:studioId/workout-plans/:planId/days/:dayId/items/:itemId updates a workout item', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
        },
        error: null,
      },
      {
        data: {
          id: itemId,
          workout_day_id: dayId,
        },
        error: null,
      },
      {
        data: {
          id: itemId,
          workout_day_id: dayId,
          exercise_id: exerciseId,
          sets: 5,
          reps: '6-8',
          target_weight: '110kg',
          rest_seconds: 120,
          notes: 'Updated item',
          exercise: {
            id: exerciseId,
            name: 'Bench Press',
            muscle_group: 'chest',
            equipment: 'barbell',
            difficulty: 'intermediate',
          },
        },
        error: null,
      },
    );

    const response = await request(app)
      .patch(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}/items/${itemId}`)
      .set(authHeaders)
      .send({
        sets: 5,
        reps: '6-8',
        targetWeight: '110kg',
        restSeconds: 120,
        notes: 'Updated item',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workoutItem.id).toBe(itemId);
    expect(response.body.data.workoutItem.sets).toBe(5);
  });

  it('DELETE /api/studios/:studioId/workout-plans/:planId/days/:dayId/items/:itemId deletes a workout item', async () => {
    enqueueResponses(
      {
        data: { id: 'membership-1', role: 'owner' },
        error: null,
      },
      {
        data: {
          id: planId,
          studio_id: studioId,
          client_id: clientId,
          trainer_id: userId,
          status: 'draft',
          client: { id: clientId, trainer_id: userId },
        },
        error: null,
      },
      {
        data: {
          id: dayId,
          workout_plan_id: planId,
          day_number: 1,
          title: 'Push Day',
        },
        error: null,
      },
      {
        data: undefined,
        error: null,
      },
    );

    const response = await request(app)
      .delete(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}/items/${itemId}`)
      .set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);
    expect(response.body.data.itemId).toBe(itemId);
  });
});
