import morgan from 'morgan';
import { logger } from '../lib/logger';

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export const requestLoggerMiddleware = morgan(
  ':method :url :status :response-time ms',
  { stream },
);