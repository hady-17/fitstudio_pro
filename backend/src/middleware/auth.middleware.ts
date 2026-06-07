import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../utils/ApiError.js';

// This middleware function checks for a valid Bearer token in the Authorization header,
//  verifies it with Supabase, and attaches the authenticated user to the request object.
// If the token is missing, invalid, or expired, it responds with a 401 Unauthorized error.
// The authMiddleware function is designed to be used in routes that require authentication.
export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid authorization header'));
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return next(new ApiError(401, 'Missing access token'));
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }

  req.user = data.user;
  req.accessToken = token;

  return next();
};