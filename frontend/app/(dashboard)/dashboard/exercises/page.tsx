'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApiData } from '@/lib/hooks/use-api-data';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Exercise } from '@/lib/types';

const MUSCLE_GROUPS = ['All', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body'];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (muscleGroup !== 'All') params.set('muscleGroup', muscleGroup);
    if (difficulty !== 'All') params.set('difficulty', difficulty);
    const q = params.toString();
    return `/api/exercises${q ? `?${q}` : ''}`;
  }, [search, muscleGroup, difficulty]);

  const { data, loading, error } = useApiData<{ exercises: Exercise[] }>(url);
  const exercises = data?.exercises ?? [];

  const selectCls = 'h-11 rounded-xl border border-border bg-elevated px-3 text-sm text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:outline-none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Exercise library</h1>
        <p className="text-sm text-secondary-foreground">Browse all exercises available for workout plans.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search exercises..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="Muscle group" className={selectCls} value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
          {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g === 'All' ? 'All muscle groups' : g.replace('_', ' ')}</option>)}
        </select>
        <select aria-label="Difficulty" className={selectCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d === 'All' ? 'All difficulties' : d}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-secondary-foreground">Loading exercises...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && exercises.length === 0 && <p className="text-sm text-secondary-foreground">No exercises match your filters.</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="transition-all duration-200 hover:shadow-glow hover:border-primary/30">
            <CardContent className="p-4">
              <p className="font-semibold text-foreground">{exercise.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.muscle_group && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold capitalize text-primary">
                    {exercise.muscle_group.replace('_', ' ')}
                  </span>
                )}
                {exercise.difficulty && (
                  <span className="rounded-full bg-elevated border border-border px-2 py-0.5 text-xs font-semibold capitalize text-secondary-foreground">
                    {exercise.difficulty}
                  </span>
                )}
                {exercise.equipment && (
                  <span className="rounded-full bg-elevated border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                    {exercise.equipment}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
