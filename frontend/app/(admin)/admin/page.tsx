'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, UserCheck, CalendarClock, CreditCard, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiResponse } from '@/lib/types';

interface SystemStats {
  totalUsers: number;
  totalStudios: number;
  totalClients: number;
  totalSessions: number;
  totalPayments: number;
  totalRevenue: number;
  newUsersThisWeek: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-secondary-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<{ stats: SystemStats }>>('/api/admin/stats')
      .then((res) => setStats(res.data.data.stats))
      .catch(() => setError('Failed to load system stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-secondary-foreground">Loading stats...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">System Overview</h1>
        <p className="text-sm text-secondary-foreground">Platform-wide statistics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          sub={`+${stats.newUsersThisWeek} this week`}
        />
        <StatCard
          title="Total Studios"
          value={stats.totalStudios.toLocaleString()}
          icon={Building2}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients.toLocaleString()}
          icon={UserCheck}
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          icon={CalendarClock}
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments.toLocaleString()}
          icon={CreditCard}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          sub="From paid invoices"
        />
      </div>
    </div>
  );
}
