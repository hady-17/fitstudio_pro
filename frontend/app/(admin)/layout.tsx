import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('global_role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.global_role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <AdminShell profile={{ full_name: profile.full_name, email: profile.email }}>
      {children}
    </AdminShell>
  );
}
