import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CreateStudioInput, UpdateStudioInput,AddTrainerInput } from './studios.schema.js';

export const createStudio = async (
  userId: string,
  input: CreateStudioInput,
) => {
  const { name, slug, description } = input;

  const { data: existingOwnedStudio, error: existingOwnedStudioError } =
    await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

  if (existingOwnedStudioError) {
    throw new ApiError(500, 'Failed to check existing studios');
  }

  if (existingOwnedStudio) {
    throw new ApiError(409, 'User already owns a studio');
  }

  const { data: existingSlug, error: existingSlugError } = await supabaseAdmin
    .from('studios')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingSlugError) {
    throw new ApiError(500, 'Failed to check studio slug');
  }

  if (existingSlug) {
    throw new ApiError(409, 'Studio slug is already taken');
  }

  const { data: studio, error: studioError } = await supabaseAdmin
    .from('studios')
    .insert({
      owner_id: userId,
      name,
      slug,
      description: description ?? null,
    })
    .select('*')
    .single();

  if (studioError || !studio) {
    throw new ApiError(500, 'Failed to create studio');
  }

  const { error: memberError } = await supabaseAdmin
    .from('studio_members')
    .insert({
      studio_id: studio.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    throw new ApiError(500, 'Failed to create studio owner membership');
  }

  return studio;
};
export const getMyStudios = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('studio_members')
    .select(
      `
      id,
      role,
      created_at,
      studio:studios (
        id,
        name,
        slug,
        description,
        owner_id,
        created_at,
        updated_at
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ApiError(500, 'Failed to fetch user studios');
  }

  return data;
};
export const getStudioById = async (userId: string, studioId: string) => {
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('studio_members')
    .select(
      `
      id,
      role,
      studio:studios (
        id,
        owner_id,
        name,
        slug,
        description,
        created_at,
        updated_at
      )
    `,
    )
    .eq('user_id', userId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (membershipError) {
    throw new ApiError(500, 'Failed to check studio access');
  }

  if (!membership) {
    throw new ApiError(403, 'You do not have access to this studio');
  }

  return membership;
};
export const updateStudio = async (
  userId: string,
  studioId: string,
  input: UpdateStudioInput,
) => {
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('studio_members')
    .select('role')
    .eq('user_id', userId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (membershipError) {
    throw new ApiError(500, 'Failed to check studio permissions');
  }

  if (!membership) {
    throw new ApiError(403, 'You do not have access to this studio');
  }

  if (membership.role !== 'owner') {
    throw new ApiError(403, 'Only studio owners can update this studio');
  }

  if (input.slug) {
    const { data: existingSlug, error: existingSlugError } = await supabaseAdmin
      .from('studios')
      .select('id')
      .eq('slug', input.slug)
      .neq('id', studioId)
      .maybeSingle();

    if (existingSlugError) {
      throw new ApiError(500, 'Failed to check studio slug');
    }

    if (existingSlug) {
      throw new ApiError(409, 'Studio slug is already taken');
    }
  }

  const { data: studio, error: updateError } = await supabaseAdmin
    .from('studios')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId)
    .select('*')
    .single();

  if (updateError || !studio) {
    throw new ApiError(500, 'Failed to update studio');
  }

  return studio;
};

export const getStudioMembers = async (userId: string, studioId: string) => {
  const { data: requesterMembership, error: requesterMembershipError } =
    await supabaseAdmin
      .from('studio_members')
      .select('id, role')
      .eq('user_id', userId)
      .eq('studio_id', studioId)
      .maybeSingle();

  if (requesterMembershipError) {
    throw new ApiError(500, 'Failed to check studio access');
  }

  if (!requesterMembership) {
    throw new ApiError(403, 'You do not have access to this studio');
  }

  const { data: members, error: membersError } = await supabaseAdmin
    .from('studio_members')
    .select(
      `
      id,
      role,
      created_at,
      profile:profiles (
        id,
        full_name,
        avatar_url,
        global_role,
        created_at
      )
    `,
    )
    .eq('studio_id', studioId)
    .order('created_at', { ascending: true });

  if (membersError) {
    throw new ApiError(500, 'Failed to fetch studio members');
  }

  return members;
};

export const addTrainerToStudio = async (
  requesterId: string,
  studioId: string,
  input: AddTrainerInput,
) => {
  const { data: requesterMembership, error: requesterMembershipError } =
    await supabaseAdmin
      .from('studio_members')
      .select('role')
      .eq('user_id', requesterId)
      .eq('studio_id', studioId)
      .maybeSingle();

  if (requesterMembershipError) {
    throw new ApiError(500, 'Failed to check studio permissions');
  }

  if (!requesterMembership) {
    throw new ApiError(403, 'You do not have access to this studio');
  }

  if (requesterMembership.role !== 'owner') {
    throw new ApiError(403, 'Only studio owners can add trainers');
  }

  const { data: trainerProfile, error: trainerProfileError } =
    await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('email', input.email)
      .maybeSingle();

  if (trainerProfileError) {
    throw new ApiError(500, 'Failed to find trainer profile');
  }

  if (!trainerProfile) {
    throw new ApiError(404, 'No registered user found with this email');
  }

  if (trainerProfile.id === requesterId) {
    throw new ApiError(400, 'Studio owner is already a member');
  }

  const { data: existingMember, error: existingMemberError } =
    await supabaseAdmin
      .from('studio_members')
      .select('id, role')
      .eq('studio_id', studioId)
      .eq('user_id', trainerProfile.id)
      .maybeSingle();

  if (existingMemberError) {
    throw new ApiError(500, 'Failed to check existing studio member');
  }

  if (existingMember) {
    throw new ApiError(
      409,
      `User is already a studio member with role: ${existingMember.role}`,
    );
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from('studio_members')
    .insert({
      studio_id: studioId,
      user_id: trainerProfile.id,
      role: 'trainer',
    })
    .select(
      `
      id,
      role,
      created_at,
      profile:profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .single();

  if (memberError || !member) {
    throw new ApiError(500, 'Failed to add trainer to studio');
  }

  return member;
};

const getOwnerMembershipOrThrow = async (userId: string, studioId: string) => {
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

  if (membership.role !== 'owner') {
    throw new ApiError(403, 'Only studio owners can perform this action');
  }

  return membership;
};

export const deleteStudio = async (userId: string, studioId: string) => {
  await getOwnerMembershipOrThrow(userId, studioId);

  const { error } = await supabaseAdmin
    .from('studios')
    .delete()
    .eq('id', studioId)
    .eq('owner_id', userId);

  if (error) {
    throw new ApiError(500, 'Failed to delete studio');
  }

  return {
    deleted: true,
    studioId,
  };
};
export const removeStudioMember = async (
  requesterId: string,
  studioId: string,
  memberId: string,
) => {
  await getOwnerMembershipOrThrow(requesterId, studioId);

  const { data: targetMember, error: targetMemberError } = await supabaseAdmin
    .from('studio_members')
    .select('id, user_id, role, studio_id')
    .eq('id', memberId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (targetMemberError) {
    throw new ApiError(500, 'Failed to find studio member');
  }

  if (!targetMember) {
    throw new ApiError(404, 'Studio member not found');
  }

  if (targetMember.user_id === requesterId) {
    throw new ApiError(400, 'Studio owner cannot remove themselves');
  }

  if (targetMember.role === 'owner') {
    throw new ApiError(400, 'Cannot remove studio owner');
  }

  const { error: deleteError } = await supabaseAdmin
    .from('studio_members')
    .delete()
    .eq('id', memberId)
    .eq('studio_id', studioId);

  if (deleteError) {
    throw new ApiError(500, 'Failed to remove studio member');
  }

  return {
    removed: true,
    memberId,
  };
};