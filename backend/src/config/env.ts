import 'dotenv/config';
import { z } from 'zod';

// Validate environment variables at startup
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().positive().default(4000),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
});

export const env = envSchema.parse(process.env);