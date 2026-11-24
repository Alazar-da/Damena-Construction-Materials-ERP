import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StaffMachineryPage() {
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  if (role === 'super_admin') {
    redirect('/owner/machinery');
  } else if (role === 'manager') {
    redirect('/manager/machinery');
  } else {
    redirect('/app');
  }
}
