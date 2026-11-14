import { db } from '@/lib/supabase/server';
import AppShell from './app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();

  let isSuperAdmin =
    user?.app_metadata?.role === 'super_admin' ||
    user?.user_metadata?.role === 'super_admin';

  if (!isSuperAdmin && user) {
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isSuperAdmin = profile?.role === 'super_admin';
  }

  return (
    <AppShell userEmail={user?.email || ''} isSuperAdmin={Boolean(isSuperAdmin)}>
      {children}
    </AppShell>
  );
}
