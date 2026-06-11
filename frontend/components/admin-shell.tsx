'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Dumbbell,
  CreditCard,
  ScrollText,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/studios', label: 'Studios', icon: Building2, exact: false },
  { href: '/admin/clients', label: 'Clients', icon: UserCheck, exact: false },
  { href: '/admin/exercises', label: 'Exercises', icon: Dumbbell, exact: false },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, exact: false },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, exact: false },
];

interface AdminShellProps {
  children: React.ReactNode;
  profile: { full_name: string; email: string | null };
}

export function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

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
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-destructive" />
            <span className="font-display text-lg font-extrabold text-foreground">Admin Panel</span>
          </div>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-destructive">
            FitStudio Pro
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out',
                  active
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-transparent text-secondary-foreground hover:border-destructive/40 hover:text-destructive',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex w-full items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2 text-sm font-medium text-secondary-foreground transition-all duration-200 ease-in-out hover:border-primary/40 hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex w-full items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2 text-sm font-medium text-secondary-foreground transition-all duration-200 ease-in-out hover:border-destructive/40 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive uppercase tracking-widest">
              Admin Mode
            </span>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-foreground">{profile.full_name ?? '—'}</p>
            <p className="text-secondary-foreground">{profile.email}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-destructive/5 to-transparent px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
