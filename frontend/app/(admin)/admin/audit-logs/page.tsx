'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/types';

interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  studio_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: { id: string; full_name: string; email: string | null } | null;
}

interface AuditLogsResponse {
  logs: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_COLORS: Record<string, string> = {
  DELETE: 'bg-destructive/15 text-destructive',
  UPDATE: 'bg-yellow-500/15 text-yellow-400',
  CREATE: 'bg-green-500/15 text-green-400',
};

function actionColor(action: string): string {
  for (const prefix of Object.keys(ACTION_COLORS)) {
    if (action.startsWith(prefix)) return ACTION_COLORS[prefix];
  }
  return 'bg-primary/10 text-primary';
}

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) params.set('action', search);
    if (entityType) params.set('entityType', entityType);

    apiClient
      .get<ApiResponse<AuditLogsResponse>>(`/api/admin/audit-logs?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page, search, entityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  const ENTITY_TYPES = ['user', 'studio', 'client', 'exercise'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-secondary-foreground">
          {data ? `${data.total.toLocaleString()} total events` : 'All admin actions and system events'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Filter by action (e.g. DELETE)..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          aria-label="Filter by entity type"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
        >
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="px-6 py-4 text-sm text-secondary-foreground">Loading...</p>}
          {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Action</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Entity</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Actor</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Details</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.logs ?? []).map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        <p>{log.entity_type}</p>
                        {log.entity_id && (
                          <p className="text-xs text-muted font-mono">{log.entity_id.slice(0, 8)}…</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        <p>{log.profiles?.full_name ?? '—'}</p>
                        <p className="text-xs text-muted">{log.profiles?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {Object.keys(log.metadata ?? {}).length > 0 ? (
                          <code className="text-xs text-muted bg-elevated rounded px-1 py-0.5">
                            {JSON.stringify(log.metadata)}
                          </code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(data?.logs ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-secondary-foreground">
                        No audit logs found
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
