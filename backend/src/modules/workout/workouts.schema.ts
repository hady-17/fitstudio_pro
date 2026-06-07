import { z } from 'zod';

export const createWorkoutPlanSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  body: z
    .object({
      clientId: z.string().uuid('Invalid client id'),

      title: z
        .string()
        .trim()
        .min(2, 'Workout plan title must be at least 2 characters')
        .max(150, 'Workout plan title must be at most 150 characters'),

      description: z
        .string()
        .trim()
        .max(1000, 'Description must be at most 1000 characters')
        .optional(),

      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD')
        .optional(),

      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD')
        .optional(),

      status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
    })
    .refine(
      (body) => {
        if (!body.startDate || !body.endDate) {
          return true;
        }

        return body.endDate >= body.startDate;
      },
      {
        message: 'endDate must be after or equal to startDate',
        path: ['endDate'],
      },
    ),
});

export type CreateWorkoutPlanInput = z.infer<
  typeof createWorkoutPlanSchema
>['body'];
export const getWorkoutPlanByIdSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
  }),
});

export const createWorkoutDaySchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
  }),

  body: z.object({
    dayNumber: z
      .number()
      .int('dayNumber must be an integer')
      .min(1, 'dayNumber must be at least 1')
      .max(7, 'A workout plan can only have days 1 to 7'),

    title: z
      .string()
      .trim()
      .min(2, 'Workout day title must be at least 2 characters')
      .max(100, 'Workout day title must be at most 100 characters'),

    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be at most 1000 characters')
      .optional(),
  }),
});

export type CreateWorkoutDayInput = z.infer<
  typeof createWorkoutDaySchema
>['body'];

export const createWorkoutItemSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
    dayId: z.string().uuid('Invalid workout day id'),
  }),

  body: z.object({
    exerciseId: z.string().uuid('Invalid exercise id'),

    sets: z
      .number()
      .int('Sets must be an integer')
      .min(1, 'Sets must be at least 1')
      .max(20, 'Sets must be at most 20')
      .optional(),

    reps: z
      .string()
      .trim()
      .max(50, 'Reps must be at most 50 characters')
      .optional(),

    targetWeight: z
      .string()
      .trim()
      .max(50, 'Target weight must be at most 50 characters')
      .optional(),

    restSeconds: z
      .number()
      .int('Rest seconds must be an integer')
      .min(0, 'Rest seconds cannot be negative')
      .max(3600, 'Rest seconds must be at most 3600')
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be at most 1000 characters')
      .optional(),
  }),
});

export type CreateWorkoutItemInput = z.infer<
  typeof createWorkoutItemSchema
>['body'];

export const listWorkoutPlansSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  query: z
    .object({
      trainerId: z.string().uuid('Invalid trainer id').optional(),
      clientId: z.string().uuid('Invalid client id').optional(),
      status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
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
      search: z.string().trim().max(100).optional(),
    })
    .optional(),
});

export type ListWorkoutPlansQuery = z.infer<
  typeof listWorkoutPlansSchema
>['query'];

export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>['body'];
export type UpdateWorkoutDayInput = z.infer<typeof updateWorkoutDaySchema>['body'];
export type UpdateWorkoutItemInput = z.infer<typeof updateWorkoutItemSchema>['body'];

export const updateWorkoutPlanSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
  }),

  body: z
    .object({
      title: z.string().trim().min(2).max(150).optional(),
      description: z.string().trim().max(1000).optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
    })
    .refine(
      (body) => {
        if (!body.startDate || !body.endDate) return true;
        return body.endDate >= body.startDate;
      },
      { message: 'endDate must be after or equal to startDate', path: ['endDate'] },
    ),
});

export const updateWorkoutDaySchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
    dayId: z.string().uuid('Invalid workout day id'),
  }),

  body: z.object({
      dayNumber: z.number().int().min(1).max(7).optional(),
      title: z.string().trim().min(2).max(100).optional(),
      notes: z.string().trim().max(1000).optional(),
    }),
});

export const updateWorkoutItemSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    planId: z.string().uuid('Invalid workout plan id'),
    dayId: z.string().uuid('Invalid workout day id'),
    itemId: z.string().uuid('Invalid workout item id'),
  }),

  body: z.object({
      sets: z.number().int().min(1).max(20).optional(),
      reps: z.string().trim().max(50).optional(),
      targetWeight: z.string().trim().max(50).optional(),
      restSeconds: z.number().int().min(0).max(3600).optional(),
      notes: z.string().trim().max(1000).optional(),
    }),
});

export const createWorkoutLogSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Invalid client id'),
  }),

  body: z.object({
    workoutDayId: z.string().uuid('Invalid workout day id'),

    completedAt: z
      .string()
      .datetime({ message: 'completedAt must be a valid ISO 8601 datetime' })
      .optional(),

    difficultyRating: z
      .number()
      .int('difficultyRating must be an integer')
      .min(1, 'difficultyRating must be between 1 and 10')
      .max(10, 'difficultyRating must be between 1 and 10')
      .optional(),

    feedback: z
      .string()
      .trim()
      .max(1000, 'feedback must be at most 1000 characters')
      .optional(),
  }),
});

export type CreateWorkoutLogInput = z.infer<typeof createWorkoutLogSchema>['body'];

export const listWorkoutLogsSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Invalid client id'),
  }),

  query: z
    .object({
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

export type ListWorkoutLogsQuery = z.infer<typeof listWorkoutLogsSchema>['query'];
