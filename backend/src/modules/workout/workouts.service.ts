import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type { TablesUpdate } from '../../types/database.types.js';
import type {
  CreateWorkoutPlanInput,
  CreateWorkoutDayInput,
  CreateWorkoutItemInput,
  ListWorkoutPlansQuery,
  UpdateWorkoutPlanInput,
  UpdateWorkoutDayInput,
  UpdateWorkoutItemInput,
  CreateWorkoutLogInput,
  ListWorkoutLogsQuery,
} from './workouts.schema.js';

const getStudioStaffMembershipOrThrow = async (
  userId: string,
  studioId: string,
) => {
  const { data: membership, error } = await supabaseAdmin
    .from('studio_members')
    .select('id, role')
    .eq('user_id', userId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check studio permissions');
  }

  if (!membership) {
    throw new ApiError(403, 'You do not have access to this studio');
  }

  if (!['owner', 'trainer'].includes(membership.role)) {
    throw new ApiError(
      403,
      'Only studio owners or trainers can perform this action',
    );
  }

  return membership;
};

const getClientInStudioOrThrow = async (clientId: string, studioId: string) => {
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, studio_id, trainer_id, full_name')
    .eq('id', clientId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check client');
  }

  if (!client) {
    throw new ApiError(404, 'Client not found in this studio');
  }

  return client;
};

export const createWorkoutPlan = async (
  requesterId: string,
  studioId: string,
  input: CreateWorkoutPlanInput,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  const client = await getClientInStudioOrThrow(input.clientId, studioId);

  if (membership.role === 'trainer' && client.trainer_id !== requesterId) {
    throw new ApiError(
      403,
      'Trainers can only create workout plans for assigned clients',
    );
  }

  const { data: workoutPlan, error } = await supabaseAdmin
    .from('workout_plans')
    .insert({
      studio_id: studioId,
      client_id: input.clientId,
      trainer_id: requesterId,
      title: input.title,
      description: input.description ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      status: input.status ?? 'draft',
    })
    .select('*')
    .single();

  if (error || !workoutPlan) {
    throw new ApiError(500, 'Failed to create workout plan');
  }

  return workoutPlan;
};
export const getWorkoutPlanById = async (
  requesterId: string,
  studioId: string,
  planId: string,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  const { data: workoutPlan, error } = await supabaseAdmin
    .from('workout_plans')
    .select(
      `
      id,
      studio_id,
      client_id,
      trainer_id,
      title,
      description,
      start_date,
      end_date,
      status,
      created_at,
      updated_at,
      client:clients!workout_plans_client_id_fkey (
        id,
        full_name,
        email,
        trainer_id,
        status,
        goal
      ),
      trainer:profiles!workout_plans_trainer_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq('id', planId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch workout plan');
  }

  if (!workoutPlan) {
    throw new ApiError(404, 'Workout plan not found');
  }

  if (
    membership.role === 'trainer' &&
    workoutPlan.client?.trainer_id !== requesterId &&
    workoutPlan.trainer_id !== requesterId
  ) {
    throw new ApiError(
      403,
      'You can only view workout plans for assigned clients',
    );
  }

  return workoutPlan;
};
const getWorkoutPlanForWriteOrThrow = async (
  requesterId: string,
  studioId: string,
  planId: string,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  const { data: workoutPlan, error } = await supabaseAdmin
    .from('workout_plans')
    .select(
      `
      id,
      studio_id,
      client_id,
      trainer_id,
      status,
      client:clients!workout_plans_client_id_fkey (
        id,
        trainer_id
      )
    `,
    )
    .eq('id', planId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch workout plan');
  }

  if (!workoutPlan) {
    throw new ApiError(404, 'Workout plan not found');
  }

  if (
    membership.role === 'trainer' &&
    workoutPlan.client?.trainer_id !== requesterId &&
    workoutPlan.trainer_id !== requesterId
  ) {
    throw new ApiError(
      403,
      'Trainers can only modify workout plans for assigned clients',
    );
  }

  return workoutPlan;
};
export const createWorkoutDay = async (
  requesterId: string,
  studioId: string,
  planId: string,
  input: CreateWorkoutDayInput,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  const { count, error: countError } = await supabaseAdmin
    .from('workout_days')
    .select('id', { count: 'exact', head: true })
    .eq('workout_plan_id', planId);

  if (countError) {
    throw new ApiError(500, 'Failed to count workout days');
  }

  if ((count ?? 0) >= 7) {
    throw new ApiError(400, 'A workout plan can have a maximum of 7 days');
  }

  const { data: existingDay, error: existingDayError } = await supabaseAdmin
    .from('workout_days')
    .select('id')
    .eq('workout_plan_id', planId)
    .eq('day_number', input.dayNumber)
    .maybeSingle();

  if (existingDayError) {
    throw new ApiError(500, 'Failed to check workout day number');
  }

  if (existingDay) {
    throw new ApiError(
      409,
      'A workout day with this dayNumber already exists in this plan',
    );
  }

  const { data: workoutDay, error } = await supabaseAdmin
    .from('workout_days')
    .insert({
      workout_plan_id: planId,
      day_number: input.dayNumber,
      title: input.title,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError(
        409,
        'A workout day with this dayNumber already exists in this plan',
      );
    }

    throw new ApiError(500, 'Failed to create workout day');
  }

  if (!workoutDay) {
    throw new ApiError(500, 'Failed to create workout day');
  }

  return workoutDay;
};

const getWorkoutDayInPlanOrThrow = async (
  dayId: string,
  planId: string,
) => {
  const { data: workoutDay, error } = await supabaseAdmin
    .from('workout_days')
    .select('id, workout_plan_id, day_number, title')
    .eq('id', dayId)
    .eq('workout_plan_id', planId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check workout day');
  }

  if (!workoutDay) {
    throw new ApiError(404, 'Workout day not found in this plan');
  }

  return workoutDay;
};

const getExerciseOrThrow = async (exerciseId: string) => {
  const { data: exercise, error } = await supabaseAdmin
    .from('exercises')
    .select('id, name')
    .eq('id', exerciseId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check exercise');
  }

  if (!exercise) {
    throw new ApiError(404, 'Exercise not found');
  }

  return exercise;
};

export const createWorkoutItem = async (
  requesterId: string,
  studioId: string,
  planId: string,
  dayId: string,
  input: CreateWorkoutItemInput,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  await getWorkoutDayInPlanOrThrow(dayId, planId);

  await getExerciseOrThrow(input.exerciseId);

  const { data: workoutItem, error } = await supabaseAdmin
    .from('workout_items')
    .insert({
      workout_day_id: dayId,
      exercise_id: input.exerciseId,
      sets: input.sets ?? null,
      reps: input.reps ?? null,
      target_weight: input.targetWeight ?? null,
      rest_seconds: input.restSeconds ?? null,
      notes: input.notes ?? null,
    })
    .select(
      `
      id,
      workout_day_id,
      exercise_id,
      sets,
      reps,
      target_weight,
      rest_seconds,
      notes,
      exercise:exercises (
        id,
        name,
        muscle_group,
        equipment,
        difficulty
      )
    `,
    )
    .single();

  if (error || !workoutItem) {
    throw new ApiError(500, 'Failed to create workout item');
  }

  return workoutItem;
};

export const listWorkoutPlans = async (
  requesterId: string,
  studioId: string,
  query?: ListWorkoutPlansQuery,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  let request = supabaseAdmin
    .from('workout_plans')
    .select(
      `
      id,
      studio_id,
      client_id,
      trainer_id,
      title,
      description,
      start_date,
      end_date,
      status,
      created_at,
      updated_at,
      client:clients!workout_plans_client_id_fkey (
        id,
        full_name,
        email,
        trainer_id,
        status
      ),
      trainer:profiles!workout_plans_trainer_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false });

  if (query?.trainerId) {
    request = request.eq('trainer_id', query.trainerId);
  }

  if (query?.clientId) {
    request = request.eq('client_id', query.clientId);
  }

  if (query?.status) {
    request = request.eq('status', query.status);
  }

  if (query?.search) {
    request = request.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }

  const { data: plans, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to fetch workout plans');
  }

  let filtered = plans ?? [];

  if (membership.role === 'trainer') {
    filtered = filtered.filter(
      (p) => p.trainer_id === requesterId || p.client?.trainer_id === requesterId,
    );
  }

  const offset = query?.limit && query.offset ? query.offset : query?.offset ?? 0;
  const limit = query?.limit ?? filtered.length;

  return filtered.slice(offset, offset + limit);
};

export const updateWorkoutPlan = async (
  requesterId: string,
  studioId: string,
  planId: string,
  input: UpdateWorkoutPlanInput,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  const updatePayload: TablesUpdate<'workout_plans'> = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.startDate !== undefined && { start_date: input.startDate }),
    ...(input.endDate !== undefined && { end_date: input.endDate }),
    ...(input.status !== undefined && { status: input.status }),
    updated_at: new Date().toISOString(),
  };

  const { data: workoutPlan, error } = await supabaseAdmin
    .from('workout_plans')
    .update(updatePayload)
    .eq('id', planId)
    .eq('studio_id', studioId)
    .select('*')
    .single();

  if (error || !workoutPlan) {
    throw new ApiError(500, 'Failed to update workout plan');
  }

  return workoutPlan;
};

export const deleteWorkoutPlan = async (
  requesterId: string,
  studioId: string,
  planId: string,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  // Soft-archive the plan
  const { error } = await supabaseAdmin
    .from('workout_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('studio_id', studioId)
    .select('id')
    .single();

  if (error) {
    throw new ApiError(500, 'Failed to archive workout plan');
  }

  return { deleted: true, planId };
};

export const updateWorkoutDay = async (
  requesterId: string,
  studioId: string,
  planId: string,
  dayId: string,
  input: UpdateWorkoutDayInput,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  await getWorkoutDayInPlanOrThrow(dayId, planId);

  if (input.dayNumber !== undefined) {
    const { data: conflict, error: conflictError } = await supabaseAdmin
      .from('workout_days')
      .select('id')
      .eq('workout_plan_id', planId)
      .eq('day_number', input.dayNumber)
      .neq('id', dayId)
      .maybeSingle();

    if (conflictError) {
      throw new ApiError(500, 'Failed to check workout day number');
    }

    if (conflict) {
      throw new ApiError(409, 'A workout day with this dayNumber already exists in this plan');
    }
  }

  const updatePayload: TablesUpdate<'workout_days'> = {
    ...(input.dayNumber !== undefined && { day_number: input.dayNumber }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.notes !== undefined && { notes: input.notes }),
  };

  const { data: workoutDay, error } = await supabaseAdmin
    .from('workout_days')
    .update(updatePayload)
    .eq('id', dayId)
    .eq('workout_plan_id', planId)
    .select('*')
    .single();

  if (error || !workoutDay) {
    throw new ApiError(500, 'Failed to update workout day');
  }

  return workoutDay;
};

export const deleteWorkoutDay = async (
  requesterId: string,
  studioId: string,
  planId: string,
  dayId: string,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  await getWorkoutDayInPlanOrThrow(dayId, planId);

  const { error } = await supabaseAdmin
    .from('workout_days')
    .delete()
    .eq('id', dayId)
    .eq('workout_plan_id', planId);

  if (error) {
    throw new ApiError(500, 'Failed to delete workout day');
  }

  return { deleted: true, dayId };
};

export const updateWorkoutItem = async (
  requesterId: string,
  studioId: string,
  planId: string,
  dayId: string,
  itemId: string,
  input: UpdateWorkoutItemInput,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  await getWorkoutDayInPlanOrThrow(dayId, planId);

  const { data: existingItem, error: existingItemError } = await supabaseAdmin
    .from('workout_items')
    .select('id, workout_day_id')
    .eq('id', itemId)
    .maybeSingle();

  if (existingItemError) {
    throw new ApiError(500, 'Failed to fetch workout item');
  }

  if (!existingItem || existingItem.workout_day_id !== dayId) {
    throw new ApiError(404, 'Workout item not found in this day');
  }

  const updatePayload: TablesUpdate<'workout_items'> = {
    ...(input.sets !== undefined && { sets: input.sets }),
    ...(input.reps !== undefined && { reps: input.reps }),
    ...(input.targetWeight !== undefined && { target_weight: input.targetWeight }),
    ...(input.restSeconds !== undefined && { rest_seconds: input.restSeconds }),
    ...(input.notes !== undefined && { notes: input.notes }),
  };

  const { data: workoutItem, error } = await supabaseAdmin
    .from('workout_items')
    .update(updatePayload)
    .eq('id', itemId)
    .eq('workout_day_id', dayId)
    .select(
      `
      id,
      workout_day_id,
      exercise_id,
      sets,
      reps,
      target_weight,
      rest_seconds,
      notes,
      exercise:exercises (
        id,
        name,
        muscle_group,
        equipment,
        difficulty
      )
    `,
    )
    .single();

  if (error || !workoutItem) {
    throw new ApiError(500, 'Failed to update workout item');
  }

  return workoutItem;
};

export const deleteWorkoutItem = async (
  requesterId: string,
  studioId: string,
  planId: string,
  dayId: string,
  itemId: string,
) => {
  await getWorkoutPlanForWriteOrThrow(requesterId, studioId, planId);

  await getWorkoutDayInPlanOrThrow(dayId, planId);

  const { error } = await supabaseAdmin
    .from('workout_items')
    .delete()
    .eq('id', itemId)
    .eq('workout_day_id', dayId);

  if (error) {
    throw new ApiError(500, 'Failed to delete workout item');
  }

  return { deleted: true, itemId };
};

// ─── Workout Logs ───────────────────────────────────────────────────────────

const getClientOrThrow = async (clientId: string) => {
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, studio_id, user_id, trainer_id')
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch client');
  }

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  return client;
};

const checkWorkoutLogAccess = async (
  requesterId: string,
  client: { id: string; studio_id: string; user_id: string | null; trainer_id: string | null },
) => {
  if (client.user_id === requesterId) {
    return;
  }

  const { data: membership, error } = await supabaseAdmin
    .from('studio_members')
    .select('id, role')
    .eq('user_id', requesterId)
    .eq('studio_id', client.studio_id)
    .in('role', ['owner', 'trainer'])
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check studio permissions');
  }

  if (!membership) {
    throw new ApiError(403, 'You do not have access to this client');
  }

  if (membership.role === 'trainer' && client.trainer_id !== requesterId) {
    throw new ApiError(403, 'Trainers can only access workout logs for assigned clients');
  }
};

const getWorkoutDayForClientOrThrow = async (workoutDayId: string, clientId: string) => {
  const { data: workoutDay, error } = await supabaseAdmin
    .from('workout_days')
    .select(
      `
      id,
      workout_plan_id,
      workout_plan:workout_plans!workout_days_workout_plan_id_fkey (
        id,
        client_id
      )
    `,
    )
    .eq('id', workoutDayId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch workout day');
  }

  if (!workoutDay) {
    throw new ApiError(404, 'Workout day not found');
  }

  const plan = Array.isArray(workoutDay.workout_plan)
    ? workoutDay.workout_plan[0]
    : workoutDay.workout_plan;

  if (!plan || plan.client_id !== clientId) {
    throw new ApiError(403, 'This workout day does not belong to the specified client');
  }

  return workoutDay;
};

export const createWorkoutLog = async (
  requesterId: string,
  clientId: string,
  input: CreateWorkoutLogInput,
) => {
  const client = await getClientOrThrow(clientId);

  await checkWorkoutLogAccess(requesterId, client);

  await getWorkoutDayForClientOrThrow(input.workoutDayId, clientId);

  const { data: workoutLog, error } = await supabaseAdmin
    .from('workout_logs')
    .insert({
      client_id: clientId,
      workout_day_id: input.workoutDayId,
      completed_at: input.completedAt ?? new Date().toISOString(),
      difficulty_rating: input.difficultyRating ?? null,
      feedback: input.feedback ?? null,
    })
    .select(
      `
      id,
      client_id,
      workout_day_id,
      completed_at,
      difficulty_rating,
      feedback,
      workout_day:workout_days (
        id,
        day_number,
        title,
        workout_plan:workout_plans!workout_days_workout_plan_id_fkey (
          id,
          title,
          status
        )
      )
    `,
    )
    .single();

  if (error || !workoutLog) {
    throw new ApiError(500, 'Failed to create workout log');
  }

  return workoutLog;
};

export const listWorkoutLogs = async (
  requesterId: string,
  clientId: string,
  query?: ListWorkoutLogsQuery,
) => {
  const client = await getClientOrThrow(clientId);

  await checkWorkoutLogAccess(requesterId, client);

  const limit = query?.limit ?? 50;
  const offset = query?.offset ?? 0;

  const { data: logs, error } = await supabaseAdmin
    .from('workout_logs')
    .select(
      `
      id,
      client_id,
      workout_day_id,
      completed_at,
      difficulty_rating,
      feedback,
      workout_day:workout_days (
        id,
        day_number,
        title,
        workout_plan:workout_plans!workout_days_workout_plan_id_fkey (
          id,
          title,
          status
        )
      )
    `,
    )
    .eq('client_id', clientId)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(500, 'Failed to fetch workout logs');
  }

  return logs ?? [];
};