import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: redisUrl
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async () => {
  await redis.connect();
};
