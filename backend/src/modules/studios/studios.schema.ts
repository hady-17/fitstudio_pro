import { z } from 'zod';

export const createStudioSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Studio name must be at least 2 characters')
      .max(100, 'Studio name must be at most 100 characters'),

    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .max(50, 'Slug must be at most 50 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      ),

    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
  }),
});

export type CreateStudioInput = z.infer<
  typeof createStudioSchema
>['body'];

export const getStudioByIdSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),
});

export type GetStudioByIdParams = z.infer<
  typeof getStudioByIdSchema
>['params'];
export const updateStudioSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Studio name must be at least 2 characters')
        .max(100, 'Studio name must be at most 100 characters')
        .optional(),

      slug: z
        .string()
        .trim()
        .min(2, 'Slug must be at least 2 characters')
        .max(50, 'Slug must be at most 50 characters')
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          'Slug must contain only lowercase letters, numbers, and hyphens',
        )
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, 'Description must be at most 500 characters')
        .nullable()
        .optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export type UpdateStudioInput = z.infer<typeof updateStudioSchema>['body'];
export const getStudioMembersSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),
});

export const addtrainerSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
  }),
});
export type AddTrainerInput = z.infer<typeof addtrainerSchema>['body'];

export const deleteStudioSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),
});

export const removeStudioMemberSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
    memberId: z.string().uuid('Invalid member id'),
  }),
});