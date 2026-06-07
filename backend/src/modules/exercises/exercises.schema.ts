import { z } from 'zod';

export const listExercisesSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),

    muscleGroup: z.string().trim().optional(),

    equipment: z.string().trim().optional(),

    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
});

export type ListExercisesQuery = z.infer<typeof listExercisesSchema>['query'];