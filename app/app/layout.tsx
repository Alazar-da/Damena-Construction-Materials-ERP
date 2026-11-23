import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import AppShell from './app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await client
    .from('profiles')
    .select('display_name,role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = user.app_metadata?.role || user.user_metadata?.role;
  const isSuperAdmin =
    user.app_metadata?.role === 'super_admin' ||
    user.user_metadata?.role === 'super_admin' ||
    profile?.role === 'super_admin';

  const isManager = !isSuperAdmin && (userRole === 'manager' || profile?.role === 'manager');

  if (isManager) {
    redirect('/manager');
  }

  return (
    <AppShell
      userEmail={user?.email || ''}
      displayName={profile?.display_name && profile.display_name !== user?.email ? profile.display_name : user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''}
      isSuperAdmin={Boolean(isSuperAdmin)}
    >
      {children}
    </AppShell>
  );
}
