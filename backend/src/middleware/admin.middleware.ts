import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../utils/ApiError.js';

export const adminMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('global_role')
    .eq('id', req.user.id)
    .single();

  if (error || !profile) {
    return next(new ApiError(403, 'Access denied'));
  }

  if (profile.global_role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }

  return next();
};
