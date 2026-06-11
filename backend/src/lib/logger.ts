import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';

    return `[${timestamp}] ${level}: ${stack ?? message}${metaString}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',

  format: fileFormat,

  transports: [
    new winston.transports.Console({
      format: isProduction ? fileFormat : devConsoleFormat,
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],

  exceptionHandlers: [
    new winston.transports.Console({
      format: isProduction ? fileFormat : devConsoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],

  rejectionHandlers: [
    new winston.transports.Console({
      format: isProduction ? fileFormat : devConsoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});