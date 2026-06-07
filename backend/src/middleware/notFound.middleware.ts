import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

// This middleware function handles requests to routes that are not defined in the application.
export function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}