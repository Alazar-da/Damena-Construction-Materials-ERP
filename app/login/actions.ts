'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder.supabase.co')) {
    redirect('/?error=missing_env');
  }

  const client = await db();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message || '';
    const lower = msg.toLowerCase();
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('connection')) {
      redirect('/?error=connection');
    }
    if (lower.includes('invalid login credentials')) {
      redirect('/?error=credentials');
    }
    redirect(`/?error=${encodeURIComponent(msg)}`);
  }

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

  redirect(profile?.role === 'super_admin' ? '/owner' : '/manager');
}

export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect('/');
}
