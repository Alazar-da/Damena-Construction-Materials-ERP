'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function resolveProductionAlert(formData: FormData) {
  const periodKey = String(formData.get('period_key') || '').trim();
  const productKey = String(formData.get('product_key') || '').trim();
  const resolutionNote = String(formData.get('resolution_note') || '').trim();
  const returnTo = String(formData.get('return_to') || '/manager').trim();
  const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/manager';

  if (!periodKey || !productKey) {
    redirect(safeReturnTo);
  }

  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'manager' && profile?.role !== 'super_admin') {
    redirect(safeReturnTo);
  }

  const payload = {
    period_key: periodKey,
    product_key: productKey,
    resolution_note: resolutionNote || 'ተጣርቶ ተዘግቷል',
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  };

  let { error } = await client
    .from('production_alert_resolutions')
    .upsert(payload, { onConflict: 'period_key,product_key' });

  if (error) {
    const serviceClient = getServiceClient();
    if (serviceClient) {
      const res = await serviceClient
        .from('production_alert_resolutions')
        .upsert(payload, { onConflict: 'period_key,product_key' });
      error = res.error;
    }
  }

  if (error) {
    console.warn('Could not save production alert resolution:', error.message);
    const sep = safeReturnTo.includes('?') ? '&' : '?';
    const errMsg =
      error.code === '42P01' || error.message?.includes('does not exist')
        ? 'እባክዎ መጀመሪያ supabase/production_alert_resolutions.sql ን በSupabase SQL Editor ውስጥ ያስኪዱ።'
        : `ማስጠንቀቂያውን ማንሳት አልተቻለም፦ ${error.message}`;
    redirect(`${safeReturnTo}${sep}alert_error=${encodeURIComponent(errMsg)}`);
  }

  revalidatePath('/manager');
  revalidatePath('/owner');
  revalidatePath('/manager/reports');
  revalidatePath('/owner/reports');
  revalidatePath('/app/reports');

  redirect(safeReturnTo);
}
