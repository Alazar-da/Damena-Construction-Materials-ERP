'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

const profilePath = (formData: FormData) => String(formData.get('return_to') || '/app/profile');
const withMessage = (path: string, key: 'error' | 'success', value: string) =>
  `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;

export async function updateDisplayName(formData: FormData) {
  const client = await db();
  const returnTo = profilePath(formData);
  const displayName = String(formData.get('display_name') || '').trim();
  if (displayName.length < 2) redirect(withMessage(returnTo, 'error', 'ስምዎ ቢያንስ 2 ፊደላት መሆን አለበት።'));

  const { error } = await client.rpc('update_my_profile', { p_display_name: displayName });
  if (error) redirect(withMessage(returnTo, 'error', error.message));
  const { error: authError } = await client.auth.updateUser({ data: { display_name: displayName } });
  if (authError) redirect(withMessage(returnTo, 'error', authError.message));
  redirect(withMessage(returnTo, 'success', 'ስምዎ ተስተካክሏል።'));
}

export async function updatePassword(formData: FormData) {
  const client = await db();
  const returnTo = profilePath(formData);
  const currentPassword = String(formData.get('current_password') || '');
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirm_password') || '');
  if (!currentPassword) redirect(withMessage(returnTo, 'error', 'የአሁኑን የይለፍ ቃል ያስገቡ።'));
  if (password.length < 8) redirect(withMessage(returnTo, 'error', 'የይለፍ ቃሉ ቢያንስ 8 ቁምፊ ይኑረው።'));
  if (password !== confirmPassword) redirect(withMessage(returnTo, 'error', 'የይለፍ ቃሎቹ አይመሳሰሉም።'));

  const { data: { user } } = await client.auth.getUser();
  if (!user?.email) redirect(withMessage(returnTo, 'error', 'የተጠቃሚ ኢሜይል አልተገኘም።'));
  const { error: verifyError } = await client.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyError) redirect(withMessage(returnTo, 'error', 'የአሁኑ የይለፍ ቃል ትክክል አይደለም።'));

  const { error } = await client.auth.updateUser({ password });
  if (error) redirect(withMessage(returnTo, 'error', error.message));
  redirect(withMessage(returnTo, 'success', 'የይለፍ ቃልዎ ተቀይሯል።'));
}
