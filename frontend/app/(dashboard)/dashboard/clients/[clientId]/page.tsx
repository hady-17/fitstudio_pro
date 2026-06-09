'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStudio } from '@/lib/context/studio-context';
import { useApiData } from '@/lib/hooks/use-api-data';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { CheckIn, Client, Measurement, WorkoutPlan } from '@/lib/types';

interface WeightTrend {
  latest: { weight: number; recordedAt: string } | null;
  previous: { weight: number; recordedAt: string } | null;
  change: number | null;
  direction: 'up' | 'down' | 'stable' | null;
}

const TREND_ICON: Record<NonNullable<WeightTrend['direction']>, string> = {
  up: '▲', down: '▼', stable: '—',
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const { activeStudio } = useStudio();
  const clientId = params.clientId;

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);

  const clientUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/clients/${clientId}` : null),
    [activeStudio, clientId],
  );
  const plansUrl = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/workout-plans?clientId=${clientId}` : null),
    [activeStudio, clientId],
  );

  const { data: clientData, loading, error } = useApiData<{ client: Client }>(clientUrl);
  const { data: checkInsData, refetch: refetchCheckIns } = useApiData<{ checkIns: CheckIn[] }>(`/api/clients/${clientId}/check-ins`);
  const { data: measurementsData, refetch: refetchMeasurements } = useApiData<{ measurements: Measurement[] }>(`/api/clients/${clientId}/measurements`);
  const { data: trendData } = useApiData<{ trend: { checkInWeight: WeightTrend; measurementWeight: WeightTrend } }>(`/api/clients/${clientId}/progress/trend`);
  const { data: plansData } = useApiData<{ plans: WorkoutPlan[] }>(plansUrl);

  const client = clientData?.client;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/clients" className="text-sm text-secondary-foreground hover:text-primary transition-colors">
        ← Back to clients
      </Link>

      {loading && <p className="text-sm text-secondary-foreground">Loading client...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {client && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">{client.full_name}</h1>
              <p className="text-sm text-secondary-foreground">{client.email ?? 'No email on file'}</p>
            </div>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold capitalize text-primary">
              {client.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="text-base">Goal</CardTitle></CardHeader>
              <CardContent className="pt-0 text-sm text-secondary-foreground">{client.goal || 'No goal recorded yet.'}</CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="pt-0 text-sm text-secondary-foreground">{client.notes || 'No notes recorded yet.'}</CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base">Joined</CardTitle></CardHeader>
              <CardContent className="pt-0 text-sm text-secondary-foreground">{new Date(client.joined_at).toLocaleDateString()}</CardContent>
            </Card>
          </div>

          {trendData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight trend</CardTitle>
                <CardDescription>Latest vs. previous recorded weight</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-2">
                <WeightTrendCard label="From check-ins" trend={trendData.trend.checkInWeight} />
                <WeightTrendCard label="From measurements" trend={trendData.trend.measurementWeight} />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Check-ins</CardTitle>
                  <CardDescription>Mood, energy and weight self-reports</CardDescription>
                </div>
                <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Log check-in</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log a check-in</DialogTitle>
                      <DialogDescription>Record {client.full_name}&apos;s wellbeing metrics. At least one field is required.</DialogDescription>
                    </DialogHeader>
                    <CheckInForm clientId={clientId} onCreated={() => { setCheckInOpen(false); refetchCheckIns(); }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {checkInsData?.checkIns.length === 0 && <p className="text-sm text-secondary-foreground">No check-ins yet.</p>}
                {checkInsData?.checkIns.slice(0, 5).map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-elevated p-3 text-sm">
                    <p className="font-medium">{new Date(c.created_at).toLocaleDateString()}</p>
                    <p className="text-secondary-foreground">
                      {[c.mood !== null && `mood ${c.mood}/10`, c.energy_level !== null && `energy ${c.energy_level}/10`, c.weight !== null && `weight ${c.weight}kg`].filter(Boolean).join(' · ') || 'No metrics recorded'}
                    </p>
                    {c.notes && <p className="mt-1 text-secondary-foreground">{c.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Measurements</CardTitle>
                  <CardDescription>Body measurements over time</CardDescription>
                </div>
                <Dialog open={measurementOpen} onOpenChange={setMeasurementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Log measurements</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log measurements</DialogTitle>
                      <DialogDescription>Record {client.full_name}&apos;s body measurements.</DialogDescription>
                    </DialogHeader>
                    <MeasurementForm clientId={clientId} onCreated={() => { setMeasurementOpen(false); refetchMeasurements(); }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {measurementsData?.measurements.length === 0 && <p className="text-sm text-secondary-foreground">No measurements yet.</p>}
                {measurementsData?.measurements.slice(0, 5).map((m) => (
                  <div key={m.id} className="rounded-xl border border-border bg-elevated p-3 text-sm">
                    <p className="font-medium">{new Date(m.created_at).toLocaleDateString()}</p>
                    <p className="text-secondary-foreground">
                      {[m.weight !== null && `weight ${m.weight}kg`, m.chest !== null && `chest ${m.chest}cm`, m.waist !== null && `waist ${m.waist}cm`, m.arms !== null && `arms ${m.arms}cm`, m.legs !== null && `legs ${m.legs}cm`].filter(Boolean).join(' · ') || 'No metrics recorded'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Workout plans</CardTitle>
                <CardDescription>Plans assigned to this client</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/workouts?clientId=${clientId}`}>New plan</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {plansData?.plans.length === 0 && <p className="text-sm text-secondary-foreground">No workout plans yet.</p>}
              {plansData?.plans.map((plan) => (
                <Link key={plan.id} href={`/dashboard/workouts/${plan.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3 text-sm transition-all duration-200 hover:border-primary/40">
                  <div>
                    <p className="font-medium">{plan.title}</p>
                    <p className="text-secondary-foreground">{plan.start_date ?? 'No start date'} – {plan.end_date ?? 'No end date'}</p>
                  </div>
                  <span className="rounded-full bg-elevated border border-border px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">{plan.status}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function WeightTrendCard({ label, trend }: { label: string; trend: WeightTrend }) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-3 text-sm">
      <p className="font-medium">{label}</p>
      {!trend.latest ? (
        <p className="text-secondary-foreground">No data recorded yet.</p>
      ) : (
        <>
          <p className="text-secondary-foreground">Latest: {trend.latest.weight}kg on {new Date(trend.latest.recordedAt).toLocaleDateString()}</p>
          {trend.previous && (
            <p className="text-secondary-foreground">
              Previous: {trend.previous.weight}kg ({trend.change !== null && trend.change > 0 ? '+' : ''}{trend.change}kg {trend.direction && TREND_ICON[trend.direction]})
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CheckInForm({ clientId, onCreated }: { clientId: string; onCreated: () => void }) {
  const [mood, setMood] = useState('');
  const [energyLevel, setEnergyLevel] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/clients/${clientId}/check-ins`, {
        mood: mood ? Number(mood) : undefined,
        energyLevel: energyLevel ? Number(energyLevel) : undefined,
        sleepHours: sleepHours ? Number(sleepHours) : undefined,
        weight: weight ? Number(weight) : undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = 'h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:outline-none';

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ciMood">Mood (1–10)</Label>
          <select id="ciMood" className={selectCls} value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ciEnergy">Energy (1–10)</Label>
          <select id="ciEnergy" className={selectCls} value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)}>
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ciSleep">Sleep hours</Label>
          <Input id="ciSleep" type="number" min={0} max={24} step={0.5} placeholder="8" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ciWeight">Weight (kg)</Label>
          <Input id="ciWeight" type="number" min={0} step={0.1} placeholder="75.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ciNotes">Notes</Label>
        <Input id="ciNotes" placeholder="How are you feeling?" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : 'Log check-in'}</Button>
    </form>
  );
}

function MeasurementForm({ clientId, onCreated }: { clientId: string; onCreated: () => void }) {
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [arms, setArms] = useState('');
  const [legs, setLegs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/api/clients/${clientId}/measurements`, {
        weight: weight ? Number(weight) : undefined,
        chest: chest ? Number(chest) : undefined,
        waist: waist ? Number(waist) : undefined,
        arms: arms ? Number(arms) : undefined,
        legs: legs ? Number(legs) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log measurements');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="mWeight">Weight (kg)</Label><Input id="mWeight" type="number" min={0} step={0.1} placeholder="75.0" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="mChest">Chest (cm)</Label><Input id="mChest" type="number" min={0} step={0.1} placeholder="100" value={chest} onChange={(e) => setChest(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="mWaist">Waist (cm)</Label><Input id="mWaist" type="number" min={0} step={0.1} placeholder="80" value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="mArms">Arms (cm)</Label><Input id="mArms" type="number" min={0} step={0.1} placeholder="35" value={arms} onChange={(e) => setArms(e.target.value)} /></div>
        <div className="space-y-2 col-span-2"><Label htmlFor="mLegs">Legs (cm)</Label><Input id="mLegs" type="number" min={0} step={0.1} placeholder="55" value={legs} onChange={(e) => setLegs(e.target.value)} /></div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : 'Log measurements'}</Button>
    </form>
  );
}
