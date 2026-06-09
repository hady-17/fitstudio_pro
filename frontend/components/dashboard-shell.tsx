'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CalendarClock,
  BarChart3,
  Zap,
  Settings,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStudio } from '@/lib/context/studio-context';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiResponse, Studio } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/dashboard/sessions', label: 'Sessions', icon: CalendarClock },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/exercises', label: 'Exercises', icon: Zap },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, error, profile, studios, activeStudio, activeRole, setActiveStudioId, refreshStudios } = useStudio();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-[#0D0D0D] md:flex">
        <div className="px-6 py-5">
          <span className="font-display text-lg font-extrabold text-foreground">FitStudio Pro</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent text-secondary-foreground hover:border-primary/40 hover:text-primary',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4">
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex w-full items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2 text-sm font-medium text-secondary-foreground transition-all duration-200 ease-in-out hover:border-primary/40 hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            {studios.length > 1 ? (
              <select
                aria-label="Active studio"
                className="rounded-xl border border-border bg-elevated px-2 py-1 text-sm font-semibold text-foreground transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:outline-none"
                value={activeStudio?.id ?? ''}
                onChange={(e) => setActiveStudioId(e.target.value)}
              >
                {studios.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="font-display text-sm font-bold text-foreground">{activeStudio?.name ?? 'No studio yet'}</h2>
            )}
            {activeRole && <p className="text-xs font-semibold uppercase tracking-widest text-muted">{activeRole}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-foreground">{profile?.full_name ?? '—'}</p>
            <p className="text-secondary-foreground">{profile?.email}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-primary/5 to-transparent px-6 py-6">
          {loading && <p className="text-sm text-secondary-foreground">Loading your account...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && !activeStudio && (
            <CreateStudioCard onCreated={(studio) => refreshStudios(studio.id)} />
          )}
          {!loading && !error && activeStudio && children}
        </main>
      </div>
    </div>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CreateStudioCard({ onCreated }: { onCreated: (studio: Studio) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post<ApiResponse<{ studio: Studio }>>('/api/studios', {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
      onCreated(res.data.data.studio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create studio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create your studio</CardTitle>
          <CardDescription>
            You&apos;re not a member of any studio yet. Set one up to start adding clients,
            building workout plans, and booking sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="studioName">Studio name</Label>
              <Input
                id="studioName"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Fitness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studioSlug">Slug</Label>
              <Input
                id="studioSlug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="acme-fitness"
              />
              <p className="text-xs text-muted">
                Lowercase letters, numbers and hyphens only. Used in your studio&apos;s URL.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studioDescription">Description (optional)</Label>
              <Input
                id="studioDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your studio"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create studio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
