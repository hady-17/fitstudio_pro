import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createStudio,getMyStudios,getStudioById,getStudioMembers,updateStudio,addTrainerToStudio, deleteStudio, removeStudioMember } from './studios.service.js';

export const createStudioController = asyncHandler(
  async (req: Request, res: Response) => {
    const studio = await createStudio(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: {
        studio,
      },
    });
  },
);
export const getMyStudiosController = asyncHandler(
  async (req: Request, res: Response) => {
    const studios = await getMyStudios(req.user!.id);

    res.status(200).json({
      success: true,
      data: {
        studios,
      },
    });
  },
);

export const getStudioByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const studio = await getStudioById(req.user!.id, studioId);

    res.status(200).json({
      success: true,
      data: {
        studio,
      },
    });
  },
);
export const updateStudioController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const studio = await updateStudio(req.user!.id, studioId, req.body);

    res.status(200).json({
      success: true,
      data: {
        studio,
      },
    });
  },
);

export const getStudioMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const members = await getStudioMembers(req.user!.id, studioId);

    res.status(200).json({
      success: true,
      data: {
        members,
      },
    });
  },
);

export const addTrainerController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const member = await addTrainerToStudio(req.user!.id, studioId, req.body);

    res.status(201).json({
      success: true,
      data: {
        member,
      },
    });
  },
);

export const deleteStudioController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const result = await deleteStudio(req.user!.id, studioId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);
export const removeStudioMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, memberId } = req.params;

    const result = await removeStudioMember(req.user!.id, studioId, memberId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);