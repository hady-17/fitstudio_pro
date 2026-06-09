'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStudio } from '@/lib/context/studio-context';
import { useApiData } from '@/lib/hooks/use-api-data';
import { createClient } from '@/lib/supabase/client';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Exercise, WorkoutDay, WorkoutItem, WorkoutPlan } from '@/lib/types';

interface PlanWithRelations extends WorkoutPlan {
  client?: { id: string; full_name: string } | null;
  trainer?: { id: string; full_name: string } | null;
}

type DayWithItems = WorkoutDay & { workout_items: WorkoutItem[] };

const selectCls = 'h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:outline-none';
const STATUS_OPTIONS = ['draft', 'active', 'completed', 'archived'] as const;

export default function WorkoutPlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const { activeStudio } = useStudio();
  const planId = params.planId;

  const planUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/workout-plans/${planId}` : null),
    [activeStudio, planId],
  );

  const { data: planData, loading: planLoading, error: planError, refetch: refetchPlan } = useApiData<{ workoutPlan: PlanWithRelations }>(planUrl);
  const { data: exercisesData } = useApiData<{ exercises: Exercise[] }>('/api/exercises');

  const [days, setDays] = useState<DayWithItems[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);

  const loadDays = useCallback(async () => {
    setDaysLoading(true);
    setDaysError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workout_days')
      .select(`id, workout_plan_id, day_number, title, notes,
         workout_items ( id, workout_day_id, exercise_id, sets, reps, target_weight, rest_seconds, notes,
           exercises ( id, name ) )`)
      .eq('workout_plan_id', planId)
      .order('day_number', { ascending: true });
    if (error) setDaysError(error.message);
    else setDays((data ?? []) as unknown as DayWithItems[]);
    setDaysLoading(false);
  }, [planId]);

  useEffect(() => { loadDays(); }, [loadDays]);

  const plan = planData?.workoutPlan;
  const usedDayNumbers = days.map((d) => d.day_number);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/workouts" className="text-sm text-secondary-foreground hover:text-primary transition-colors">
        ← Back to plans
      </Link>

      {planLoading && <p className="text-sm text-secondary-foreground">Loading plan...</p>}
      {planError && <p className="text-sm text-destructive">{planError}</p>}

      {plan && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">{plan.title}</h1>
              <p className="text-sm text-secondary-foreground">
                {plan.client?.full_name ?? 'Unknown client'} · {plan.start_date ?? 'No start date'} – {plan.end_date ?? 'No end date'}
              </p>
              {plan.description && <p className="mt-1 text-sm text-secondary-foreground">{plan.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-elevated border border-border px-3 py-1 text-xs font-semibold capitalize text-secondary-foreground">{plan.status}</span>
              <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
                <DialogTrigger asChild><Button size="sm" variant="ghost">Edit plan</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit plan</DialogTitle>
                    <DialogDescription>Update the plan details, dates, and status.</DialogDescription>
                  </DialogHeader>
                  <EditPlanForm studioId={activeStudio?.id ?? ''} plan={plan}
                    onSaved={() => { setEditPlanOpen(false); refetchPlan(); }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Training days</h2>
            <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={days.length >= 7}>Add day</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a training day</DialogTitle>
                  <DialogDescription>Plans can have up to 7 days.</DialogDescription>
                </DialogHeader>
                <NewDayForm studioId={activeStudio?.id ?? ''} planId={planId} usedDayNumbers={usedDayNumbers}
                  onCreated={() => { setDayDialogOpen(false); loadDays(); }} />
              </DialogContent>
            </Dialog>
          </div>

          {daysLoading && <p className="text-sm text-secondary-foreground">Loading days...</p>}
          {daysError && <p className="text-sm text-destructive">{daysError}</p>}
          {!daysLoading && days.length === 0 && <p className="text-sm text-secondary-foreground">No training days yet. Add the first one.</p>}

          <div className="space-y-4">
            {days.map((day) => (
              <DayCard key={day.id} day={day} studioId={activeStudio?.id ?? ''} planId={planId}
                clientId={plan.client_id} exercises={exercisesData?.exercises ?? []} onChanged={loadDays} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DayCard({ day, studioId, planId, clientId, exercises, onChanged }: {
  day: DayWithItems; studioId: string; planId: string; clientId: string; exercises: Exercise[]; onChanged: () => void;
}) {
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleDeleteDay = async () => {
    if (!confirm(`Delete "${day.title}" and all its exercises?`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/studios/${studioId}/workout-plans/${planId}/days/${day.id}`);
      onChanged();
    } finally { setDeleting(false); }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Remove this exercise?')) return;
    await apiClient.delete(`/api/studios/${studioId}/workout-plans/${planId}/days/${day.id}/items/${itemId}`);
    onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Day {day.day_number} · {day.title}</CardTitle>
          {day.notes && <CardDescription>{day.notes}</CardDescription>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <DialogTrigger asChild><Button size="sm">Log workout</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log workout completion</DialogTitle>
                <DialogDescription>Mark Day {day.day_number} as completed for this client.</DialogDescription>
              </DialogHeader>
              <LogWorkoutForm clientId={clientId} workoutDayId={day.id}
                onCreated={() => { setLogOpen(false); }} />
            </DialogContent>
          </Dialog>
          <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
            <DialogTrigger asChild><Button size="sm" variant="ghost">Add exercise</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add exercise to {day.title}</DialogTitle>
                <DialogDescription>Choose an exercise and set the targets.</DialogDescription>
              </DialogHeader>
              <NewItemForm studioId={studioId} planId={planId} dayId={day.id} exercises={exercises}
                onCreated={() => { setItemDialogOpen(false); onChanged(); }} />
            </DialogContent>
          </Dialog>
          <Dialog open={editDayOpen} onOpenChange={setEditDayOpen}>
            <DialogTrigger asChild><Button size="sm" variant="ghost">Edit day</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit day</DialogTitle>
                <DialogDescription>Update the title or notes for this training day.</DialogDescription>
              </DialogHeader>
              <EditDayForm studioId={studioId} planId={planId} day={day}
                onSaved={() => { setEditDayOpen(false); onChanged(); }} />
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDeleteDay}>Delete</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {day.workout_items.length === 0 && <p className="text-sm text-secondary-foreground">No exercises added yet.</p>}
        {day.workout_items.map((item) =>
          editingItemId === item.id ? (
            <EditItemInline key={item.id} studioId={studioId} planId={planId} dayId={day.id} item={item}
              onSaved={() => { setEditingItemId(null); onChanged(); }}
              onCancel={() => setEditingItemId(null)} />
          ) : (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3 text-sm">
              <div>
                <p className="font-medium">{item.exercises?.name ?? 'Unknown exercise'}</p>
                <p className="text-secondary-foreground">
                  {[item.sets !== null && `${item.sets} sets`, item.reps && `${item.reps} reps`,
                    item.target_weight && `target ${item.target_weight}`, item.rest_seconds !== null && `${item.rest_seconds}s rest`]
                    .filter(Boolean).join(' · ') || 'No targets set'}
                </p>
                {item.notes && <p className="text-secondary-foreground">{item.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingItemId(item.id)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteItem(item.id)}>Remove</Button>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

function EditPlanForm({ studioId, plan, onSaved }: { studioId: string; plan: PlanWithRelations; onSaved: () => void }) {
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description ?? '');
  const [status, setStatus] = useState(plan.status);
  const [startDate, setStartDate] = useState(plan.start_date ?? '');
  const [endDate, setEndDate] = useState(plan.end_date ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/api/studios/${studioId}/workout-plans/${plan.id}`, {
        title, description: description || undefined,
        status, startDate: startDate || undefined, endDate: endDate || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    } finally { setSubmitting(false); }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2"><Label htmlFor="epTitle">Title</Label><Input id="epTitle" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="epDesc">Description</Label><Input id="epDesc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="space-y-2">
        <Label htmlFor="epStatus">Status</Label>
        <select id="epStatus" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="epStart">Start date</Label><Input id="epStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="epEnd">End date</Label><Input id="epEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : 'Save changes'}</Button>
    </form>
  );
}

function EditDayForm({ studioId, planId, day, onSaved }: { studioId: string; planId: string; day: WorkoutDay; onSaved: () => void }) {
  const [title, setTitle] = useState(day.title);
  const [notes, setNotes] = useState(day.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/api/studios/${studioId}/workout-plans/${planId}/days/${day.id}`, {
        title, notes: notes.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update day');
    } finally { setSubmitting(false); }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2"><Label htmlFor="edTitle">Title</Label><Input id="edTitle" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="edNotes">Notes</Label><Input id="edNotes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : 'Save changes'}</Button>
    </form>
  );
}

function EditItemInline({ studioId, planId, dayId, item, onSaved, onCancel }: {
  studioId: string; planId: string; dayId: string; item: WorkoutItem; onSaved: () => void; onCancel: () => void;
}) {
  const [sets, setSets] = useState(item.sets?.toString() ?? '');
  const [reps, setReps] = useState(item.reps ?? '');
  const [targetWeight, setTargetWeight] = useState(item.target_weight ?? '');
  const [restSeconds, setRestSeconds] = useState(item.rest_seconds?.toString() ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.patch(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}/items/${item.id}`, {
        sets: sets ? Number(sets) : undefined, reps: reps.trim() || undefined,
        targetWeight: targetWeight.trim() || undefined, restSeconds: restSeconds ? Number(restSeconds) : undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/30 bg-elevated p-3 space-y-3 text-sm">
      <p className="font-medium text-primary">{item.exercises?.name ?? 'Exercise'}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label htmlFor={`sets-${item.id}`}>Sets</Label><Input id={`sets-${item.id}`} type="number" min={1} max={20} value={sets} onChange={(e) => setSets(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor={`reps-${item.id}`}>Reps</Label><Input id={`reps-${item.id}`} placeholder="8-12" value={reps} onChange={(e) => setReps(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor={`tw-${item.id}`}>Target weight</Label><Input id={`tw-${item.id}`} placeholder="60kg" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor={`rest-${item.id}`}>Rest (s)</Label><Input id={`rest-${item.id}`} type="number" min={0} value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label htmlFor={`notes-${item.id}`}>Notes</Label><Input id={`notes-${item.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function LogWorkoutForm({ clientId, workoutDayId, onCreated }: { clientId: string; workoutDayId: string; onCreated: () => void }) {
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/clients/${clientId}/workout-logs`, {
        workoutDayId, completedAt: new Date(completedAt).toISOString(), notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(onCreated, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout');
    } finally { setSubmitting(false); }
  };

  if (success) return <p className="py-4 text-center text-sm text-success">Workout logged successfully!</p>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2"><Label htmlFor="lwDate">Completed at</Label><Input id="lwDate" type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="lwNotes">Notes</Label><Input id="lwNotes" placeholder="How did it go?" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Logging...' : 'Log workout'}</Button>
    </form>
  );
}

function NewDayForm({ studioId, planId, usedDayNumbers, onCreated }: { studioId: string; planId: string; usedDayNumbers: number[]; onCreated: () => void }) {
  const available = [1, 2, 3, 4, 5, 6, 7].filter((n) => !usedDayNumbers.includes(n));
  const [dayNumber, setDayNumber] = useState(available[0] ?? 1);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/studios/${studioId}/workout-plans/${planId}/days`, { dayNumber, title, notes: notes.trim() || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add training day');
    } finally { setSubmitting(false); }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="dayNumber">Day number</Label>
        <select id="dayNumber" className={selectCls} value={dayNumber} onChange={(e) => setDayNumber(Number(e.target.value))}>
          {available.map((n) => <option key={n} value={n}>Day {n}</option>)}
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor="dayTitle">Title</Label><Input id="dayTitle" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="dayNotes">Notes</Label><Input id="dayNotes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Adding...' : 'Add day'}</Button>
    </form>
  );
}

function NewItemForm({ studioId, planId, dayId, exercises, onCreated }: { studioId: string; planId: string; dayId: string; exercises: Exercise[]; onCreated: () => void }) {
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/studios/${studioId}/workout-plans/${planId}/days/${dayId}/items`, {
        exerciseId, sets: sets ? Number(sets) : undefined, reps: reps.trim() || undefined,
        targetWeight: targetWeight.trim() || undefined, restSeconds: restSeconds ? Number(restSeconds) : undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
    } finally { setSubmitting(false); }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="exerciseId">Exercise</Label>
        <select id="exerciseId" required className={selectCls} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          <option value="" disabled>Select an exercise</option>
          {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="sets">Sets</Label><Input id="sets" type="number" min={1} max={20} value={sets} onChange={(e) => setSets(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="reps">Reps</Label><Input id="reps" placeholder="8-12" value={reps} onChange={(e) => setReps(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="targetWeight">Target weight</Label><Input id="targetWeight" placeholder="60kg" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="restSeconds">Rest (s)</Label><Input id="restSeconds" type="number" min={0} value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="itemNotes">Notes</Label><Input id="itemNotes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting || !exerciseId}>{submitting ? 'Adding...' : 'Add exercise'}</Button>
    </form>
  );
}
