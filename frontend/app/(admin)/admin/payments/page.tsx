'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ApiResponse } from '@/lib/types';

interface PaymentRow {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paid_at: string | null;
  created_at: string;
  clients: {
    id: string;
    full_name: string;
    email: string | null;
    studio_id: string;
    studios: { name: string } | null;
  } | null;
}

interface PaymentsResponse {
  payments: PaymentRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-destructive/15 text-destructive',
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);

    apiClient
      .get<ApiResponse<PaymentsResponse>>(`/api/admin/payments?${params}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  const totalPaid = (data?.payments ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-secondary-foreground">
          {data
            ? `${data.total.toLocaleString()} total payments · $${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} shown as paid on this page`
            : 'All payments across the platform'}
        </p>
      </div>

      <div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'pending' | 'paid' | 'failed'); setPage(1); }}
          className="rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Payments</CardTitle>
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
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Paid at</th>
                    <th className="px-6 py-3 text-left font-medium text-secondary-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.payments ?? []).map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-elevated/50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-foreground">{payment.clients?.full_name ?? '—'}</p>
                        <p className="text-xs text-muted">{payment.clients?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {payment.clients?.studios?.name ?? '—'}
                      </td>
                      <td className="px-6 py-3 font-medium text-foreground">
                        ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[payment.status] ?? ''}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(data?.payments ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-secondary-foreground">
                        No payments found
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
