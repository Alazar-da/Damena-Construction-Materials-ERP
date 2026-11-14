'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const client = await db();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) redirect('/login?error=credentials');

  const isSuperAuth =
    data.user.app_metadata?.role === 'super_admin' ||
    data.user.user_metadata?.role === 'super_admin';

  if (isSuperAuth) {
    redirect('/owner');
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  redirect(profile?.role === 'super_admin' ? '/owner' : '/app');
}

export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect('/login');
}
