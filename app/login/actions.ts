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
  const selectedPortal = String(formData.get('portal') || '').toLowerCase();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message || '';
    const lower = msg.toLowerCase();
    const portalQuery = selectedPortal ? `&portal=${encodeURIComponent(selectedPortal)}` : '';
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('connection')) {
      redirect(`/?error=connection${portalQuery}`);
    }
    if (lower.includes('invalid login credentials')) {
      redirect(`/?error=credentials${portalQuery}`);
    }
    redirect(`/?error=${encodeURIComponent(msg)}${portalQuery}`);
  }

  const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
  let isSuperAdmin = metaRole === 'super_admin';
  const isManager = metaRole === 'manager';

  if (!isSuperAdmin) {
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role === 'super_admin') {
      isSuperAdmin = true;
    }
  }

  if (isSuperAdmin) {
    // If Super Admin specifically selected manager or admin portal tab, route there
    if (selectedPortal === 'manager') {
      redirect('/manager');
    }
    if (selectedPortal === 'admin') {
      redirect('/app');
    }
    redirect('/owner');
  }

  if (isManager) {
    redirect('/manager');
  }

  // Admin / Operations staff portal
  redirect('/app');
}

export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect('/');
}
