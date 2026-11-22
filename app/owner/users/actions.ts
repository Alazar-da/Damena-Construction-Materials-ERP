'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';

export async function createAdmin(formData: FormData) {
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await client.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'super_admin' || !profile.is_active) redirect('/app');

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const displayName = String(formData.get('display_name') || '').trim();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirm_password') || '');
  if (!email || !email.includes('@')) redirect('/owner/users?error=' + encodeURIComponent('እባክዎ ትክክለኛ ኢሜይል ያስገቡ።'));
  if (password.length < 8) redirect('/owner/users?error=' + encodeURIComponent('የይለፍ ቃሉ ቢያንስ 8 ቁምፊ መሆን አለበት።'));
  if (password !== confirmPassword) redirect('/owner/users?error=' + encodeURIComponent('የይለፍ ቃሎቹ አይመሳሰሉም።'));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) redirect('/owner/users?error=' + encodeURIComponent('የSupabase አስተዳዳሪ ቁልፍ (Service Key) አልተዘጋጀም።'));

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName || email.split('@')[0], role: 'admin' },
  });
  let accountId = data.user?.id;
  let restoredExisting = false;
  if (!accountId && error) {
    const message = error.message.toLowerCase();
    const duplicate = message.includes('already') || message.includes('registered') || message.includes('exists');
    if (!duplicate) redirect(`/owner/users?error=${encodeURIComponent(error.message || 'መለያ መፍጠር አልተቻለም')}`);

    for (let page = 1; page <= 10 && !accountId; page += 1) {
      const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) redirect(`/owner/users?error=${encodeURIComponent(listError.message)}`);
      const existingUser = usersPage.users.find((account) => account.email?.toLowerCase() === email);
      if (existingUser) accountId = existingUser.id;
      if (usersPage.users.length < 1000) break;
    }
    if (!accountId) redirect('/owner/users?error=' + encodeURIComponent('የተመዘገበው ተጠቃሚ አልተገኘም።'));

    const { data: existingProfile } = await client.from('profiles').select('role').eq('id', accountId).maybeSingle();
    if (existingProfile?.role === 'super_admin') redirect('/owner/users?error=' + encodeURIComponent('የዋና አስተዳዳሪ (Super Admin) መለያን እዚህ ማስተካከል አይቻልም።'));

    const { error: updateError } = await admin.auth.admin.updateUserById(accountId, {
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email.split('@')[0], role: 'admin' },
    });
    if (updateError) redirect(`/owner/users?error=${encodeURIComponent(updateError.message)}`);
    restoredExisting = true;
  }

  const { error: profileError } = await client.rpc('owner_assign_admin_profile', {
    p_user_id: accountId!,
    p_display_name: displayName || email.split('@')[0],
  });
  if (profileError) redirect(`/owner/users?error=${encodeURIComponent(profileError.message)}`);
  redirect(`/owner/users?success=${encodeURIComponent(restoredExisting ? 'የነበረው የስራ አስኪያጅ መለያ የይለፍ ቃል ተቀይሮ ተስተካክሏል።' : 'የስራ አስኪያጅ (Manager) መለያ በተሳካ ሁኔታ ተፈጥሯል!')}`);
}
