/**
 * Chainable Supabase query-builder mock.
 * All fluent methods (select, eq, order, …) return `this`.
 * Terminal methods (maybeSingle, single) and plain `await` all
 * resolve with the configured { data, error, count } object.
 */
export function qb(result: {
  data?: any;
  error?: any;
  count?: number | null;
} = {}) {
  const r = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };

  const b: any = {};

  const chainable = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'not', 'is', 'ilike', 'like',
    'lt', 'lte', 'gt', 'gte',
    'or', 'and', 'filter', 'contains',
    'order', 'range', 'limit', 'offset',
  ];

  chainable.forEach((m) => {
    b[m] = jest.fn().mockReturnThis();
  });

  b.maybeSingle = jest.fn().mockResolvedValue(r);
  b.single = jest.fn().mockResolvedValue(r);

  // Makes `await builder` work (no terminal method called)
  b.then = (
    onFulfilled?: (value: any) => any,
    onRejected?: (reason: any) => any,
  ) => Promise.resolve(r).then(onFulfilled, onRejected);

  b.catch = (onRejected?: (reason: any) => any) =>
    Promise.resolve(r).catch(onRejected);

  return b;
}

/** Short DB error object for simulating Supabase error responses */
export const dbErr = { message: 'db error', code: '500' };
