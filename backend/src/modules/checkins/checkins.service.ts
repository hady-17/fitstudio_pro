import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  CreateCheckInInput,
  ListCheckInsQuery,
  CreateMeasurementInput,
  ListMeasurementsQuery,
} from './checkins.schema.js';

/**
 * Helper function to fetch a client by ID and throw appropriate errors if not found or on database issues.
 * 
 */
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
/** 
 * Helper function to check if the requester has access to the client's data based on their role in the studio.
 * - Clients can access their own data.
 * - Studio owners can access all clients in their studio.
 * - Trainers can access data for clients assigned to them.
 * Throws a 403 error if access is denied, or a 500 error if there's an issue checking permissions.
*/
const checkClientAccess = async (
  requesterId: string,
  client: { id: string; studio_id: string; user_id: string | null; trainer_id: string | null },
) => {
  if (client.user_id === requesterId) {
    return;
  }

/**
 *  Check if the requester is a studio owner or trainer with access to this client. We query the `studio_members` table to find a record where:
 * - `user_id` matches the requester ID
 * - `studio_id` matches the client's studio ID
 * - `role` is either 'owner' or 'trainer'
 * If no such record exists, the requester does not have access. If the role is 'trainer', we also check that the trainer is assigned to this client.
 */
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
    throw new ApiError(403, 'Trainers can only access progress data for assigned clients');
  }
};

const CHECK_IN_COLUMNS = 'id, client_id, weight, mood, energy_level, sleep_hours, notes, created_at';

/**
 * Creates a new check-in record for a client. Validates that the requester has permission to access the client's data before inserting the record into the database. Returns the created check-in or throws an error if the operation fails.
 * @param requesterId 
 * @param clientId 
 * @param input 
 * @returns 
 */
export const createCheckIn = async (
  requesterId: string,
  clientId: string,
  input: CreateCheckInInput,
) => {
  const client = await getClientOrThrow(clientId);

  await checkClientAccess(requesterId, client);

  const { data: checkIn, error } = await supabaseAdmin
    .from('check_ins')
    .insert({
      client_id: clientId,
      weight: input.weight ?? null,
      mood: input.mood ?? null,
      energy_level: input.energyLevel ?? null,
      sleep_hours: input.sleepHours ?? null,
      notes: input.notes ?? null,
    })
    .select(CHECK_IN_COLUMNS)
    .single();

  if (error || !checkIn) {
    throw new ApiError(500, 'Failed to create check-in');
  }

  return checkIn;
};

/**
 * Lists check-ins for a client. Validates that the requester has permission to access the client's data before fetching the records from the database. Returns the list of check-ins or throws an error if the operation fails.
 * @param requesterId 
 * @param clientId 
 * @param query 
 * @returns 
 */
export const listCheckIns = async (
  requesterId: string,
  clientId: string,
  query?: ListCheckInsQuery,
) => {
  const client = await getClientOrThrow(clientId);

  await checkClientAccess(requesterId, client);

  const limit = query?.limit ?? 50;
  const offset = query?.offset ?? 0;

  const { data: checkIns, error } = await supabaseAdmin
    .from('check_ins')
    .select(CHECK_IN_COLUMNS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(500, 'Failed to fetch check-ins');
  }

  return checkIns ?? [];
};

const MEASUREMENT_COLUMNS = 'id, client_id, weight, waist, chest, arms, legs, created_at';
/**
 * Creates a new measurement record for a client. Validates that the requester has permission to access the client's data before inserting the record into the database. Returns the created measurement or throws an error if the operation fails.
 * @param requesterId 
 * @param clientId 
 * @param input 
 * @returns 
 */
export const createMeasurement = async (
  requesterId: string,
  clientId: string,
  input: CreateMeasurementInput,
) => {
  const client = await getClientOrThrow(clientId);

  await checkClientAccess(requesterId, client);

  const { data: measurement, error } = await supabaseAdmin
    .from('measurements')
    .insert({
      client_id: clientId,
      weight: input.weight ?? null,
      waist: input.waist ?? null,
      chest: input.chest ?? null,
      arms: input.arms ?? null,
      legs: input.legs ?? null,
    })
    .select(MEASUREMENT_COLUMNS)
    .single();

  if (error || !measurement) {
    throw new ApiError(500, 'Failed to create measurement');
  }

  return measurement;
};

/**
 * Lists measurements for a client. Validates that the requester has permission to access the client's data before fetching the records from the database. Returns the list of measurements or throws an error if the operation fails.
 * @param requesterId 
 * @param clientId 
 * @param query 
 * @returns 
 */
export const listMeasurements = async (
  requesterId: string,
  clientId: string,
  query?: ListMeasurementsQuery,
) => {
  const client = await getClientOrThrow(clientId);

  await checkClientAccess(requesterId, client);

  const limit = query?.limit ?? 50;
  const offset = query?.offset ?? 0;

  const { data: measurements, error } = await supabaseAdmin
    .from('measurements')
    .select(MEASUREMENT_COLUMNS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(500, 'Failed to fetch measurements');
  }

  return measurements ?? [];
};

type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Builds a weight trend based on a list of entries.
 * @param entries 
 * @returns 
 */
const buildWeightTrend = (
  entries: { weight: number | null; created_at: string }[],
): {
  latest: { weight: number; recordedAt: string } | null;
  previous: { weight: number; recordedAt: string } | null;
  change: number | null;
  direction: TrendDirection | null;
} => {
  const withWeight = entries.filter(
    (entry): entry is { weight: number; created_at: string } => entry.weight !== null,
  );

  const latest = withWeight[0] ?? null;
  const previous = withWeight[1] ?? null;

  if (!latest) {
    return { latest: null, previous: null, change: null, direction: null };
  }

  if (!previous) {
    return {
      latest: { weight: latest.weight, recordedAt: latest.created_at },
      previous: null,
      change: null,
      direction: null,
    };
  }

  const change = Math.round((latest.weight - previous.weight) * 100) / 100;
  const direction: TrendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

  return {
    latest: { weight: latest.weight, recordedAt: latest.created_at },
    previous: { weight: previous.weight, recordedAt: previous.created_at },
    change,
    direction,
  };
};

/**
 *  Calculates the client's progress trend based on their latest check-in and measurement weights. Validates that the requester has permission to access the client's data before fetching the records from the database. Returns the weight trends or throws an error if the operation fails.
 * @param requesterId 
 * @param clientId 
 * @returns 
 */
export const getClientProgressTrend = async (requesterId: string, clientId: string) => {
  const client = await getClientOrThrow(clientId);

  await checkClientAccess(requesterId, client);

  const [checkInsResult, measurementsResult] = await Promise.all([
    supabaseAdmin
      .from('check_ins')
      .select('weight, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(2),
    supabaseAdmin
      .from('measurements')
      .select('weight, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  if (checkInsResult.error || measurementsResult.error) {
    throw new ApiError(500, 'Failed to calculate progress trend');
  }

  return {
    checkInWeight: buildWeightTrend(checkInsResult.data ?? []),
    measurementWeight: buildWeightTrend(measurementsResult.data ?? []),
  };
};
