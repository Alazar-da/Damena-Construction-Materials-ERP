import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import OwnerShell from './owner-shell';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
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

  if (!isSuperAdmin) {
    if (userRole === 'manager' || profile?.role === 'manager') redirect('/manager');
    redirect('/app');
  }

  // Keep profiles table role in sync
  if (profile && profile.role !== 'super_admin') {
    await client.from('profiles').update({ role: 'super_admin' }).eq('id', user.id);
  } else if (!profile) {
    await client.from('profiles').insert({
      id: user.id,
      display_name: user.email || 'Super Admin',
      role: 'super_admin',
      is_active: true,
    });
  }

  return (
    <OwnerShell
      userEmail={user.email || ''}
      displayName={profile?.display_name && profile.display_name !== user.email ? profile.display_name : user.user_metadata?.display_name || user.email?.split('@')[0] || 'Super Admin'}
    >
      {children}
    </OwnerShell>
  );
}
