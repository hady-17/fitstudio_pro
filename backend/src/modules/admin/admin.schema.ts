import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({ global_role: z.enum(['user', 'admin']) }),
});

export const listStudiosSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export const studioIdParamSchema = z.object({
  params: z.object({ studioId: z.string().uuid() }),
});

export const listClientsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    studioId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export const updateClientStatusSchema = z.object({
  params: z.object({ clientId: z.string().uuid() }),
  body: z.object({ status: z.enum(['active', 'paused', 'cancelled']) }),
});

export const createExerciseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(255),
    muscle_group: z.string().trim().optional(),
    equipment: z.string().trim().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
});

export const updateExerciseSchema = z.object({
  params: z.object({ exerciseId: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    muscle_group: z.string().trim().nullable().optional(),
    equipment: z.string().trim().nullable().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  }),
});

export const exerciseIdParamSchema = z.object({
  params: z.object({ exerciseId: z.string().uuid() }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'paid', 'failed']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export const resetUserPasswordSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
});

export const listAuditLogsSchema = z.object({
  query: z.object({
    action: z.string().trim().optional(),
    entityType: z.string().trim().optional(),
    actorId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>['body'];
export type ListStudiosQuery = z.infer<typeof listStudiosSchema>['query'];
export type ListClientsQuery = z.infer<typeof listClientsSchema>['query'];
export type UpdateClientStatusBody = z.infer<typeof updateClientStatusSchema>['body'];
export type CreateExerciseBody = z.infer<typeof createExerciseSchema>['body'];
export type UpdateExerciseBody = z.infer<typeof updateExerciseSchema>['body'];
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>['query'];
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>['query'];
