import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type { Json } from '../../types/database.types.js';
import type {
  ListUsersQuery,
  UpdateUserRoleBody,
  ListStudiosQuery,
  ListClientsQuery,
  UpdateClientStatusBody,
  CreateExerciseBody,
  UpdateExerciseBody,
  ListPaymentsQuery,
  ListAuditLogsQuery,
} from './admin.schema.js';

const logAdminAction = async (
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  studioId?: string,
  metadata?: Record<string, unknown>,
) => {
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: actorId,
    studio_id: studioId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as unknown as Json,
  });
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getSystemStats = async () => {
  const [
    { count: totalUsers },
    { count: totalStudios },
    { count: totalClients },
    { count: totalSessions },
    { count: totalPayments },
    { data: revenueData },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('studios').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('amount').eq('status', 'paid'),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newUsersThisWeek } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo);

  return {
    totalUsers: totalUsers ?? 0,
    totalStudios: totalStudios ?? 0,
    totalClients: totalClients ?? 0,
    totalSessions: totalSessions ?? 0,
    totalPayments: totalPayments ?? 0,
    totalRevenue,
    newUsersThisWeek: newUsersThisWeek ?? 0,
  };
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, search, role } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, global_role, avatar_url, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    req = req.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role) {
    req = req.eq('global_role', role);
  }

  const { data, error, count } = await req;

  if (error) throw new ApiError(500, 'Failed to fetch users');

  return { users: data ?? [], total: count ?? 0, page, limit };
};

export const updateUserRole = async (
  adminId: string,
  userId: string,
  body: UpdateUserRoleBody,
) => {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, global_role')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch user');
  if (!existing) throw new ApiError(404, 'User not found');
  if (userId === adminId) throw new ApiError(400, 'Cannot change your own role');

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ global_role: body.global_role })
    .eq('id', userId);

  if (error) throw new ApiError(500, 'Failed to update user role');

  await logAdminAction(adminId, 'UPDATE_USER_ROLE', 'user', userId, undefined, {
    from: existing.global_role,
    to: body.global_role,
  });

  return { userId, global_role: body.global_role };
};

// ─── Studios ─────────────────────────────────────────────────────────────────

export const listStudios = async (query: ListStudiosQuery) => {
  const { page, limit, search } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabaseAdmin
    .from('studios')
    .select(
      `id, name, slug, description, owner_id, created_at,
       profiles!studios_owner_id_fkey(full_name, email)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    req = req.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await req;

  if (error) throw new ApiError(500, 'Failed to fetch studios');

  const studioIds = (data ?? []).map((s) => s.id);

  const [{ data: memberCounts }, { data: clientCounts }] = await Promise.all([
    supabaseAdmin
      .from('studio_members')
      .select('studio_id')
      .in('studio_id', studioIds.length > 0 ? studioIds : ['00000000-0000-0000-0000-000000000000']),
    supabaseAdmin
      .from('clients')
      .select('studio_id')
      .in('studio_id', studioIds.length > 0 ? studioIds : ['00000000-0000-0000-0000-000000000000']),
  ]);

  const memberCountMap: Record<string, number> = {};
  const clientCountMap: Record<string, number> = {};

  for (const row of memberCounts ?? []) {
    memberCountMap[row.studio_id] = (memberCountMap[row.studio_id] ?? 0) + 1;
  }
  for (const row of clientCounts ?? []) {
    clientCountMap[row.studio_id] = (clientCountMap[row.studio_id] ?? 0) + 1;
  }

  const studios = (data ?? []).map((s) => ({
    ...s,
    member_count: memberCountMap[s.id] ?? 0,
    client_count: clientCountMap[s.id] ?? 0,
  }));

  return { studios, total: count ?? 0, page, limit };
};

export const deleteStudio = async (adminId: string, studioId: string) => {
  const { data: studio, error: fetchError } = await supabaseAdmin
    .from('studios')
    .select('id, name')
    .eq('id', studioId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch studio');
  if (!studio) throw new ApiError(404, 'Studio not found');

  const { error } = await supabaseAdmin.from('studios').delete().eq('id', studioId);

  if (error) throw new ApiError(500, 'Failed to delete studio');

  await logAdminAction(adminId, 'DELETE_STUDIO', 'studio', studioId, undefined, {
    name: studio.name,
  });
};

// ─── Clients ─────────────────────────────────────────────────────────────────

export const listAllClients = async (query: ListClientsQuery) => {
  const { page, limit, search, status, studioId } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabaseAdmin
    .from('clients')
    .select(
      `id, full_name, email, status, goal, joined_at, studio_id,
       studios(name),
       profiles!clients_trainer_id_fkey(full_name)`,
      { count: 'exact' },
    )
    .order('joined_at', { ascending: false })
    .range(from, to);

  if (search) {
    req = req.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status) {
    req = req.eq('status', status);
  }
  if (studioId) {
    req = req.eq('studio_id', studioId);
  }

  const { data, error, count } = await req;

  if (error) throw new ApiError(500, 'Failed to fetch clients');

  return { clients: data ?? [], total: count ?? 0, page, limit };
};

export const updateClientStatus = async (
  adminId: string,
  clientId: string,
  body: UpdateClientStatusBody,
) => {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('id, status, studio_id')
    .eq('id', clientId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch client');
  if (!existing) throw new ApiError(404, 'Client not found');

  const { error } = await supabaseAdmin
    .from('clients')
    .update({ status: body.status })
    .eq('id', clientId);

  if (error) throw new ApiError(500, 'Failed to update client status');

  await logAdminAction(adminId, 'UPDATE_CLIENT_STATUS', 'client', clientId, existing.studio_id, {
    from: existing.status,
    to: body.status,
  });

  return { clientId, status: body.status };
};

// ─── Reset Password ──────────────────────────────────────────────────────────

export const resetUserPassword = async (adminId: string, userId: string) => {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch user');
  if (!profile) throw new ApiError(404, 'User not found');
  if (userId === adminId) throw new ApiError(400, 'Cannot reset your own password this way');

  const defaultPassword =
    profile.full_name.trim().toLowerCase().replace(/\s+/g, '') + '123@@';

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: defaultPassword,
  });

  if (error) throw new ApiError(500, 'Failed to reset password');

  await logAdminAction(adminId, 'RESET_USER_PASSWORD', 'user', userId, undefined, {
    full_name: profile.full_name,
  });

  return { defaultPassword };
};

// ─── Exercises ───────────────────────────────────────────────────────────────

export const createExercise = async (adminId: string, body: CreateExerciseBody) => {
  const { data, error } = await supabaseAdmin
    .from('exercises')
    .insert({
      name: body.name,
      muscle_group: body.muscle_group ?? null,
      equipment: body.equipment ?? null,
      difficulty: body.difficulty ?? null,
    })
    .select('id, name, muscle_group, equipment, difficulty')
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'An exercise with this name already exists');
    throw new ApiError(500, 'Failed to create exercise');
  }

  await logAdminAction(adminId, 'CREATE_EXERCISE', 'exercise', data.id, undefined, {
    name: body.name,
  });

  return data;
};

export const updateExercise = async (
  adminId: string,
  exerciseId: string,
  body: UpdateExerciseBody,
) => {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('exercises')
    .select('id')
    .eq('id', exerciseId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch exercise');
  if (!existing) throw new ApiError(404, 'Exercise not found');

  const updates: {
    name?: string;
    muscle_group?: string | null;
    equipment?: string | null;
    difficulty?: string | null;
  } = {};
  if (body.name !== undefined) updates.name = body.name;
  if ('muscle_group' in body) updates.muscle_group = body.muscle_group ?? null;
  if ('equipment' in body) updates.equipment = body.equipment ?? null;
  if ('difficulty' in body) updates.difficulty = body.difficulty ?? null;

  const { data, error } = await supabaseAdmin
    .from('exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select('id, name, muscle_group, equipment, difficulty')
    .single();

  if (error) throw new ApiError(500, 'Failed to update exercise');

  await logAdminAction(adminId, 'UPDATE_EXERCISE', 'exercise', exerciseId, undefined, updates);

  return data;
};

export const deleteExercise = async (adminId: string, exerciseId: string) => {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('exercises')
    .select('id, name')
    .eq('id', exerciseId)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch exercise');
  if (!existing) throw new ApiError(404, 'Exercise not found');

  const { error } = await supabaseAdmin.from('exercises').delete().eq('id', exerciseId);

  if (error) throw new ApiError(500, 'Failed to delete exercise');

  await logAdminAction(adminId, 'DELETE_EXERCISE', 'exercise', exerciseId, undefined, {
    name: existing.name,
  });
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const listPayments = async (query: ListPaymentsQuery) => {
  const { page, limit, status } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabaseAdmin
    .from('payments')
    .select(
      `id, amount, status, paid_at, created_at,
       clients(id, full_name, email, studio_id, studios(name))`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    req = req.eq('status', status);
  }

  const { data, error, count } = await req;

  if (error) throw new ApiError(500, 'Failed to fetch payments');

  return { payments: data ?? [], total: count ?? 0, page, limit };
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const listAuditLogs = async (query: ListAuditLogsQuery) => {
  const { page, limit, action, entityType, actorId } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabaseAdmin
    .from('audit_logs')
    .select(
      `id, action, entity_type, entity_id, studio_id, metadata, created_at,
       profiles!audit_logs_actor_id_fkey(id, full_name, email)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (action) {
    req = req.ilike('action', `%${action}%`);
  }
  if (entityType) {
    req = req.eq('entity_type', entityType);
  }
  if (actorId) {
    req = req.eq('actor_id', actorId);
  }

  const { data, error, count } = await req;

  if (error) throw new ApiError(500, 'Failed to fetch audit logs');

  return { logs: data ?? [], total: count ?? 0, page, limit };
};
