'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStudio } from '@/lib/context/studio-context';
import { useApiData } from '@/lib/hooks/use-api-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsOverview } from '@/lib/types';

export default function AnalyticsPage() {
  const { activeStudio } = useStudio();

  const url = useMemo(
    () => (activeStudio ? `/api/studios/${activeStudio.id}/analytics/overview` : null),
    [activeStudio],
  );

  const { data, loading, error } = useApiData<{ overview: AnalyticsOverview }>(url);
  const overview = data?.overview;

  const sessionsChartData = overview
    ? [
        { name: 'This week', value: overview.sessionsThisWeek },
        { name: 'Completed (mo.)', value: overview.completedSessionsThisMonth },
        { name: 'Missed (mo.)', value: overview.missedSessionsThisMonth },
      ]
    : [];

  const clientsChartData = overview
    ? [
        { name: 'Active clients', value: overview.activeClients },
        { name: 'New this month', value: overview.newClientsThisMonth },
        { name: 'Missed check-ins', value: overview.missedCheckIns },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-foreground/60">
          A closer look at session activity and client engagement for {activeStudio?.name}.
        </p>
      </div>

      {loading && <p className="text-sm text-foreground/60">Loading analytics...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {overview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workout completion rate</CardTitle>
              <CardDescription>
                Share of scheduled workout days that have a completion log this period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-4xl font-bold">{overview.workoutCompletionRate}%</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions</CardTitle>
                <CardDescription>Scheduled, completed and missed sessions</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clients</CardTitle>
                <CardDescription>Active roster, growth and engagement signals</CardDescription>
              </CardHeader>
              <CardContent className="h-72 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientsChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--secondary-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
