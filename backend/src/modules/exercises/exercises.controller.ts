import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listExercises } from './exercises.service.js';

export const listExercisesController = asyncHandler(
  async (req: Request, res: Response) => {
    const exercises = await listExercises(req.query);

    res.status(200).json({
      success: true,
      data: {
        exercises,
      },
    });
  },
);