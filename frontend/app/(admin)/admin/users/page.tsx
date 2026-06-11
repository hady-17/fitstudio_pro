'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, ShieldOff, Search, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/types';

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  global_role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ userName: string; password: string } | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (search) params.set('search', search);
    if (roleFilter !== 'all') params.set('role', roleFilter);

    apiClient
      .get<ApiResponse<UsersResponse>>(`/api/admin/users?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetPassword = async (user: UserRow) => {
    if (!confirm(`Reset password for ${user.full_name}?\n\nTheir new password will be their name + 123@@`)) return;
    setActionLoading(user.id + '_reset');
    try {
      const res = await apiClient.post<ApiResponse<{ defaultPassword: string }>>(
        `/api/admin/users/${user.id}/reset-password`,
      );
      setResetResult({ userName: user.full_name, password: res.data.data.defaultPassword });
    } catch {
      alert('Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleToggle = async (user: UserRow) => {
    const newRole = user.global_role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${user.full_name}'s role to "${newRole}"?`)) return;
    setActionLoading(user.id);
    try {
      await apiClient.patch(`/api/admin/users/${user.id}/role`, { global_role: newRole });
      fetchUsers();
    } catch {
      alert('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-secondary-foreground">
          {data ? `${data.total.toLocaleString()} total users` : 'All registered users'}
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
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as 'all' | 'user' | 'admin'); setPage(1); }}
          className="rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
        >
          <option value="all">All roles</option>
          <option value="user">Users only</option>
          <option value="admin">Admins only</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="px-6 py-4 text-sm text-secondary-foreground">Loading...</p>}
          {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Joined</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users ?? []).map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3 font-medium text-foreground">{user.full_name}</td>
                      <td className="px-6 py-3 text-secondary-foreground">{user.email ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            user.global_role === 'admin'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {user.global_role === 'admin' ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          {user.global_role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!!actionLoading}
                            onClick={() => handleRoleToggle(user)}
                          >
                            {user.global_role === 'admin' ? 'Remove admin' : 'Make admin'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!!actionLoading}
                            onClick={() => handleResetPassword(user)}
                            title="Reset to default password"
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Reset pwd
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(data?.users ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-secondary-foreground">
                        No users found
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

      <Dialog open={!!resetResult} onOpenChange={() => setResetResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-secondary-foreground">
              The password for <strong className="text-foreground">{resetResult?.userName}</strong> has
              been reset. Share this temporary password with them and ask them to change it after
              signing in.
            </p>
            <div className="rounded-xl border border-border bg-elevated px-4 py-3">
              <p className="text-xs text-muted mb-1">New password</p>
              <p className="font-mono text-base font-semibold text-foreground">{resetResult?.password}</p>
            </div>
            <Button className="w-full" onClick={() => setResetResult(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
