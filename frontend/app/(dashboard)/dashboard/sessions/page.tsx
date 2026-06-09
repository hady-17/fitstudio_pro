'use client';

import { useMemo, useState } from 'react';
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
import type { Client, Session, SessionStatus } from '@/lib/types';

interface StudioMemberWithProfile {
  id: string;
  role: string;
  profile: { id: string; full_name: string } | null;
}

const STATUS_OPTIONS: Array<{ value: SessionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
];

const STATUS_BADGE: Record<SessionStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-foreground/10 text-foreground/60',
  no_show: 'bg-red-100 text-red-700',
};

const STATUS_TRANSITIONS: SessionStatus[] = ['completed', 'cancelled', 'no_show'];

export default function SessionsPage() {
  const { activeStudio } = useStudio();
  const [status, setStatus] = useState<SessionStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const sessionsUrl = useMemo(() => {
    if (!activeStudio) return null;
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    const query = params.toString();
    return `/api/studios/${activeStudio.id}/sessions${query ? `?${query}` : ''}`;
  }, [activeStudio, status]);

  const clientsUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/clients` : null),
    [activeStudio],
  );
  const membersUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/members` : null),
    [activeStudio],
  );

  const { data: sessionsData, loading, error, refetch } = useApiData<{ sessions: Session[] }>(sessionsUrl);
  const { data: clientsData } = useApiData<{ clients: Client[] }>(clientsUrl);
  const { data: membersData } = useApiData<{ members: StudioMemberWithProfile[] }>(membersUrl);

  const trainers = (membersData?.members ?? []).filter((m) => m.role === 'owner' || m.role === 'trainer');

  const handleStatusChange = async (sessionId: string, nextStatus: SessionStatus) => {
    await apiClient.patch(`/api/sessions/${sessionId}/status`, { status: nextStatus });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-sm text-foreground/60">Schedule and track training sessions for {activeStudio?.name}.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book a session</DialogTitle>
              <DialogDescription>Schedule a training session for a client and trainer.</DialogDescription>
            </DialogHeader>
            <NewSessionForm
              studioId={activeStudio?.id ?? ''}
              clients={clientsData?.clients ?? []}
              trainers={trainers}
              onCreated={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value as SessionStatus | 'all')}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {loading && <p className="text-sm text-foreground/60">Loading sessions...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sessionsData && sessionsData.sessions.length === 0 && (
        <p className="text-sm text-foreground/60">No sessions match your filters.</p>
      )}

      <div className="space-y-3">
        {sessionsData?.sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {session.client?.full_name ?? 'Unknown client'} with {session.trainer?.full_name ?? 'Unknown trainer'}
                </p>
                <p className="text-sm text-foreground/60">
                  {new Date(session.start_time).toLocaleString()} – {new Date(session.end_time).toLocaleTimeString()}
                </p>
                {session.notes && <p className="text-sm text-foreground/60">{session.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[session.status]}`}>
                  {session.status.replace('_', ' ')}
                </span>
                {session.status === 'scheduled' && (
                  <div className="flex gap-1">
                    {STATUS_TRANSITIONS.map((next) => (
                      <Button key={next} size="sm" variant="ghost" onClick={() => handleStatusChange(session.id, next)}>
                        {next === 'no_show' ? 'No-show' : next.charAt(0).toUpperCase() + next.slice(1)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewSessionForm({
  studioId,
  clients,
  trainers,
  onCreated,
}: {
  studioId: string;
  clients: Client[];
  trainers: StudioMemberWithProfile[];
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !trainerId || !date || !startTime || !endTime) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/api/studios/${studioId}/sessions`, {
        clientId,
        trainerId,
        startTime: new Date(`${date}T${startTime}`).toISOString(),
        endTime: new Date(`${date}T${endTime}`).toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="sessionClient">Client</Label>
        <select
          id="sessionClient"
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
        <Label htmlFor="sessionTrainer">Trainer</Label>
        <select
          id="sessionTrainer"
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={trainerId}
          onChange={(e) => setTrainerId(e.target.value)}
        >
          <option value="" disabled>
            Select a trainer
          </option>
          {trainers.map((member) => (
            <option key={member.id} value={member.profile?.id}>
              {member.profile?.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sessionDate">Date</Label>
        <Input id="sessionDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sessionStart">Start time</Label>
          <Input id="sessionStart" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sessionEnd">End time</Label>
          <Input id="sessionEnd" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sessionNotes">Notes</Label>
        <Input id="sessionNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Booking...' : 'Book session'}
      </Button>
    </form>
  );
}
