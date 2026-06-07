import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const isApiError = error instanceof ApiError;

  const statusCode = isApiError ? error.statusCode : 500;

  const message =
    isApiError && error.message
      ? error.message
      : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(message, {
      method: req.method,
      path: req.originalUrl,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn(message, {
      method: req.method,
      path: req.originalUrl,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' &&
        statusCode >= 500 && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
    },
  });
};