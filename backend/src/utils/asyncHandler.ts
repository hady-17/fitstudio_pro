import type { Request, Response, NextFunction, RequestHandler } from 'express';
// This utility function wraps an asynchronous route handler and ensures
//  that any errors are properly caught and passed to the next middleware (error handler).
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// The asyncHandler function takes an asynchronous route handler (fn)
//  and returns a new function that wraps the original handler in a Promise.  
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}