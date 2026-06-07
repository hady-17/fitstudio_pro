import { z } from 'zod';

export const createCheckInSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Invalid client id'),
  }),

  body: z
    .object({
      weight: z.number().positive('weight must be greater than 0').optional(),

      mood: z
        .number()
        .int('mood must be an integer')
        .min(1, 'mood must be between 1 and 10')
        .max(10, 'mood must be between 1 and 10')
        .optional(),

      energyLevel: z
        .number()
        .int('energyLevel must be an integer')
        .min(1, 'energyLevel must be between 1 and 10')
        .max(10, 'energyLevel must be between 1 and 10')
        .optional(),

      sleepHours: z
        .number()
        .min(0, 'sleepHours must be 0 or greater')
        .optional(),

      notes: z
        .string()
        .trim()
        .max(1000, 'notes must be at most 1000 characters')
        .optional(),
    })
    .refine(
      (body) =>
        body.weight !== undefined ||
        body.mood !== undefined ||
        body.energyLevel !== undefined ||
        body.sleepHours !== undefined ||
        body.notes !== undefined,
      { message: 'At least one field must be provided' },
    ),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>['body'];

export const listCheckInsSchema = z.object({
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

export type ListCheckInsQuery = z.infer<typeof listCheckInsSchema>['query'];

export const createMeasurementSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Invalid client id'),
  }),

  body: z
    .object({
      weight: z.number().positive('weight must be greater than 0').optional(),
      waist: z.number().positive('waist must be greater than 0').optional(),
      chest: z.number().positive('chest must be greater than 0').optional(),
      arms: z.number().positive('arms must be greater than 0').optional(),
      legs: z.number().positive('legs must be greater than 0').optional(),
    })
    .refine(
      (body) =>
        body.weight !== undefined ||
        body.waist !== undefined ||
        body.chest !== undefined ||
        body.arms !== undefined ||
        body.legs !== undefined,
      { message: 'At least one measurement must be provided' },
    ),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>['body'];

export const listMeasurementsSchema = z.object({
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

export type ListMeasurementsQuery = z.infer<typeof listMeasurementsSchema>['query'];

export const getProgressTrendSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Invalid client id'),
  }),
});
