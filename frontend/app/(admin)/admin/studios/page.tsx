'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/types';

interface StudioRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  profiles: { full_name: string; email: string | null } | null;
  member_count: number;
  client_count: number;
}

interface StudiosResponse {
  studios: StudioRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminStudiosPage() {
  const [data, setData] = useState<StudiosResponse | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchStudios = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) params.set('search', search);

    apiClient
      .get<ApiResponse<StudiosResponse>>(`/api/admin/studios?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load studios'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchStudios();
  }, [fetchStudios]);

  const handleDelete = async (studio: StudioRow) => {
    if (
      !confirm(
        `Delete studio "${studio.name}"?\n\nThis will permanently delete all members, clients, sessions, and workout plans associated with this studio. This action cannot be undone.`,
      )
    )
      return;

    setDeleting(studio.id);
    try {
      await apiClient.delete(`/api/admin/studios/${studio.id}`);
      fetchStudios();
    } catch {
      alert('Failed to delete studio');
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Studios</h1>
        <p className="text-sm text-secondary-foreground">
          {data ? `${data.total.toLocaleString()} total studios` : 'All studios on the platform'}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search by name..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Studios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="px-6 py-4 text-sm text-secondary-foreground">Loading...</p>}
          {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Studio</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Owner</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Members</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Clients</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Created</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.studios ?? []).map((studio) => (
                    <tr key={studio.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-foreground">{studio.name}</p>
                        <p className="text-xs text-muted">{studio.slug}</p>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        <p>{studio.profiles?.full_name ?? '—'}</p>
                        <p className="text-xs text-muted">{studio.profiles?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">{studio.member_count}</td>
                      <td className="px-6 py-3 text-secondary-foreground">{studio.client_count}</td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {new Date(studio.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                          disabled={deleting === studio.id}
                          onClick={() => handleDelete(studio)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(data?.studios ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-secondary-foreground">
                        No studios found
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
