import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import OwnerShell from './owner-shell';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await client
    .from('profiles')
    .select('display_name,role')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin =
    profile?.role === 'super_admin' ||
    user.app_metadata?.role === 'super_admin' ||
    user.user_metadata?.role === 'super_admin';

  if (!isSuperAdmin) redirect('/app');

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
      displayName={profile?.display_name || user.email || 'Super Admin'}
    >
      {children}
    </OwnerShell>
  );
}
