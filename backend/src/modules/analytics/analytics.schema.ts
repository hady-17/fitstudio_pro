import { z } from 'zod';

export const getStudioOverviewSchema = z.object({
  params: z.object({
    studioId: z.string().uuid('Invalid studio id'),
  }),
});
