import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';

const getStudioStaffMembershipOrThrow = async (userId: string, studioId: string) => {
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
    throw new ApiError(403, 'Only studio owners or trainers can view studio analytics');
  }

  return membership;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const getWeekRange = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diffToMonday);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { start, end };
};

const getMonthRange = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { start, end };
};

const getCount = async (
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  errorMessage: string,
) => {
  const { count, error } = await query;

  if (error) {
    throw new ApiError(500, errorMessage);
  }

  return count ?? 0;
};

export const getStudioOverviewAnalytics = async (requesterId: string, studioId: string) => {
  const membership = await getStudioStaffMembershipOrThrow(requesterId, studioId);
  const trainerId = membership.role === 'trainer' ? requesterId : null;

  const now = new Date();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);

  const clientsQuery = () => {
    let query = supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', studioId);

    if (trainerId) {
      query = query.eq('trainer_id', trainerId);
    }

    return query;
  };

  const sessionsQuery = () => {
    let query = supabaseAdmin
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', studioId);

    if (trainerId) {
      query = query.eq('trainer_id', trainerId);
    }

    return query;
  };

  const activeClientsCount = await getCount(
    clientsQuery().eq('status', 'active'),
    'Failed to count active clients',
  );

  const newClientsThisMonth = await getCount(
    clientsQuery()
      .gte('joined_at', toDateOnly(monthRange.start))
      .lt('joined_at', toDateOnly(monthRange.end)),
    'Failed to count new clients this month',
  );

  const sessionsThisWeek = await getCount(
    sessionsQuery()
      .gte('start_time', weekRange.start.toISOString())
      .lt('start_time', weekRange.end.toISOString()),
    'Failed to count sessions this week',
  );

  const completedSessionsThisMonth = await getCount(
    sessionsQuery()
      .eq('status', 'completed')
      .gte('start_time', monthRange.start.toISOString())
      .lt('start_time', monthRange.end.toISOString()),
    'Failed to count completed sessions this month',
  );

  const missedSessionsThisMonth = await getCount(
    sessionsQuery()
      .eq('status', 'no_show')
      .gte('start_time', monthRange.start.toISOString())
      .lt('start_time', monthRange.end.toISOString()),
    'Failed to count missed sessions this month',
  );

  const workoutCompletionRate = await calculateWorkoutCompletionRate(studioId, trainerId);
  const missedCheckInsCount = await countMissedCheckIns(studioId, trainerId, sevenDaysAgo);

  return {
    activeClients: activeClientsCount,
    newClientsThisMonth,
    sessionsThisWeek,
    completedSessionsThisMonth,
    missedSessionsThisMonth,
    workoutCompletionRate,
    missedCheckIns: missedCheckInsCount,
  };
};

/**
 * Percentage of workout days (across the studio's active workout plans) that have
 * at least one completion log. Returns null when there are no active plans.
 */
const calculateWorkoutCompletionRate = async (
  studioId: string,
  trainerId: string | null,
): Promise<number | null> => {
  let plansQuery = supabaseAdmin
    .from('workout_plans')
    .select('id')
    .eq('studio_id', studioId)
    .eq('status', 'active');

  if (trainerId) {
    plansQuery = plansQuery.eq('trainer_id', trainerId);
  }

  const { data: plans, error: plansError } = await plansQuery;

  if (plansError) {
    throw new ApiError(500, 'Failed to calculate workout completion rate');
  }

  const planIds = (plans ?? []).map((plan) => plan.id);

  if (planIds.length === 0) {
    return null;
  }

  const { data: days, error: daysError } = await supabaseAdmin
    .from('workout_days')
    .select('id')
    .in('workout_plan_id', planIds);

  if (daysError) {
    throw new ApiError(500, 'Failed to calculate workout completion rate');
  }

  const dayIds = (days ?? []).map((day) => day.id);

  if (dayIds.length === 0) {
    return 0;
  }

  const { data: logs, error: logsError } = await supabaseAdmin
    .from('workout_logs')
    .select('workout_day_id')
    .in('workout_day_id', dayIds);

  if (logsError) {
    throw new ApiError(500, 'Failed to calculate workout completion rate');
  }

  const completedDayIds = new Set((logs ?? []).map((log) => log.workout_day_id));

  return Math.round((completedDayIds.size / dayIds.length) * 1000) / 10;
};

/**
 * Number of active clients who have not submitted a check-in within the last 7 days.
 */
const countMissedCheckIns = async (
  studioId: string,
  trainerId: string | null,
  sevenDaysAgo: Date,
): Promise<number> => {
  let activeClientsQuery = supabaseAdmin
    .from('clients')
    .select('id')
    .eq('studio_id', studioId)
    .eq('status', 'active');

  if (trainerId) {
    activeClientsQuery = activeClientsQuery.eq('trainer_id', trainerId);
  }

  const { data: clients, error: clientsError } = await activeClientsQuery;

  if (clientsError) {
    throw new ApiError(500, 'Failed to count missed check-ins');
  }

  const activeClientIds = (clients ?? []).map((client) => client.id);

  if (activeClientIds.length === 0) {
    return 0;
  }

  const { data: recentCheckIns, error: checkInsError } = await supabaseAdmin
    .from('check_ins')
    .select('client_id')
    .in('client_id', activeClientIds)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (checkInsError) {
    throw new ApiError(500, 'Failed to count missed check-ins');
  }

  const checkedInClientIds = new Set((recentCheckIns ?? []).map((entry) => entry.client_id));

  return activeClientIds.filter((id) => !checkedInClientIds.has(id)).length;
};
