'use client';

import { useMemo } from 'react';
import { useStudio } from '@/lib/context/studio-context';
import { useApiData } from '@/lib/hooks/use-api-data';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsOverview } from '@/lib/types';

const STAT_CARDS: Array<{ key: keyof AnalyticsOverview; label: string; format?: (value: number) => string }> = [
  { key: 'activeClients', label: 'Active clients' },
  { key: 'newClientsThisMonth', label: 'New clients this month' },
  { key: 'sessionsThisWeek', label: 'Sessions this week' },
  { key: 'completedSessionsThisMonth', label: 'Completed sessions (month)' },
  { key: 'missedSessionsThisMonth', label: 'Missed sessions (month)' },
  { key: 'workoutCompletionRate', label: 'Workout completion rate', format: (v) => `${v}%` },
  { key: 'missedCheckIns', label: 'Clients with missed check-ins' },
];

export default function DashboardOverviewPage() {
  const { activeStudio } = useStudio();

  const url = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/analytics/overview` : null),
    [activeStudio],
  );

  const { data, loading, error } = useApiData<{ overview: AnalyticsOverview }>(url);
  const overview = data?.overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Studio overview</h1>
        <p className="text-sm text-foreground/60">
          A quick look at how {activeStudio?.name} is doing right now.
        </p>
      </div>

      {loading && <p className="text-sm text-foreground/60">Loading overview...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_CARDS.map(({ key, label, format }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl">
                  {format ? format(overview[key]) : overview[key]}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
