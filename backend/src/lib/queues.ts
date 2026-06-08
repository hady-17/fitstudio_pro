import { Queue } from 'bullmq';
import { getRedisClient } from './redis.js';

export const QUEUE_NAMES = {
  REMINDERS: 'reminders',
  WEEKLY_SUMMARIES: 'weekly-summaries',
  EMAILS: 'emails',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

export const getQueue = (name: QueueName): Queue => {
  const existing = queues.get(name);

  if (existing) {
    return existing;
  }

  const queue = new Queue(name, { connection: getRedisClient() });
  queues.set(name, queue);

  return queue;
};
