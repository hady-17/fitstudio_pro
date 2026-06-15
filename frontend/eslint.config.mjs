import nextPlugin from 'eslint-config-next/core-web-vitals';

export default [
  ...nextPlugin,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // eslint-plugin-react-hooks v7's recommended config flags the
      // fetch-on-mount `useEffect(() => { fetchX() }, [fetchX])` pattern used
      // throughout the dashboard (lib/hooks/use-api-data.ts and friends) as
      // an error. Downgraded to a warning pending the Phase 9 data-fetching
      // refactor (NEXT_PHASE_PLAN.md).
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
