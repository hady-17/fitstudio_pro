'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStudio } from '@/lib/context/studio-context';
import { useApiData } from '@/lib/hooks/use-api-data';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Client, WorkoutPlan, WorkoutPlanStatus } from '@/lib/types';

const STATUS_BADGE: Record<WorkoutPlanStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-foreground/10 text-foreground/60',
};

export default function WorkoutPlansPage() {
  const { activeStudio } = useStudio();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId') ?? undefined;
  const [dialogOpen, setDialogOpen] = useState(false);

  const plansUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/workout-plans` : null),
    [activeStudio],
  );
  const clientsUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/clients` : null),
    [activeStudio],
  );

  const { data: plansData, loading, error, refetch } = useApiData<{ plans: WorkoutPlan[] }>(plansUrl);
  const { data: clientsData } = useApiData<{ clients: Client[] }>(clientsUrl);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    clientsData?.clients.forEach((c) => map.set(c.id, c.full_name));
    return map;
  }, [clientsData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workout plans</h1>
          <p className="text-sm text-foreground/60">Build and manage training programs for your clients.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a workout plan</DialogTitle>
              <DialogDescription>Start a new training program for a client.</DialogDescription>
            </DialogHeader>
            <NewPlanForm
              studioId={activeStudio?.id ?? ''}
              clients={clientsData?.clients ?? []}
              defaultClientId={preselectedClientId}
              onCreated={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-foreground/60">Loading plans...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {plansData && plansData.plans.length === 0 && (
        <p className="text-sm text-foreground/60">No workout plans yet. Create one to get started.</p>
      )}

      {plansData && plansData.plans.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plansData.plans.map((plan) => (
            <Link key={plan.id} href={`/dashboard/workouts/${plan.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{plan.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[plan.status]}`}>
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    Client: {clientNameById.get(plan.client_id) ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {plan.start_date ?? 'No start date'} – {plan.end_date ?? 'No end date'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewPlanForm({
  studioId,
  clients,
  defaultClientId,
  onCreated,
}: {
  studioId: string;
  clients: Client[];
  defaultClientId?: string;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioId || !clientId) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/api/studios/${studioId}/workout-plans`, {
        clientId,
        title,
        description: description.trim() ? description.trim() : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <select
          id="clientId"
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting || !clientId}>
        {submitting ? 'Creating...' : 'Create plan'}
      </Button>
    </form>
  );
}
