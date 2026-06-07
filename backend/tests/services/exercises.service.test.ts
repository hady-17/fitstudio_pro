jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '../../src/lib/supabase';
import { listExercises } from '../../src/modules/exercises/exercises.service';
import { qb, dbErr } from '../helpers/supabaseMock';

const from = supabaseAdmin.from as jest.Mock;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const mockExercises = [
  { id: 'e1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'intermediate', created_at: '2026-01-01T00:00:00Z' },
  { id: 'e2', name: 'Squat',       muscle_group: 'Legs',  equipment: 'Barbell', difficulty: 'advanced',     created_at: '2026-01-01T00:00:00Z' },
  { id: 'e3', name: 'Pull-up',     muscle_group: 'Back',  equipment: 'Bodyweight', difficulty: 'intermediate', created_at: '2026-01-01T00:00:00Z' },
];

// ── listExercises ─────────────────────────────────────────────────────────────
describe('listExercises', () => {
  it('returns all exercises with no filters', async () => {
    from.mockReturnValueOnce(qb({ data: mockExercises }));

    const result = await listExercises({});

    expect(result).toEqual(mockExercises);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when no exercises exist', async () => {
    from.mockReturnValueOnce(qb({ data: [] }));

    const result = await listExercises({});

    expect(result).toEqual([]);
  });

  it('applies search filter by name', async () => {
    const filtered = [mockExercises[0]];
    from.mockReturnValueOnce(qb({ data: filtered }));

    const result = await listExercises({ search: 'bench' });

    expect(result).toEqual(filtered);
  });

  it('applies muscleGroup filter', async () => {
    const chestExercises = [mockExercises[0]];
    from.mockReturnValueOnce(qb({ data: chestExercises }));

    const result = await listExercises({ muscleGroup: 'Chest' });

    expect(result).toEqual(chestExercises);
  });

  it('applies equipment filter', async () => {
    const barbellExercises = [mockExercises[0], mockExercises[1]];
    from.mockReturnValueOnce(qb({ data: barbellExercises }));

    const result = await listExercises({ equipment: 'Barbell' });

    expect(result).toEqual(barbellExercises);
  });

  it('applies difficulty filter', async () => {
    const advancedExercises = [mockExercises[1]];
    from.mockReturnValueOnce(qb({ data: advancedExercises }));

    const result = await listExercises({ difficulty: 'advanced' });

    expect(result).toEqual(advancedExercises);
  });

  it('applies multiple filters simultaneously', async () => {
    const result_data = [mockExercises[0]];
    from.mockReturnValueOnce(qb({ data: result_data }));

    const result = await listExercises({
      search: 'bench',
      muscleGroup: 'Chest',
      equipment: 'Barbell',
      difficulty: 'intermediate',
    });

    expect(result).toEqual(result_data);
  });

  it('throws 500 on DB error', async () => {
    from.mockReturnValueOnce(qb({ error: dbErr }));

    await expect(listExercises({})).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to fetch exercises',
    });
  });
});
