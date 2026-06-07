import { z } from 'zod';

export const createSessionSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  body: z
    .object({
      trainerId: z.string().uuid('Invalid trainer id'),

      clientId: z.string().uuid('Invalid client id'),

      startTime: z
        .string()
        .datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),

      endTime: z
        .string()
        .datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),

      notes: z
        .string()
        .trim()
        .max(1000, 'Notes must be at most 1000 characters')
        .optional(),
    })
    .refine((body) => body.endTime > body.startTime, {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];

export const listSessionsSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  query: z
    .object({
      trainerId: z.string().uuid('Invalid trainer id').optional(),
      clientId: z.string().uuid('Invalid client id').optional(),
      status: z
        .enum(['scheduled', 'completed', 'cancelled', 'no_show'])
        .optional(),
      dateFrom: z
        .string()
        .datetime({ message: 'dateFrom must be a valid ISO 8601 datetime' })
        .optional(),
      dateTo: z
        .string()
        .datetime({ message: 'dateTo must be a valid ISO 8601 datetime' })
        .optional(),
      limit: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((s) => Number(s))
        .optional(),
      offset: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((s) => Number(s))
        .optional(),
    })
    .optional(),
});

export type ListSessionsQuery = z.infer<typeof listSessionsSchema>['query'];

export const updateSessionStatusSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session id'),
  }),

  body: z.object({
    status: z.enum(['completed', 'cancelled', 'no_show'], {
      errorMap: () => ({
        message: 'status must be one of: completed, cancelled, no_show',
      }),
    }),
  }),
});

export type UpdateSessionStatusInput = z.infer<
  typeof updateSessionStatusSchema
>['body'];
