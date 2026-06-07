import type { User } from '@supabase/supabase-js';

// This file extends the Express Request interface to include custom properties
//  for user authentication and access token management.
declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}

export {};