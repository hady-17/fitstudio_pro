import { z } from 'zod';

export const createClientSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Client full name must be at least 2 characters')
      .max(100, 'Client full name must be at most 100 characters'),

    email: z
      .string()
      .trim()
      .email('Invalid client email')
      .toLowerCase()
      .optional(),

    trainerId: z.string().uuid('Invalid trainer id').optional(),

    status: z.enum(['active', 'paused', 'cancelled']).optional(),

    goal: z
      .string()
      .trim()
      .max(500, 'Goal must be at most 500 characters')
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be at most 1000 characters')
      .optional(),

    joinedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'joinedAt must be YYYY-MM-DD')
      .optional(),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];

export const listClientsSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  query: z.object({
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    search: z.string().trim().optional(),
  }),
});

export type ListClientsQuery = z.infer<typeof listClientsSchema>['query'];

export const getClientByIdSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    clientId: z.string().uuid('Invalid client id'),
  }),
});
export const updateClientSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    clientId: z.string().uuid('Invalid client id'),
  }),

  body: z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, 'Client full name must be at least 2 characters')
        .max(100, 'Client full name must be at most 100 characters')
        .optional(),

      email: z
        .string()
        .trim()
        .email('Invalid client email')
        .toLowerCase()
        .nullable()
        .optional(),

      trainerId: z.string().uuid('Invalid trainer id').optional(),

      status: z.enum(['active', 'paused', 'cancelled']).optional(),

      goal: z
        .string()
        .trim()
        .max(500, 'Goal must be at most 500 characters')
        .nullable()
        .optional(),

      notes: z
        .string()
        .trim()
        .max(1000, 'Notes must be at most 1000 characters')
        .nullable()
        .optional(),

      joinedAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'joinedAt must be YYYY-MM-DD')
        .optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];
export const deleteClientSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    clientId: z.string().uuid('Invalid client id'),
  }),
});