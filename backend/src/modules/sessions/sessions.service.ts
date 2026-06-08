import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../lib/logger.js';
import type {
  CreateSessionInput,
  ListSessionsQuery,
  UpdateSessionStatusInput,
} from './sessions.schema.js';

const SESSION_SELECT = `
  id,
  studio_id,
  trainer_id,
  client_id,
  start_time,
  end_time,
  status,
  notes,
  created_at,
  updated_at,
  trainer:profiles!sessions_trainer_id_fkey (
    id,
    full_name,
    email,
    avatar_url
  ),
  client:clients!sessions_client_id_fkey (
    id,
    full_name,
    email
  )
`;

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
    throw new ApiError(403, 'Only studio owners or trainers can perform this action');
  }

  return membership;
};

const getClientInStudioOrThrow = async (clientId: string, studioId: string) => {
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, studio_id, full_name, user_id')
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

const getTrainerInStudioOrThrow = async (trainerId: string, studioId: string) => {
  const { data: membership, error } = await supabaseAdmin
    .from('studio_members')
    .select('id, role')
    .eq('user_id', trainerId)
    .eq('studio_id', studioId)
    .in('role', ['owner', 'trainer'])
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check trainer');
  }

  if (!membership) {
    throw new ApiError(404, 'Trainer not found in this studio');
  }

  return membership;
};

const checkTrainerConflict = async (
  trainerId: string,
  startTime: string,
  endTime: string,
) => {
  const { data: conflicts, error } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('trainer_id', trainerId)
    .eq('status', 'scheduled')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) {
    throw new ApiError(500, 'Failed to check trainer schedule');
  }

  if (conflicts && conflicts.length > 0) {
    throw new ApiError(409, 'Trainer already has a session scheduled during this time');
  }
};

const checkClientConflict = async (
  clientId: string,
  startTime: string,
  endTime: string,
) => {
  const { data: conflicts, error } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'scheduled')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) {
    throw new ApiError(500, 'Failed to check client schedule');
  }

  if (conflicts && conflicts.length > 0) {
    throw new ApiError(409, 'Client already has a session scheduled during this time');
  }
};

export const createSession = async (
  requesterId: string,
  studioId: string,
  input: CreateSessionInput,
) => {
  await getStudioStaffMembershipOrThrow(requesterId, studioId);

  const client = await getClientInStudioOrThrow(input.clientId, studioId);

  await getTrainerInStudioOrThrow(input.trainerId, studioId);

  if (new Date(input.startTime) < new Date()) {
    throw new ApiError(400, 'Cannot schedule a session in the past');
  }

  await checkTrainerConflict(input.trainerId, input.startTime, input.endTime);

  await checkClientConflict(input.clientId, input.startTime, input.endTime);

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      studio_id: studioId,
      trainer_id: input.trainerId,
      client_id: input.clientId,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes ?? null,
      status: 'scheduled',
    })
    .select(SESSION_SELECT)
    .single();

  if (error || !session) {
    throw new ApiError(500, 'Failed to create session');
  }

  await enqueueSessionReminders(session, client.user_id);

  return session;
};

const REMINDER_LEAD_TIME_MS = 60 * 60 * 1000;

const enqueueSessionReminders = async (
  session: { id: string; trainer_id: string; client_id: string; start_time: string },
  clientUserId: string | null,
) => {
  const scheduledFor = new Date(
    new Date(session.start_time).getTime() - REMINDER_LEAD_TIME_MS,
  ).toISOString();

  const baseMetadata = {
    sessionId: session.id,
    clientId: session.client_id,
    trainerId: session.trainer_id,
    startTime: session.start_time,
  };

  const reminderJobs = [
    {
      user_id: session.trainer_id,
      type: 'session_reminder',
      scheduled_for: scheduledFor,
      status: 'pending',
      metadata: { ...baseMetadata, recipientRole: 'trainer' },
    },
    ...(clientUserId
      ? [
          {
            user_id: clientUserId,
            type: 'session_reminder',
            scheduled_for: scheduledFor,
            status: 'pending',
            metadata: { ...baseMetadata, recipientRole: 'client' },
          },
        ]
      : []),
  ];

  const { error } = await supabaseAdmin.from('reminder_jobs').insert(reminderJobs);

  if (error) {
    logger.warn('Failed to enqueue session reminder jobs', {
      sessionId: session.id,
      message: error.message,
    });
  }
};

export const listSessions = async (
  requesterId: string,
  studioId: string,
  query?: ListSessionsQuery,
) => {
  const membership = await getStudioStaffMembershipOrThrow(requesterId, studioId);

  let request = supabaseAdmin
    .from('sessions')
    .select(SESSION_SELECT)
    .eq('studio_id', studioId)
    .order('start_time', { ascending: true });

  if (membership.role === 'trainer') {
    request = request.eq('trainer_id', requesterId);
  }

  if (query?.trainerId) {
    request = request.eq('trainer_id', query.trainerId);
  }

  if (query?.clientId) {
    request = request.eq('client_id', query.clientId);
  }

  if (query?.status) {
    request = request.eq('status', query.status);
  }

  if (query?.dateFrom) {
    request = request.gte('start_time', query.dateFrom);
  }

  if (query?.dateTo) {
    request = request.lte('start_time', query.dateTo);
  }

  const { data: sessions, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to fetch sessions');
  }

  const all = sessions ?? [];
  const offset = query?.offset ?? 0;
  const limit = query?.limit ?? all.length;

  return all.slice(offset, offset + limit);
};

export const updateSessionStatus = async (
  requesterId: string,
  sessionId: string,
  input: UpdateSessionStatusInput,
) => {
  const { data: session, error: fetchError } = await supabaseAdmin
    .from('sessions')
    .select('id, studio_id, trainer_id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError) {
    throw new ApiError(500, 'Failed to fetch session');
  }

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const membership = await getStudioStaffMembershipOrThrow(requesterId, session.studio_id);

  if (membership.role === 'trainer' && session.trainer_id !== requesterId) {
    throw new ApiError(403, 'Trainers can only update their own sessions');
  }

  if (session.status !== 'scheduled') {
    throw new ApiError(400, `Cannot update a session with status '${session.status}'`);
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select(SESSION_SELECT)
    .single();

  if (updateError || !updated) {
    throw new ApiError(500, 'Failed to update session status');
  }

  return updated;
};
