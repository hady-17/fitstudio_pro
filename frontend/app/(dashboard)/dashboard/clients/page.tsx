'use client';

import { useMemo, useState } from 'react';
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
import type { Client, ClientStatus } from '@/lib/types';

const STATUS_OPTIONS: Array<{ value: ClientStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<ClientStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ClientsPage() {
  const { activeStudio } = useStudio();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const url = useMemo(() => {
    if (!activeStudio) return null;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'all') params.set('status', status);
    const query = params.toString();
    return `/api/studios/${activeStudio.id}/clients${query ? `?${query}` : ''}`;
  }, [activeStudio, search, status]);

  const { data, loading, error, refetch } = useApiData<{ clients: Client[] }>(url);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-foreground/60">Manage the people training at {activeStudio?.name}.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a client</DialogTitle>
              <DialogDescription>Create a new client record for this studio.</DialogDescription>
            </DialogHeader>
            <NewClientForm
              studioId={activeStudio?.id ?? ''}
              onCreated={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as ClientStatus | 'all')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-foreground/60">Loading clients...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && data.clients.length === 0 && (
        <p className="text-sm text-foreground/60">No clients match your filters yet.</p>
      )}

      {data && data.clients.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{client.full_name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[client.status]}`}>
                      {client.status}
                    </span>
                  </div>
                  {client.email && <p className="text-sm text-foreground/60">{client.email}</p>}
                  {client.goal && <p className="text-sm text-foreground/60 line-clamp-2">Goal: {client.goal}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewClientForm({ studioId, onCreated }: { studioId: string; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioId) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/api/studios/${studioId}/clients`, {
        fullName,
        email: email.trim() ? email.trim() : undefined,
        goal: goal.trim() ? goal.trim() : undefined,
      });
      setFullName('');
      setEmail('');
      setGoal('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">Goal</Label>
        <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create client'}
      </Button>
    </form>
  );
}
