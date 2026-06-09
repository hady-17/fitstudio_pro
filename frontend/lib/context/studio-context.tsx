'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';
import type { ApiResponse, Profile, Studio, StudioMember, StudioMemberRole } from '@/lib/types';

interface StudioContextValue {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  memberships: StudioMember[];
  studios: Studio[];
  activeStudio: Studio | null;
  activeRole: StudioMemberRole | null;
  setActiveStudioId: (studioId: string) => void;
  refreshStudios: (selectStudioId?: string) => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<StudioMember[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [activeStudioId, setActiveStudioId] = useState<string | null>(null);

  const load = useCallback(async (selectStudioId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [meRes, studiosRes] = await Promise.all([
        apiClient.get<ApiResponse<{ profile: Profile; memberships: StudioMember[] }>>('/api/auth/me'),
        apiClient.get<ApiResponse<{ studios: Array<{ id: string; role: string; studio: Studio }> }>>(
          '/api/studios/me',
        ),
      ]);

      const myStudios = studiosRes.data.data.studios.map((entry) => entry.studio);

      setProfile(meRes.data.data.profile);
      setMemberships(meRes.data.data.memberships);
      setStudios(myStudios);

      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeStudioId') : null;
      const fallback = myStudios[0]?.id ?? null;
      const initial = selectStudioId ?? (stored && myStudios.some((s) => s.id === stored) ? stored : fallback);
      setActiveStudioId(initial);
      if (typeof window !== 'undefined' && initial) {
        window.localStorage.setItem('activeStudioId', initial);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshStudios = useCallback(
    async (selectStudioId?: string) => {
      await load(selectStudioId);
    },
    [load],
  );

  const handleSetActiveStudioId = (studioId: string) => {
    setActiveStudioId(studioId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('activeStudioId', studioId);
    }
  };

  const activeStudio = useMemo(
    () => studios.find((s) => s.id === activeStudioId) ?? null,
    [studios, activeStudioId],
  );

  const activeRole = useMemo(() => {
    if (!activeStudio) return null;
    const membership = memberships.find((m) => m.studio_id === activeStudio.id);
    return (membership?.role as StudioMemberRole | undefined) ?? null;
  }, [activeStudio, memberships]);

  return (
    <StudioContext.Provider
      value={{
        loading,
        error,
        profile,
        memberships,
        studios,
        activeStudio,
        activeRole,
        setActiveStudioId: handleSetActiveStudioId,
        refreshStudios,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return ctx;
}
