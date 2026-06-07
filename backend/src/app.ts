import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorMiddleware } from '../src/middleware/error.middleware';
import { notFoundMiddleware } from '../src/middleware/notFound.middleware';
import authRoutes from './modules/auth/auth.routes';
import helmet from 'helmet';
import {requestLoggerMiddleware} from "./middleware/requestLogger.middleware";
import studioRoutes from './modules/studios/studios.routes.js';
import clientRoutes from './modules/clients/clients.routes.js';
import exerciseRoutes from './modules/exercises/exercises.routes.js';
import workoutRoutes from './modules/workout/workouts.routes.js';
import workoutLogRoutes from './modules/workout/workout-logs.routes.js';
import { studioSessionsRouter, sessionRouter } from './modules/sessions/sessions.routes.js';
import { checkInsRouter, measurementsRouter, progressRouter } from './modules/checkins/checkins.routes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);
// Security headers
app.use(helmet());
// Body parsing
app.use(express.json());
// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(requestLoggerMiddleware);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/studios/:studioId/clients', clientRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/studios/:studioId/workout-plans', workoutRoutes);
/**
 * Note: workout logs are accessed via client routes, not studio routes, since they are more client-centric. The route is defined in the client routes file, but the controller functions are defined in the workout logs service file for better organization.
 */
app.use('/api/clients/:clientId/workout-logs', workoutLogRoutes);
app.use('/api/studios/:studioId/sessions', studioSessionsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/clients/:clientId/check-ins', checkInsRouter);
app.use('/api/clients/:clientId/measurements', measurementsRouter);
app.use('/api/clients/:clientId/progress', progressRouter);
// Not found middleware
app.use(notFoundMiddleware);

// Error handling middleware
app.use(errorMiddleware);

export default app;