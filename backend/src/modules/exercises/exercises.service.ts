import { supabaseAdmin } from '../../lib/supabase.js';
import { ApiError } from '../../utils/ApiError.js';
import type { ListExercisesQuery } from './exercises.schema.js';

export const listExercises = async (query: ListExercisesQuery) => {
  let request = supabaseAdmin
    .from('exercises')
    .select('id, name, muscle_group, equipment, difficulty, created_at')
    .order('name', { ascending: true });

  if (query.search) {
    request = request.ilike('name', `%${query.search}%`);
  }

  if (query.muscleGroup) {
    request = request.ilike('muscle_group', query.muscleGroup);
  }

  if (query.equipment) {
    request = request.ilike('equipment', query.equipment);
  }

  if (query.difficulty) {
    request = request.eq('difficulty', query.difficulty);
  }

  const { data: exercises, error } = await request;

  if (error) {
    throw new ApiError(500, 'Failed to fetch exercises');
  }

  return exercises;
};