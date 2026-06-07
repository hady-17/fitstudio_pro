import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

// This middleware function validates the incoming request against a provided Zod schema.
export function validate(schema: AnyZodObject): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = formatZodError(result.error);

      return next(new ApiError(400, message));
    }

    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;

    return next();
  };
}

// This helper function formats Zod validation errors into a readable string format.
function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');

      if (!path) {
        return issue.message;
      }

      return `${path}: ${issue.message}`;
    })
    .join(', ');
}