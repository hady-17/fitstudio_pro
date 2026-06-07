
// Import the ioredis library for Redis client functionality
import Redis from 'ioredis';
// Import environment variables
import { env } from '../config/env.js';
// Import the logger utility
import { logger } from './logger.js';


// Singleton instance for the Redis client
let redisClient: Redis | null = null;


// Returns a singleton Redis client instance
export const getRedisClient = (): Redis => {
  // If the client already exists, return it
  if (redisClient) {
    return redisClient;
  }


  // Create a new Redis client with configuration options
  redisClient = new Redis(env.REDIS_URL, {
    // Disable retry limit for requests
    maxRetriesPerRequest: null,
    // Disable ready check for faster startup
    enableReadyCheck: false,
  });


  // Log successful connection
  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });


  // Log connection errors
  redisClient.on('error', (error) => {
    logger.warn('Redis connection error', {
      message: error.message,
    });
  });


  // Return the Redis client instance
  return redisClient;
};