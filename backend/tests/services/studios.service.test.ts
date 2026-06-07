jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import {
  createStudio,
  getMyStudios,
  getStudioById,
  updateStudio,
  getStudioMembers,
  addTrainerToStudio,
  deleteStudio,
  removeStudioMember,
} from '../../src/modules/studios/studios.service';
import { ApiError } from '../../src/utils/ApiError';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const OWNER = 'owner-0000-0000-0000-000000000001';
const STUDIO_ID = 'studio-000-0000-0000-000000000002';
const TRAINER = 'trainer-00-0000-0000-000000000003';
const MEMBER_ID = 'member-000-0000-0000-000000000004';

const mockStudio = {
  id: STUDIO_ID,
  name: 'FitStudio',
  slug: 'fit-studio',
  owner_id: OWNER,
  created_at: '2026-01-01T00:00:00Z',
};

const ownerMembership = { id: MEMBER_ID, role: 'owner' };
const trainerMembership = { id: MEMBER_ID, role: 'trainer' };

// ── createStudio ─────────────────────────────────────────────────────────────
describe('createStudio', () => {
  const input = { name: 'FitStudio', slug: 'fit-studio' };

  it('creates a studio and inserts owner membership', async () => {
    from
      .mockReturnValueOnce(qb({ data: null }))         // no existing owned studio
      .mockReturnValueOnce(qb({ data: null }))         // slug available
      .mockReturnValueOnce(qb({ data: mockStudio }))   // insert studio
      .mockReturnValueOnce(qb({ data: null }));        // insert owner member

    const result = await createStudio(OWNER, input);

    expect(result).toEqual(mockStudio);
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('creates a studio with an optional description', async () => {
    const withDesc = { ...mockStudio, description: 'Best gym in town' };
    from
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: withDesc }))
      .mockReturnValueOnce(qb({ data: null }));

    const result = await createStudio(OWNER, { ...input, description: 'Best gym in town' });

    expect(result.description).toBe('Best gym in town');
  });

  it('throws 409 when user already owns a studio', async () => {
    from.mockReturnValueOnce(qb({ data: { id: 'existing-studio' } }));

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'User already owns a studio',
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('throws 409 when the slug is already taken', async () => {
    from
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: { id: 'other-studio' } }));

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Studio slug is already taken',
    });
  });

  it('throws 500 when existing-owned-studio check fails', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({ statusCode: 500 });
  });

  it('throws 500 when slug uniqueness check fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({ statusCode: 500 });
  });

  it('throws 500 when studio insert returns no data', async () => {
    from
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null, error: null })); // null data, no error

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({ statusCode: 500 });
  });

  it('throws 500 when owner membership insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: mockStudio }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(createStudio(OWNER, input)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to create studio owner membership',
    });
  });
});

// ── getMyStudios ──────────────────────────────────────────────────────────────
describe('getMyStudios', () => {
  const studioMemberships = [
    { id: MEMBER_ID, role: 'owner', created_at: '2026-01-01T00:00:00Z', studio: mockStudio },
  ];

  it('returns all studio memberships for the user', async () => {
    from.mockReturnValueOnce(qb({ data: studioMemberships }));

    const result = await getMyStudios(OWNER);

    expect(result).toEqual(studioMemberships);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when user has no memberships', async () => {
    from.mockReturnValueOnce(qb({ data: [] }));

    const result = await getMyStudios(OWNER);

    expect(result).toEqual([]);
  });

  it('throws 500 on DB error', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getMyStudios(OWNER)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── getStudioById ─────────────────────────────────────────────────────────────
describe('getStudioById', () => {
  const membershipWithStudio = { id: MEMBER_ID, role: 'owner', studio: mockStudio };

  it('returns the membership+studio when user is a member', async () => {
    from.mockReturnValueOnce(qb({ data: membershipWithStudio }));

    const result = await getStudioById(OWNER, STUDIO_ID);

    expect(result).toEqual(membershipWithStudio);
  });

  it('throws 403 when user is not a member of the studio', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(getStudioById(OWNER, STUDIO_ID)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this studio',
    });
  });

  it('throws 500 on DB error', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioById(OWNER, STUDIO_ID)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── updateStudio ──────────────────────────────────────────────────────────────
describe('updateStudio', () => {
  const updatedStudio = { ...mockStudio, name: 'New Name' };

  it('updates studio name (no slug change) as owner', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))  // membership check
      .mockReturnValueOnce(qb({ data: updatedStudio }));   // update

    const result = await updateStudio(OWNER, STUDIO_ID, { name: 'New Name' });

    expect(result).toEqual(updatedStudio);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('updates studio slug when slug is available', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))   // membership
      .mockReturnValueOnce(qb({ data: null }))              // slug not taken
      .mockReturnValueOnce(qb({ data: updatedStudio }));    // update

    const result = await updateStudio(OWNER, STUDIO_ID, { slug: 'new-slug' });

    expect(result).toEqual(updatedStudio);
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('throws 409 when new slug is already taken by another studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: { id: 'other-studio' } }));

    await expect(updateStudio(OWNER, STUDIO_ID, { slug: 'taken-slug' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Studio slug is already taken',
    });
  });

  it('throws 403 when user is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(updateStudio(OWNER, STUDIO_ID, { name: 'x' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 403 when user is a trainer (not owner)', async () => {
    from.mockReturnValueOnce(qb({ data: trainerMembership }));

    await expect(updateStudio(TRAINER, STUDIO_ID, { name: 'x' })).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only studio owners can update this studio',
    });
  });

  it('throws 500 when update query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(updateStudio(OWNER, STUDIO_ID, { name: 'x' })).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── getStudioMembers ──────────────────────────────────────────────────────────
describe('getStudioMembers', () => {
  const members = [
    { id: MEMBER_ID, role: 'owner', created_at: '2026-01-01T00:00:00Z', profile: { id: OWNER, full_name: 'Alice' } },
    { id: 'mem-2', role: 'trainer', created_at: '2026-01-02T00:00:00Z', profile: { id: TRAINER, full_name: 'Bob' } },
  ];

  it('returns all members to an owner', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))  // requester check
      .mockReturnValueOnce(qb({ data: members }));          // member list

    const result = await getStudioMembers(OWNER, STUDIO_ID);

    expect(result).toEqual(members);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(getStudioMembers(OWNER, STUDIO_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 500 when member list query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(getStudioMembers(OWNER, STUDIO_ID)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── addTrainerToStudio ────────────────────────────────────────────────────────
describe('addTrainerToStudio', () => {
  const trainerProfile = { id: TRAINER, full_name: 'Bob', email: 'bob@example.com', avatar_url: null };
  const newMember = { id: 'new-mem', role: 'trainer', created_at: '2026-01-01T00:00:00Z', profile: trainerProfile };
  const input = { email: 'bob@example.com' };

  it('adds a trainer to the studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))   // requester membership
      .mockReturnValueOnce(qb({ data: trainerProfile }))    // trainer profile lookup
      .mockReturnValueOnce(qb({ data: null }))              // no existing membership
      .mockReturnValueOnce(qb({ data: newMember }));        // insert member

    const result = await addTrainerToStudio(OWNER, STUDIO_ID, input);

    expect(result).toEqual(newMember);
    expect(from).toHaveBeenCalledTimes(4);
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(addTrainerToStudio(OWNER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 403 when requester is a trainer (not owner)', async () => {
    from.mockReturnValueOnce(qb({ data: trainerMembership }));

    await expect(addTrainerToStudio(TRAINER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only studio owners can add trainers',
    });
  });

  it('throws 404 when no user found with given email', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null })); // profile not found

    await expect(addTrainerToStudio(OWNER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 404,
      message: 'No registered user found with this email',
    });
  });

  it('throws 400 when owner tries to add themselves', async () => {
    const ownerProfile = { ...trainerProfile, id: OWNER };
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerProfile })); // profile is requester

    await expect(addTrainerToStudio(OWNER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Studio owner is already a member',
    });
  });

  it('throws 409 when trainer is already a member', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: trainerProfile }))
      .mockReturnValueOnce(qb({ data: { id: 'x', role: 'trainer' } })); // already member

    await expect(addTrainerToStudio(OWNER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws 500 when member insert fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: trainerProfile }))
      .mockReturnValueOnce(qb({ data: null }))
      .mockReturnValueOnce(qb({ data: null, error: dbErr }));

    await expect(addTrainerToStudio(OWNER, STUDIO_ID, input)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ── deleteStudio ──────────────────────────────────────────────────────────────
describe('deleteStudio', () => {
  it('deletes the studio when requester is owner', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))  // owner check
      .mockReturnValueOnce(qb({ data: null }));             // delete

    const result = await deleteStudio(OWNER, STUDIO_ID);

    expect(result).toEqual({ deleted: true, studioId: STUDIO_ID });
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(deleteStudio(OWNER, STUDIO_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 when requester is a trainer (not owner)', async () => {
    from.mockReturnValueOnce(qb({ data: trainerMembership }));

    await expect(deleteStudio(TRAINER, STUDIO_ID)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Only studio owners can perform this action',
    });
  });

  it('throws 500 when delete query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(deleteStudio(OWNER, STUDIO_ID)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ── removeStudioMember ────────────────────────────────────────────────────────
describe('removeStudioMember', () => {
  const targetMember = {
    id: MEMBER_ID,
    user_id: TRAINER,
    role: 'trainer',
    studio_id: STUDIO_ID,
  };

  it('removes a trainer member', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))  // owner check
      .mockReturnValueOnce(qb({ data: targetMember }))     // find target member
      .mockReturnValueOnce(qb({ data: null }));             // delete

    const result = await removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID);

    expect(result).toEqual({ removed: true, memberId: MEMBER_ID });
  });

  it('throws 403 when requester is not a studio member', async () => {
    from.mockReturnValueOnce(qb({ data: null }));

    await expect(removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 403 when requester is a trainer (not owner)', async () => {
    from.mockReturnValueOnce(qb({ data: trainerMembership }));

    await expect(removeStudioMember(TRAINER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws 404 when target member does not exist in studio', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: null })); // member not found

    await expect(removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Studio member not found',
    });
  });

  it('throws 400 when owner tries to remove themselves', async () => {
    const selfMember = { ...targetMember, user_id: OWNER };
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: selfMember }));

    await expect(removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Studio owner cannot remove themselves',
    });
  });

  it('throws 400 when trying to remove the studio owner', async () => {
    const ownerTarget = { ...targetMember, role: 'owner' };
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: ownerTarget }));

    await expect(removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cannot remove studio owner',
    });
  });

  it('throws 500 when delete query fails', async () => {
    from
      .mockReturnValueOnce(qb({ data: ownerMembership }))
      .mockReturnValueOnce(qb({ data: targetMember }))
      .mockReturnValueOnce(qb({ error: dbErr }));

    await expect(removeStudioMember(OWNER, STUDIO_ID, MEMBER_ID)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
