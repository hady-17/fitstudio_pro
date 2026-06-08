import { z } from 'zod';

export const listNotificationsSchema = z.object({
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
      unreadOnly: z
        .enum(['true', 'false'])
        .optional()
        .transform((s) => s === 'true'),
    })
    .optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>['query'];

export const markNotificationReadSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid('Invalid notification id'),
  }),
});
