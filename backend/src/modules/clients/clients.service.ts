import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from './clients.schema.js';

// Checks if the user is a staff member (owner or trainer) of the studio, throws if not
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

// Verifies that the given trainer belongs to the specified studio, throws if not
const verifyTrainerBelongsToStudio = async (
  trainerId: string,
  studioId: string,
) => {
  const { data: trainerMembership, error } = await supabaseAdmin
    .from('studio_members')
    .select('id, role')
    .eq('user_id', trainerId)
    .eq('studio_id', studioId)
    .in('role', ['owner', 'trainer'])
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to verify trainer');
  }

  if (!trainerMembership) {
    throw new ApiError(400, 'Trainer must belong to this studio');
  }
};

// Finds a user profile by email (case-insensitive), returns profile or null
const findProfileByEmail = async (email?: string | null) => {
  if (!email) {
    return null;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to check client profile');
  }

  return profile;
};

// Ensures the user is a client member of the studio, creates membership if missing
const ensureClientStudioMembership = async (
  userId: string,
  studioId: string,
) => {
  const { data: existingMembership, error: existingMembershipError } =
    await supabaseAdmin
      .from('studio_members')
      .select('id, role')
      .eq('user_id', userId)
      .eq('studio_id', studioId)
      .maybeSingle();

  if (existingMembershipError) {
    throw new ApiError(500, 'Failed to check client studio membership');
  }

  if (existingMembership) {
    return existingMembership;
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('studio_members')
    .insert({
      studio_id: studioId,
      user_id: userId,
      role: 'client',
    })
    .select('id, role')
    .single();

  if (membershipError || !membership) {
    throw new ApiError(500, 'Failed to create client studio membership');
  }

  return membership;
};

// Ensures the client's email is unique within the studio (optionally excluding a client by ID)
const ensureClientEmailIsUniqueInStudio = async (
  studioId: string,
  email?: string | null,
  excludeClientId?: string,
) => {
  if (!email) {
    return;
  }

  let request = supabaseAdmin
    .from('clients')
    .select('id')
    .eq('studio_id', studioId)
    .ilike('email', email)
    .limit(1);

  if (excludeClientId) {
    request = request.neq('id', excludeClientId);
  }

  const { data: existingClients, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to check client email');
  }

  if (existingClients && existingClients.length > 0) {
    throw new ApiError(
      409,
      'A client with this email already exists in this studio',
    );
  }
};

// Throws a duplicate client email error for consistent error handling
const throwDuplicateClientEmailError = () => {
  throw new ApiError(
    409,
    'A client with this email already exists in this studio',
  );
};

/**
 * Creates a new client in the studio.
 * - Only owners/trainers can create clients.
 * - Trainers can only assign clients to themselves.
 * - Ensures unique email and links profile if exists.
 */
export const createClient = async (
  requesterId: string,
  studioId: string,
  input: CreateClientInput,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  if (
    membership.role === 'trainer' &&
    input.trainerId &&
    input.trainerId !== requesterId
  ) {
    throw new ApiError(403, 'Trainers can only assign clients to themselves');
  }

  const assignedTrainerId = input.trainerId ?? requesterId;

  await verifyTrainerBelongsToStudio(assignedTrainerId, studioId);

  await ensureClientEmailIsUniqueInStudio(studioId, input.email);

  const linkedProfile = await findProfileByEmail(input.email);

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .insert({
      studio_id: studioId,
      user_id: linkedProfile?.id ?? null,
      trainer_id: assignedTrainerId,
      full_name: input.fullName,
      email: input.email ?? null,
      status: input.status ?? 'active',
      goal: input.goal ?? null,
      notes: input.notes ?? null,
      joined_at: input.joinedAt ?? new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throwDuplicateClientEmailError();
    }

    throw new ApiError(500, 'Failed to create client');
  }

  if (!client) {
    throw new ApiError(500, 'Failed to create client');
  }

  if (linkedProfile) {
    await ensureClientStudioMembership(linkedProfile.id, studioId);
  }

  return client;
};

/**
 * Lists clients in the studio.
 * - Owners see all clients, trainers see only their own.
 * - Supports filtering by status and search query.
 */
export const listClients = async (
  requesterId: string,
  studioId: string,
  query: ListClientsQuery,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  let request = supabaseAdmin
    .from('clients')
    .select(
      `
      id,
      studio_id,
      user_id,
      trainer_id,
      full_name,
      email,
      status,
      goal,
      notes,
      joined_at,
      created_at,
      updated_at,
      trainer:profiles!clients_trainer_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false });

  if (membership.role === 'trainer') {
    request = request.eq('trainer_id', requesterId);
  }

  if (query.status) {
    request = request.eq('status', query.status);
  }

  if (query.search) {
    request = request.or(
      `full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
    );
  }

  const { data: clients, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to fetch clients');
  }

  return clients;
};

/**
 * Gets a client by ID in the studio.
 * - Owners can access any client, trainers only their own.
 * - Returns client details and related profile info.
 */
export const getClientById = async (
  requesterId: string,
  studioId: string,
  clientId: string,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  let request = supabaseAdmin
    .from('clients')
    .select(
      `
      id,
      studio_id,
      user_id,
      trainer_id,
      full_name,
      email,
      status,
      goal,
      notes,
      joined_at,
      created_at,
      updated_at,
      trainer:profiles!clients_trainer_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      ),
      user:profiles!clients_user_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq('id', clientId)
    .eq('studio_id', studioId);

  if (membership.role === 'trainer') {
    request = request.eq('trainer_id', requesterId);
  }

  const { data: client, error } = await request.maybeSingle();

  if (error) {
    throw new ApiError(500, 'Failed to fetch client');
  }

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  return client;
};

/**
 * Updates a client's details in the studio.
 * - Owners can update any client, trainers only their own.
 * - Trainers cannot reassign clients.
 * - Ensures unique email and valid trainer assignment.
 */
export const updateClient = async (
  requesterId: string,
  studioId: string,
  clientId: string,
  input: UpdateClientInput,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  const { data: existingClient, error: existingClientError } =
    await supabaseAdmin
      .from('clients')
      .select('id, studio_id, trainer_id')
      .eq('id', clientId)
      .eq('studio_id', studioId)
      .maybeSingle();

  if (existingClientError) {
    throw new ApiError(500, 'Failed to fetch client');
  }

  if (!existingClient) {
    throw new ApiError(404, 'Client not found');
  }

  if (
    membership.role === 'trainer' &&
    existingClient.trainer_id !== requesterId
  ) {
    throw new ApiError(403, 'You can only update clients assigned to you');
  }

  if (
    membership.role === 'trainer' &&
    input.trainerId &&
    input.trainerId !== requesterId
  ) {
    throw new ApiError(403, 'Trainers cannot reassign clients');
  }

  if (input.trainerId) {
    await verifyTrainerBelongsToStudio(input.trainerId, studioId);
  }

  if (input.email !== undefined && input.email !== null) {
    await ensureClientEmailIsUniqueInStudio(studioId, input.email, clientId);
  }

  const updatePayload = {
    ...(input.fullName !== undefined && { full_name: input.fullName }),
    ...(input.email !== undefined && { email: input.email }),
    ...(input.trainerId !== undefined && { trainer_id: input.trainerId }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.goal !== undefined && { goal: input.goal }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.joinedAt !== undefined && { joined_at: input.joinedAt }),
    updated_at: new Date().toISOString(),
  };

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .update(updatePayload)
    .eq('id', clientId)
    .eq('studio_id', studioId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throwDuplicateClientEmailError();
    }

    throw new ApiError(500, 'Failed to update client');
  }

  if (!client) {
    throw new ApiError(500, 'Failed to update client');
  }

  return client;
};

/**
 * Deletes a client from the studio.
 * - Owners can delete any client, trainers only their own.
 */
export const deleteClient = async (
  requesterId: string,
  studioId: string,
  clientId: string,
) => {
  const membership = await getStudioStaffMembershipOrThrow(
    requesterId,
    studioId,
  );

  const { data: existingClient, error: existingClientError } =
    await supabaseAdmin
      .from('clients')
      .select('id, trainer_id')
      .eq('id', clientId)
      .eq('studio_id', studioId)
      .maybeSingle();

  if (existingClientError) {
    throw new ApiError(500, 'Failed to fetch client');
  }

  if (!existingClient) {
    throw new ApiError(404, 'Client not found');
  }

  if (
    membership.role === 'trainer' &&
    existingClient.trainer_id !== requesterId
  ) {
    throw new ApiError(403, 'You can only delete clients assigned to you');
  }

  const { error: deleteError } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('studio_id', studioId);

  if (deleteError) {
    throw new ApiError(500, 'Failed to delete client');
  }

  return {
    deleted: true,
    clientId,
  };
};