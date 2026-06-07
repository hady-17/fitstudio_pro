import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';

export async function getCurrentUserData(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new ApiError(404, 'Profile not found');
  }

  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from('studio_members')
    .select('*')
    .eq('user_id', userId);

  if (membershipsError) {
    throw new ApiError(500, 'Failed to load studio memberships');
  }

  return {
    profile,
    memberships: memberships ?? [],
  };
}

export const linkClientProfile = async (userId: string) => {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, 'Failed to load user profile');
  }

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  if (!profile.email) {
    throw new ApiError(400, 'Profile email is required to link client profile');
  }

  const { data: matchingClients, error: clientsError } = await supabaseAdmin
    .from('clients')
    .select('id, studio_id, email, user_id')
    .eq('email', profile.email)
    .is('user_id', null);

  if (clientsError) {
    throw new ApiError(500, 'Failed to find matching client records');
  }

  if (!matchingClients || matchingClients.length === 0) {
    return {
      linked: false,
      clients: [],
    };
  }

  const linkedClients = [];

  for (const client of matchingClients) {
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', client.id)
      .is('user_id', null)
      .select('*')
      .single();

    if (updateError || !updatedClient) {
      throw new ApiError(500, 'Failed to link client record');
    }

    const { data: existingMembership, error: membershipCheckError } =
      await supabaseAdmin
        .from('studio_members')
        .select('id')
        .eq('studio_id', client.studio_id)
        .eq('user_id', userId)
        .maybeSingle();

    if (membershipCheckError) {
      throw new ApiError(500, 'Failed to check studio membership');
    }

    if (!existingMembership) {
      const { error: membershipError } = await supabaseAdmin
        .from('studio_members')
        .insert({
          studio_id: client.studio_id,
          user_id: userId,
          role: 'client',
        });

      if (membershipError) {
        throw new ApiError(500, 'Failed to create client studio membership');
      }
    }

    linkedClients.push(updatedClient);
  }

  return {
    linked: true,
    clients: linkedClients,
  };
};