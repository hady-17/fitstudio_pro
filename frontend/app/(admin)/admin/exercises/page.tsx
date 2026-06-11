'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ApiResponse, Exercise } from '@/lib/types';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

interface ExerciseForm {
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
}

const emptyForm: ExerciseForm = { name: '', muscle_group: '', equipment: '', difficulty: '' };

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchExercises = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    apiClient
      .get<ApiResponse<{ exercises: Exercise[] }>>(`/api/exercises?${params}`)
      .then((res) => setExercises(res.data.data.exercises))
      .catch(() => setError('Failed to load exercises'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group ?? '',
      equipment: ex.equipment ?? '',
      difficulty: ex.difficulty ?? '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      muscle_group: form.muscle_group.trim() || null,
      equipment: form.equipment.trim() || null,
      difficulty: form.difficulty || null,
    };
    try {
      if (editing) {
        await apiClient.patch(`/api/admin/exercises/${editing.id}`, payload);
      } else {
        await apiClient.post('/api/admin/exercises', payload);
      }
      setDialogOpen(false);
      fetchExercises();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ex: Exercise) => {
    if (!confirm(`Delete exercise "${ex.name}"? This will remove it from all workout plans.`)) return;
    setDeleting(ex.id);
    try {
      await apiClient.delete(`/api/admin/exercises/${ex.id}`);
      fetchExercises();
    } catch {
      alert('Failed to delete exercise');
    } finally {
      setDeleting(null);
    }
  };

  const difficultyBadge = (d: string | null) => {
    if (!d) return null;
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/15 text-green-400',
      intermediate: 'bg-yellow-500/15 text-yellow-400',
      advanced: 'bg-destructive/15 text-destructive',
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[d] ?? ''}`}>
        {d}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Exercises</h1>
          <p className="text-sm text-secondary-foreground">Manage the global exercise library</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add exercise
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search exercises..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {loading ? 'Loading...' : `${exercises.length} exercises`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Muscle Group</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Equipment</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Difficulty</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((ex) => (
                    <tr key={ex.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3 font-medium text-foreground">{ex.name}</td>
                      <td className="px-6 py-3 text-secondary-foreground">{ex.muscle_group ?? '—'}</td>
                      <td className="px-6 py-3 text-secondary-foreground">{ex.equipment ?? '—'}</td>
                      <td className="px-6 py-3">{difficultyBadge(ex.difficulty)}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(ex)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 border-destructive/30"
                            disabled={deleting === ex.id}
                            onClick={() => handleDelete(ex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exercises.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-secondary-foreground">
                        No exercises found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit exercise' : 'Add exercise'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="exName">Name *</Label>
              <Input
                id="exName"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Barbell Squat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exMuscle">Muscle group</Label>
              <Input
                id="exMuscle"
                value={form.muscle_group}
                onChange={(e) => setForm((f) => ({ ...f, muscle_group: e.target.value }))}
                placeholder="e.g. Quadriceps"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exEquipment">Equipment</Label>
              <Input
                id="exEquipment"
                value={form.equipment}
                onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
                placeholder="e.g. Barbell"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exDifficulty">Difficulty</Label>
              <select
                id="exDifficulty"
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
              >
                <option value="">— select —</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add exercise'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
