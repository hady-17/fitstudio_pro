jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
} from '../../src/modules/clients/clients.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const OWNER = 'owner-0000-0000-0000-000000000001';
const TRAINER = 'trainer-00-0000-0000-000000000002';
const TRAINER2 = 'trainer-00-0000-0000-000000000009';
const STUDIO_ID = 'studio-000-0000-0000-000000000003';
const CLIENT_ID = 'client-000-0000-0000-000000000004';

const ownerMembership = { id: 'mem-1', role: 'owner' };
const trainerMembership = { id: 'mem-2', role: 'trainer' };

const mockClient = {
  id: CLIENT_ID,
  studio_id: STUDIO_ID,
  user_id: null,
  trainer_id: TRAINER,
  full_name: 'Alice Smith',
  email: 'alice@example.com',
  status: 'active',
  goal: null,
  notes: null,
  joined_at: '2026-01-01',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const createInput = {
  fullName: 'Alice Smith',
  email: 'alice@example.com',
};

// ── createClient ──────────────────────────────────────────────────────────────
describe('createClient', () => {
  it('owner creates a client with no linked profile', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))    // staff membership
      .mockReturnValueOnce(qb({ data: ownerMembership }))    // verifyTrainer (owner = trainer)
      .mockReturnValueOnce(qb({ data: [] }))                 // email uniqueness (no conflict)
      .mockReturnValueOnce(qb({ data: null }))               // profile lookup (none found)
      .mockReturnValueOnce(qb({ data: mockClient }));        // insert client

    const result = await createClient(OWNER, STUDIO_ID, createInput);

    expect(result).toEqual(mockClient);
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('owner creates a client and links an existing user profile', async () => {
    const profile = { id: 'profile-uid', email: 'alice@example.com' };
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: profile }))           // profile found
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: null }))              // no existing studio membership
      .mockReturnValueOnce(qb({ data: { id: 'm', role: 'client' } })); // insert membership

    const result = await createClient(OWNER, STUDIO_ID, createInput);

    expect(result).toEqual(mockClient);
    expect(from).toHaveBeenCalledTimes(7);
  });

  it('owner creates a client where user already has studio membership', async () => {
    const profile = { id: 'profile-uid', email: 'alice@example.com' };
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: profile }))
      .mockReturnValueOnce(qb({ data: mockClient }))
      .mockReturnValueOnce(qb({ data: { id: 'm', role: 'client' } })); // existing membership

    const result = await createClient(OWNER, STUDIO_ID, createInput);

    expect(result).toEqual(mockClient);
    expect(from).toHaveBeenCalledTimes(6); // no insert needed for membership
  });

  it('trainer creates a client assigned to themselves', async () => {
    const trainerClient = { ...mockClient, trainer_id: TRAINER };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: trainerMembership })) // verify trainer in studio
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: trainerClient }));

    const result = await createClient(TRAINER, STUDIO_ID, createInput);

    expect(result.trainer_id).toBe(TRAINER);
  });

  it('throws 403 when trainer tries to assign client to a different trainer', async () => {
    from.mockReturnValueOnce(qb({ data: trainerMembership }));

    await expect(
      createClient(TRAINER, STUDIO_ID, { ...createInput, trainerId: TRAINER2 }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers can only assign clients to themselves',
    });
  });

  it('throws 400 when specified trainer does not belong to the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null })); // trainer not in studio

    await expect(
      createClient(OWNER, STUDIO_ID, { ...createInput, trainerId: TRAINER2 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Trainer must belong to this studio',
    });
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null })); // no membership

    await expect(createClient(OWNER, STUDIO_ID, createInput)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 409 when a client with the same email already exists in the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [{ id: 'existing' }] })); // email conflict

    await expect(createClient(OWNER, STUDIO_ID, createInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'A client with this email already exists in this studio',
    });
  });

  it('throws 500 when client insert fails with a DB error', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [] }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(createClient(OWNER, STUDIO_ID, createInput)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── listClients ───────────────────────────────────────────────────────────────
describe('listClients', () => {
  const mockClients = [mockClient, { ...mockClient, id: 'c2', full_name: 'Bob Jones' }];

  it('owner receives all clients in the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: mockClients }));

    const result = await listClients(OWNER, STUDIO_ID, {});

    expect(result).toEqual(mockClients);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('trainer receives only their assigned clients', async () => {
    const assignedClients = [mockClient]; // trainer_id === TRAINER
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: assignedClients }));

    const result = await listClients(TRAINER, STUDIO_ID, {});

    expect(result).toEqual(assignedClients);
  });

  it('filters clients by status', async () => {
    const activeClients = [mockClient];
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: activeClients }));

    const result = await listClients(OWNER, STUDIO_ID, { status: 'active' });

    expect(result).toEqual(activeClients);
  });

  it('filters clients by search term', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: [mockClient] }));

    const result = await listClients(OWNER, STUDIO_ID, { search: 'Alice' });

    expect(result).toHaveLength(1);
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(listClients(OWNER, STUDIO_ID, {})).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 500 on DB error during client query', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listClients(OWNER, STUDIO_ID, {})).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── getClientById ─────────────────────────────────────────────────────────────
describe('getClientById', () => {
  it('owner can access any client', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: mockClient }));

    const result = await getClientById(OWNER, STUDIO_ID, CLIENT_ID);

    expect(result).toEqual(mockClient);
  });

  it('trainer can access their assigned client', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: mockClient })); // trainer_id === TRAINER

    const result = await getClientById(TRAINER, STUDIO_ID, CLIENT_ID);

    expect(result).toEqual(mockClient);
  });

  it('throws 404 when trainer queries a client not assigned to them', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: null })); // query filtered by trainer_id returns null

    await expect(getClientById(TRAINER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Client not found',
    });
  });

  it('throws 404 when client does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(getClientById(OWNER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(getClientById(OWNER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

// ── updateClient ──────────────────────────────────────────────────────────────
describe('updateClient', () => {
  const existingClientRow = { id: CLIENT_ID, studio_id: STUDIO_ID, trainer_id: TRAINER };
  const updatedClient = { ...mockClient, full_name: 'Alice Updated' };

  it('owner updates client name and trainer', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))      // staff check
      .mockReturnValueOnce(qb({ data: existingClientRow }))    // get existing client
      .mockReturnValueOnce(qb({ data: ownerMembership }))      // verify new trainer in studio
      .mockReturnValueOnce(qb({ data: updatedClient }));       // update

    const result = await updateClient(OWNER, STUDIO_ID, CLIENT_ID, {
      fullName: 'Alice Updated',
      trainerId: TRAINER,
    });

    expect(result).toEqual(updatedClient);
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('updates email with uniqueness check (excluding self)', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow }))
      .mockReturnValueOnce(qb({ data: [] }))           // no email conflict excluding self
      .mockReturnValueOnce(qb({ data: updatedClient }));

    const result = await updateClient(OWNER, STUDIO_ID, CLIENT_ID, {
      email: 'new@example.com',
    });

    expect(result).toEqual(updatedClient);
  });

  it('trainer can update their own client', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow })) // trainer_id === TRAINER
      .mockReturnValueOnce(qb({ data: updatedClient }));

    const result = await updateClient(TRAINER, STUDIO_ID, CLIENT_ID, { fullName: 'Alice Updated' });

    expect(result).toEqual(updatedClient);
  });

  it('throws 404 when client does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(updateClient(OWNER, STUDIO_ID, CLIENT_ID, { fullName: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when trainer tries to update another trainer\'s client', async () => {
    const otherTrainersClient = { ...existingClientRow, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherTrainersClient }));

    await expect(updateClient(TRAINER, STUDIO_ID, CLIENT_ID, { fullName: 'x' })).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only update clients assigned to you',
    });
  });

  it('throws 403 when trainer tries to reassign a client to a different trainer', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow })); // trainer_id === TRAINER

    await expect(
      updateClient(TRAINER, STUDIO_ID, CLIENT_ID, { trainerId: TRAINER2 }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Trainers cannot reassign clients',
    });
  });

  it('throws 409 when the new email is already taken by another client', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow }))
      .mockReturnValueOnce(qb({ data: [{ id: 'other-client' }] })); // conflict

    await expect(
      updateClient(OWNER, STUDIO_ID, CLIENT_ID, { email: 'taken@example.com' }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(updateClient(OWNER, STUDIO_ID, CLIENT_ID, {})).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

// ── deleteClient ──────────────────────────────────────────────────────────────
describe('deleteClient', () => {
  const existingClientRow = { id: CLIENT_ID, trainer_id: TRAINER };

  it('owner deletes any client', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow }))
      .mockReturnValueOnce(qb({ data: null })); // delete

    const result = await deleteClient(OWNER, STUDIO_ID, CLIENT_ID);

    expect(result).toEqual({ deleted: true, clientId: CLIENT_ID });
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('trainer deletes their own client', async () => {
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow })) // trainer_id === TRAINER
      .mockReturnValueOnce(qb({ data: null }));

    const result = await deleteClient(TRAINER, STUDIO_ID, CLIENT_ID);

    expect(result).toEqual({ deleted: true, clientId: CLIENT_ID });
  });

  it('throws 404 when client does not exist', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null }));

    await expect(deleteClient(OWNER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when trainer tries to delete another trainer\'s client', async () => {
    const otherTrainersClient = { id: CLIENT_ID, trainer_id: TRAINER2 };
    from
      .mockReturnValueOnce(qb({ data: trainerMembership }))
      .mockReturnValueOnce(qb({ data: otherTrainersClient }));

    await expect(deleteClient(TRAINER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only delete clients assigned to you',
    });
  });

  it('throws 403 when requester is not studio staff', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(deleteClient(OWNER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 500 when delete query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: existingClientRow }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(deleteClient(OWNER, STUDIO_ID, CLIENT_ID)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
