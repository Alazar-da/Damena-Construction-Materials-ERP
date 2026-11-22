import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import ManagerShell from './manager-shell';

export const dynamic = 'force-dynamic';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
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
    profile?.role === 'super_admin' ||
    user.app_metadata?.role === 'super_admin' ||
    user.user_metadata?.role === 'super_admin';

  const isManager = isSuperAdmin || userRole === 'manager';

  if (!isManager) {
    redirect('/app');
  }

  return (
    <ManagerShell
      userEmail={user.email || ''}
      displayName={
        profile?.display_name && profile.display_name !== user.email
          ? profile.display_name
          : user.user_metadata?.display_name || user.email?.split('@')[0] || 'Manager'
      }
    >
      {children}
    </ManagerShell>
  );
}
