import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createClient,deleteClient,getClientById,listClients, updateClient } from './clients.service.js';

/**
 * Controller to handle creating a new client in a studio.
 * - Calls the service to create a client and returns the result.
 */
export const createClientController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const client = await createClient(req.user!.id, studioId, req.body);

    res.status(201).json({
      success: true,
      data: {
        client,
      },
    });
  },
);
/**
 * Controller to list all clients in a studio.
 * - Calls the service to fetch clients and returns the result.
 */
export const listClientsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId } = req.params;

    const clients = await listClients(req.user!.id, studioId, req.query);

    res.status(200).json({
      success: true,
      data: {
        clients,
      },
    });
  },
);
/**
 * Controller to get a client by ID in a studio.
 * - Calls the service to fetch a single client and returns the result.
 */
export const getClientByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, clientId } = req.params;

    const client = await getClientById(req.user!.id, studioId, clientId);

    res.status(200).json({
      success: true,
      data: {
        client,
      },
    });
  },
);
/**
 * Controller to update a client's details in a studio.
 * - Calls the service to update a client and returns the result.
 */
export const updateClientController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, clientId } = req.params;

    const client = await updateClient(
      req.user!.id,
      studioId,
      clientId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: {
        client,
      },
    });
  },
);
/**
 * Controller to delete a client from a studio.
 * - Calls the service to delete a client and returns the result.
 */
export const deleteClientController = asyncHandler(
  async (req: Request, res: Response) => {
    const { studioId, clientId } = req.params;

    const result = await deleteClient(req.user!.id, studioId, clientId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);