import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudioProvider } from '@/lib/context/studio-context';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <StudioProvider>
      <DashboardShell>{children}</DashboardShell>
    </StudioProvider>
  );
}
