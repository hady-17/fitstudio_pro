jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import {
  createWorkoutPlan,
  getWorkoutPlanById,
  createWorkoutDay,
  createWorkoutItem,
  listWorkoutPlans,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  updateWorkoutDay,
  deleteWorkoutDay,
  updateWorkoutItem,
  deleteWorkoutItem,
  createWorkoutLog,
  listWorkoutLogs,
} from '../../src/modules/workout/workouts.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const OWNER   = 'owner-0000-0000-0000-000000000001';
const TRAINER = 'trainer-00-0000-0000-000000000002';
const TRAINER2= 'trainer-00-0000-0000-000000000099';
const CLIENT  = 'client-000-0000-0000-000000000003';
const STUDIO  = 'studio-000-0000-0000-000000000004';
const PLAN    = 'plan-0000-0000-0000-000000000005';
const DAY     = 'day-00000-0000-0000-000000000006';
const ITEM    = 'item-0000-0000-0000-000000000007';
const EXERCISE= 'exercise-0-0000-0000-000000000008';
const LOG     = 'log-00000-0000-0000-000000000009';

const ownerMembership   = { id: 'mem-1', role: 'owner' };
const trainerMembership = { id: 'mem-2', role: 'trainer' };

// A workout plan shaped as returned by getWorkoutPlanForWriteOrThrow
const planWriteShape = {
  id: PLAN,
  studio_id: STUDIO,
  client_id: CLIENT,
  trainer_id: TRAINER,
  status: 'draft',
  client: { id: CLIENT, trainer_id: TRAINER },
};

const mockPlan = {
  id: PLAN,
  studio_id: STUDIO,
  client_id: CLIENT,
  trainer_id: TRAINER,
  title: 'Strength Plan',
  description: null,
  start_date: null,
  end_date: null,
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockDay = {
  id: DAY,
  workout_plan_id: PLAN,
  day_number: 1,
  title: 'Push Day',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockItem = {
  id: ITEM,
  workout_day_id: DAY,
  exercise_id: EXERCISE,
  sets: 3,
  reps: '10',
  target_weight: null,
  rest_seconds: 60,
  notes: null,
  exercise: { id: EXERCISE, name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'intermediate' },
};

const mockClient = {
  id: CLIENT,
  studio_id: STUDIO,
  user_id: null,
  trainer_id: TRAINER,
};

const mockLog = {
  id: LOG,
  client_id: CLIENT,
  workout_day_id: DAY,
  completed_at: '2026-01-01T10:00:00Z',
  difficulty_rating: 7,
  feedback: 'Felt strong',
  workout_day: { id: DAY, day_number: 1, title: 'Push Day' },
};

// ─ Helpers: sets up the 2 calls inside getWorkoutPlanForWriteOrThrow ─────────
// call #1: staff membership, call #2: plan lookup
function setupPlanWriteAccess(
  membershipData: { id: string; role: string } = ownerMembership,
  planData: typeof planWriteShape = planWriteShape,
) {
  from
    .mockReturnValueOnce(qb({ data: membershipData }))  // getStudioStaffMembershipOrThrow
    .mockReturnValueOnce(qb({ data: planData }));        // plan lookup
}

// ── createWorkoutPlan ─────────────────────────────────────────────────────────
describe('createWorkoutPlan', () => {
  const input = { clientId: CLIENT, title: 'Strength Plan' };
  const clientInStudio = { id: CLIENT, studio_id: STUDIO, trainer_id: TRAINER, full_name: 'Alice' };

  it('owner creates a workout plan for any client', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))   // staff check
      .mockReturnValueOnce(qb({ data: clientInStudio }))    // getClientInStudioOrThrow
      .mockReturnValueOnce(qb({ data: mockPlan }));          // insert

    const result = await createWorkoutPlan(OWNER, STUDIO, input);

    expect(result).toEqual(mockPlan);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('trainer creates a plan for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: { ...clientInStudio, trainer_id: TRAINER } }))
      .mockReturnValueOnce(qb({ data: mockPlan }));

    const result = await createWorkoutPlan(TRAINER, STUDIO, input);

    expect(result).toEqual(mockPlan);
  });

  it('throws 403 when trainer creates a plan for a client assigned to someone else', async () => {
    const otherTrainersClient = { ...clientInStudio, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherTrainersClient }));

    await expect(createWorkoutPlan(TRAINER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers can only create workout plans for assigned clients',
    });
  });

  it('throws 404 when client does not belong to the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null })); // client not found in studio

    await expect(createWorkoutPlan(OWNER, STUDIO, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Client not found in this studio',
    });
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(createWorkoutPlan(OWNER, STUDIO, input)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 500 when insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: clientInStudio }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(createWorkoutPlan(OWNER, STUDIO, input)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── getWorkoutPlanById ────────────────────────────────────────────────────────
describe('getWorkoutPlanById', () => {
  const fullPlan = {
    ...mockPlan,
    client: { id: CLIENT, full_name: 'Alice', email: null, trainer_id: TRAINER, status: 'active', goal: null },
    trainer: { id: TRAINER, full_name: 'Bob', email: null, avatar_url: null },
  };

  it('owner retrieves any plan', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: fullPlan }));

    const result = await getWorkoutPlanById(OWNER, STUDIO, PLAN);

    expect(result).toEqual(fullPlan);
  });

  it('trainer retrieves a plan for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: fullPlan })); // client.trainer_id === TRAINER

    const result = await getWorkoutPlanById(TRAINER, STUDIO, PLAN);

    expect(result).toEqual(fullPlan);
  });

  it('throws 403 when trainer accesses a plan for an unassigned client', async () => {
    const otherTrainersPlan = {
      ...fullPlan,
      trainer_id: TRAINER2,
      client: { ...fullPlan.client, trainer_id: TRAINER2 },
    };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherTrainersPlan }));

    await expect(getWorkoutPlanById(TRAINER, STUDIO, PLAN)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only view workout plans for assigned clients',
    });
  });

  it('throws 404 when plan does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(getWorkoutPlanById(OWNER, STUDIO, PLAN)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── createWorkoutDay ──────────────────────────────────────────────────────────
describe('createWorkoutDay', () => {
  const input = { dayNumber: 1, title: 'Push Day' };

  it('creates a workout day in a plan with fewer than 7 days', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ count: 3 }))        // day count
      .mockReturnValueOnce(qb({ data: null }))       // no conflict for day_number
      .mockReturnValueOnce(qb({ data: mockDay }));   // insert

    const result = await createWorkoutDay(OWNER, STUDIO, PLAN, input);

    expect(result).toEqual(mockDay);
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('creates day 7 (the maximum allowed)', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ count: 6 }))       // 6 days exist, can add one more
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: { ...mockDay, day_number: 7 } }));

    const result = await createWorkoutDay(OWNER, STUDIO, PLAN, { dayNumber: 7, title: 'Rest Day' });

    expect(result.day_number).toBe(7);
  });

  it('throws 400 when plan already has 7 days', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ count: 7 })); // already at max

    await expect(createWorkoutDay(OWNER, STUDIO, PLAN, input)).rejects.toMatchObject({
      statusCode: 400,
      message: 'A workout plan can have a maximum of 7 days',
    });
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('throws 409 when the day number already exists in the plan', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ count: 2 }))
      .mockReturnValueOnce(qb({ data: { id: 'existing-day' } })); // conflict

    await expect(createWorkoutDay(OWNER, STUDIO, PLAN, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'A workout day with this dayNumber already exists in this plan',
    });
  });

  it('throws 403 when trainer accesses a plan they did not create for an unassigned client', async () => {
    // Both trainer_id and client.trainer_id must differ from requester to trigger 403
    const otherTrainersPlan = {
      ...planWriteShape,
      trainer_id: TRAINER2,
      client: { ...planWriteShape.client, trainer_id: TRAINER2 },
    };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherTrainersPlan }));

    await expect(createWorkoutDay(TRAINER, STUDIO, PLAN, input)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

// ── createWorkoutItem ─────────────────────────────────────────────────────────
describe('createWorkoutItem', () => {
  const input = { exerciseId: EXERCISE, sets: 3, reps: '10' };
  const dayInPlan = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };

  it('creates a workout item in a plan day', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))   // getWorkoutDayInPlanOrThrow
      .mockReturnValueOnce(qb({ data: { id: EXERCISE, name: 'Bench Press' } })) // getExerciseOrThrow
      .mockReturnValueOnce(qb({ data: mockItem }));   // insert

    const result = await createWorkoutItem(OWNER, STUDIO, PLAN, DAY, input);

    expect(result).toEqual(mockItem);
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('throws 404 when the workout day is not in this plan', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: null })); // day not found

    await expect(createWorkoutItem(OWNER, STUDIO, PLAN, DAY, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Workout day not found in this plan',
    });
  });

  it('throws 404 when the exercise does not exist', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: null })); // exercise not found

    await expect(createWorkoutItem(OWNER, STUDIO, PLAN, DAY, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Exercise not found',
    });
  });

  it('throws 500 when item insert fails', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: { id: EXERCISE } }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(createWorkoutItem(OWNER, STUDIO, PLAN, DAY, input)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── listWorkoutPlans ──────────────────────────────────────────────────────────
describe('listWorkoutPlans', () => {
  const plan2 = { ...mockPlan, id: 'plan-2', trainer_id: TRAINER2, client: { trainer_id: TRAINER2 } };
  const allPlans = [
    { ...mockPlan, trainer_id: TRAINER, client: { trainer_id: TRAINER } },
    plan2,
  ];

  it('owner sees all plans', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: allPlans }));

    const result = await listWorkoutPlans(OWNER, STUDIO);

    expect(result).toHaveLength(2);
  });

  it('trainer sees only plans for their clients', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: allPlans })); // DB returns all, filtered in-memory

    const result = await listWorkoutPlans(TRAINER, STUDIO);

    // Should filter to only plans where trainer_id === TRAINER or client.trainer_id === TRAINER
    expect(result).toHaveLength(1);
    expect(result[0].trainer_id).toBe(TRAINER);
  });

  it('applies pagination via limit and offset', async () => {
    const manyPlans = Array.from({ length: 10 }, (_, i) => ({
      ...mockPlan,
      id: `plan-${i}`,
      trainer_id: OWNER,
      client: { trainer_id: OWNER },
    }));
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: manyPlans }));

    const result = await listWorkoutPlans(OWNER, STUDIO, { limit: 3, offset: 2 });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('plan-2');
  });

  it('returns empty array when no plans match', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [] }));

    const result = await listWorkoutPlans(OWNER, STUDIO);

    expect(result).toEqual([]);
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(listWorkoutPlans(OWNER, STUDIO)).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ── updateWorkoutPlan ─────────────────────────────────────────────────────────
describe('updateWorkoutPlan', () => {
  const updatedPlan = { ...mockPlan, title: 'New Title' };

  it('updates a workout plan', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: updatedPlan }));

    const result = await updateWorkoutPlan(OWNER, STUDIO, PLAN, { title: 'New Title' });

    expect(result).toEqual(updatedPlan);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('throws 404 when plan does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(updateWorkoutPlan(OWNER, STUDIO, PLAN, { title: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 500 when update query fails', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(updateWorkoutPlan(OWNER, STUDIO, PLAN, { title: 'x' })).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── deleteWorkoutPlan ─────────────────────────────────────────────────────────
describe('deleteWorkoutPlan', () => {
  it('soft-archives a workout plan (sets status to archived)', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: { id: PLAN } })); // soft-archive update

    const result = await deleteWorkoutPlan(OWNER, STUDIO, PLAN);

    expect(result).toEqual({ deleted: true, planId: PLAN });
  });

  it('throws 403 when trainer tries to delete a plan they did not create for an unassigned client', async () => {
    const otherPlan = {
      ...planWriteShape,
      trainer_id: TRAINER2,
      client: { trainer_id: TRAINER2 },
    };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherPlan }));

    await expect(deleteWorkoutPlan(TRAINER, STUDIO, PLAN)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 500 when archive update fails', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(deleteWorkoutPlan(OWNER, STUDIO, PLAN)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── updateWorkoutDay ──────────────────────────────────────────────────────────
describe('updateWorkoutDay', () => {
  const dayInPlan = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };
  const updatedDay = { ...mockDay, title: 'Heavy Push Day' };

  it('updates a workout day title without changing day number', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))    // getWorkoutDayInPlanOrThrow
      .mockReturnValueOnce(qb({ data: updatedDay }));  // update

    const result = await updateWorkoutDay(OWNER, STUDIO, PLAN, DAY, { title: 'Heavy Push Day' });

    expect(result).toEqual(updatedDay);
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('updates day number after checking for conflicts', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: null }))          // no day_number conflict
      .mockReturnValueOnce(qb({ data: { ...mockDay, day_number: 2 } }));

    const result = await updateWorkoutDay(OWNER, STUDIO, PLAN, DAY, { dayNumber: 2 });

    expect(result.day_number).toBe(2);
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('throws 409 when another day already has the target day number', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: { id: 'another-day' } })); // conflict

    await expect(
      updateWorkoutDay(OWNER, STUDIO, PLAN, DAY, { dayNumber: 3 }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'A workout day with this dayNumber already exists in this plan',
    });
  });

  it('throws 404 when workout day is not in this plan', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: null })); // day not found

    await expect(
      updateWorkoutDay(OWNER, STUDIO, PLAN, DAY, { title: 'x' }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Workout day not found in this plan',
    });
  });
});

// ── deleteWorkoutDay ──────────────────────────────────────────────────────────
describe('deleteWorkoutDay', () => {
  const dayInPlan = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };

  it('deletes a workout day', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: null })); // delete

    const result = await deleteWorkoutDay(OWNER, STUDIO, PLAN, DAY);

    expect(result).toEqual({ deleted: true, dayId: DAY });
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('throws 404 when workout day does not exist in plan', async () => {
    setupPlanWriteAccess();
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(deleteWorkoutDay(OWNER, STUDIO, PLAN, DAY)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 500 when delete query fails', async () => {
    const dayInPlan2 = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan2 }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(deleteWorkoutDay(OWNER, STUDIO, PLAN, DAY)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── updateWorkoutItem ─────────────────────────────────────────────────────────
describe('updateWorkoutItem', () => {
  const dayInPlan = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };
  const existingItem = { id: ITEM, workout_day_id: DAY };

  it('updates a workout item', async () => {
    const updated = { ...mockItem, sets: 4 };
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: existingItem }))  // find item
      .mockReturnValueOnce(qb({ data: updated }));       // update

    const result = await updateWorkoutItem(OWNER, STUDIO, PLAN, DAY, ITEM, { sets: 4 });

    expect(result).toEqual(updated);
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('throws 404 when item does not exist', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: null })); // item not found

    await expect(
      updateWorkoutItem(OWNER, STUDIO, PLAN, DAY, ITEM, { sets: 4 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Workout item not found in this day',
    });
  });

  it('throws 404 when item belongs to a different day', async () => {
    const wrongDayItem = { id: ITEM, workout_day_id: 'other-day' };
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: wrongDayItem })); // item.workout_day_id !== DAY

    await expect(
      updateWorkoutItem(OWNER, STUDIO, PLAN, DAY, ITEM, { sets: 4 }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ── deleteWorkoutItem ─────────────────────────────────────────────────────────
describe('deleteWorkoutItem', () => {
  const dayInPlan = { id: DAY, workout_plan_id: PLAN, day_number: 1, title: 'Push Day' };

  it('deletes a workout item', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ data: null })); // delete

    const result = await deleteWorkoutItem(OWNER, STUDIO, PLAN, DAY, ITEM);

    expect(result).toEqual({ deleted: true, itemId: ITEM });
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('throws 500 when delete query fails', async () => {
    setupPlanWriteAccess();
    from
      .mockReturnValueOnce(qb({ data: dayInPlan }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(deleteWorkoutItem(OWNER, STUDIO, PLAN, DAY, ITEM)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── createWorkoutLog ──────────────────────────────────────────────────────────
describe('createWorkoutLog', () => {
  const input = { workoutDayId: DAY };
  const workoutDayWithPlan = {
    id: DAY,
    workout_plan_id: PLAN,
    workout_plan: { id: PLAN, client_id: CLIENT }, // object form (not array)
  };
  const trainerStudioMembership = { id: 'mem-t', role: 'trainer' };

  it('trainer creates a workout log for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))              // getClientOrThrow
      .mockReturnValueOnce(qb({ data: trainerStudioMembership })) // checkWorkoutLogAccess (membership)
      .mockReturnValueOnce(qb({ data: workoutDayWithPlan }))      // getWorkoutDayForClientOrThrow
      .mockReturnValueOnce(qb({ data: mockLog }));                 // insert

    const result = await createWorkoutLog(TRAINER, CLIENT, input);

    expect(result).toEqual(mockLog);
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('client creates their own workout log (skips membership check)', async () => {
    const clientUser = { ...mockClient, user_id: 'auth-user-id' };
    from
      .mockReturnValueOnce(qb({ data: clientUser }))         // getClientOrThrow
      // checkWorkoutLogAccess exits early (user_id === requesterId)
      .mockReturnValueOnce(qb({ data: workoutDayWithPlan })) // getWorkoutDayForClientOrThrow
      .mockReturnValueOnce(qb({ data: mockLog }));           // insert

    const result = await createWorkoutLog('auth-user-id', CLIENT, input);

    expect(result).toEqual(mockLog);
    expect(from).toHaveBeenCalledTimes(3); // no membership check
  });

  it('studio owner creates a workout log for any client', async () => {
    const ownerStudioMembership = { id: 'mem-o', role: 'owner' };
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: ownerStudioMembership }))
      .mockReturnValueOnce(qb({ data: workoutDayWithPlan }))
      .mockReturnValueOnce(qb({ data: mockLog }));

    const result = await createWorkoutLog(OWNER, CLIENT, input);

    expect(result).toEqual(mockLog);
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(createWorkoutLog(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Client not found',
    });
  });

  it('throws 403 when requester is not a studio staff member', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))   // client found
      .mockReturnValueOnce(qb({ data: null }));         // not in studio_members

    await expect(createWorkoutLog('random-user', CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this client',
    });
  });

  it('throws 403 when trainer accesses a client not assigned to them', async () => {
    const unassignedClient = { ...mockClient, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: unassignedClient }))
      .mockReturnValueOnce(qb({ data: { id: 'mem-t', role: 'trainer' } })); // trainer membership

    await expect(createWorkoutLog(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers can only access workout logs for assigned clients',
    });
  });

  it('throws 403 when workout day belongs to a different client', async () => {
    const wrongClientDay = {
      ...workoutDayWithPlan,
      workout_plan: { id: PLAN, client_id: 'other-client' }, // different client
    };
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: wrongClientDay }));

    await expect(createWorkoutLog(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'This workout day does not belong to the specified client',
    });
  });

  it('handles array form of workout_plan join from PostgREST', async () => {
    const dayWithArrayPlan = {
      ...workoutDayWithPlan,
      workout_plan: [{ id: PLAN, client_id: CLIENT }], // array form
    };
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: dayWithArrayPlan }))
      .mockReturnValueOnce(qb({ data: mockLog }));

    const result = await createWorkoutLog(TRAINER, CLIENT, input);

    expect(result).toEqual(mockLog);
  });

  it('throws 404 when workout day does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: null })); // day not found

    await expect(createWorkoutLog(TRAINER, CLIENT, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Workout day not found',
    });
  });
});

// ── listWorkoutLogs ───────────────────────────────────────────────────────────
describe('listWorkoutLogs', () => {
  const logs = [mockLog, { ...mockLog, id: 'log-2', completed_at: '2026-01-02T10:00:00Z' }];
  const trainerStudioMembership = { id: 'mem-t', role: 'trainer' };

  it('trainer lists workout logs for their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: logs }));

    const result = await listWorkoutLogs(TRAINER, CLIENT);

    expect(result).toEqual(logs);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('client lists their own workout logs (no membership check)', async () => {
    const clientUser = { ...mockClient, user_id: 'auth-user-id' };
    from
      .mockReturnValueOnce(qb({ data: clientUser }))
      // checkWorkoutLogAccess returns early — no membership call
      .mockReturnValueOnce(qb({ data: logs }));

    const result = await listWorkoutLogs('auth-user-id', CLIENT);

    expect(result).toEqual(logs);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when no logs exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: null })); // null → coerced to []

    const result = await listWorkoutLogs(TRAINER, CLIENT);

    expect(result).toEqual([]);
  });

  it('applies pagination via limit and offset', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ data: logs }));

    const result = await listWorkoutLogs(TRAINER, CLIENT, { limit: 10, offset: 0 });

    expect(result).toEqual(logs);
  });

  it('throws 403 when trainer accesses an unassigned client', async () => {
    const unassignedClient = { ...mockClient, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: unassignedClient }))
      .mockReturnValueOnce(qb({ data: { id: 'mem-t', role: 'trainer' } }));

    await expect(listWorkoutLogs(TRAINER, CLIENT)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 404 when client does not exist', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(listWorkoutLogs(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 500 on DB error fetching logs', async () => {
    from
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: trainerStudioMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listWorkoutLogs(TRAINER, CLIENT)).rejects.toMatchObject({ statusCode: 500 });
  });
});
