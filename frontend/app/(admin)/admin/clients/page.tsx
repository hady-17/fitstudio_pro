'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/types';

interface ClientRow {
  id: string;
  full_name: string;
  email: string | null;
  status: 'active' | 'paused' | 'cancelled';
  goal: string | null;
  joined_at: string;
  studio_id: string;
  studios: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface ClientsResponse {
  clients: ClientRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400',
  paused: 'bg-yellow-500/15 text-yellow-400',
  cancelled: 'bg-destructive/15 text-destructive',
};

const NEXT_STATUSES: Record<string, { label: string; value: 'active' | 'paused' | 'cancelled' }[]> = {
  active: [
    { label: 'Set paused', value: 'paused' },
    { label: 'Set inactive', value: 'cancelled' },
  ],
  paused: [
    { label: 'Set active', value: 'active' },
    { label: 'Set inactive', value: 'cancelled' },
  ],
  cancelled: [
    { label: 'Set active', value: 'active' },
    { label: 'Set paused', value: 'paused' },
  ],
};

export default function AdminClientsPage() {
  const [data, setData] = useState<ClientsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    apiClient
      .get<ApiResponse<ClientsResponse>>(`/api/admin/clients?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleStatusChange = async (client: ClientRow, newStatus: 'active' | 'paused' | 'cancelled') => {
    setActionLoading(client.id);
    try {
      await apiClient.patch(`/api/admin/clients/${client.id}/status`, { status: newStatus });
      fetchClients();
    } catch {
      alert('Failed to update client status');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Clients</h1>
        <p className="text-sm text-secondary-foreground">
          {data ? `${data.total.toLocaleString()} total clients across all studios` : 'All clients on the platform'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'paused' | 'cancelled'); setPage(1); }}
          className="rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Inactive</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="px-6 py-4 text-sm text-secondary-foreground">Loading...</p>}
          {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Client</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Studio</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Trainer</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Joined</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.clients ?? []).map((client) => (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-foreground">{client.full_name}</p>
                        <p className="text-xs text-muted">{client.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">{client.studios?.name ?? '—'}</td>
                      <td className="px-6 py-3 text-secondary-foreground">{client.profiles?.full_name ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[client.status] ?? ''}`}>
                          {client.status === 'cancelled' ? 'inactive' : client.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {new Date(client.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {NEXT_STATUSES[client.status]?.map((s) => (
                            <Button
                              key={s.value}
                              size="sm"
                              variant="ghost"
                              disabled={actionLoading === client.id}
                              onClick={() => handleStatusChange(client, s.value)}
                              className={s.value === 'cancelled' ? 'text-destructive border-destructive/30 hover:bg-destructive/10' : ''}
                            >
                              {s.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(data?.clients ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-secondary-foreground">
                        No clients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-secondary-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
