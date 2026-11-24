'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const returnPath = (formData: FormData) => String(formData.get('return_to') || '/manager/machinery');
const message = (path: string, key: 'error' | 'success', value: string) =>
  `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthorizedUser() {
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  if (role !== 'manager' && role !== 'super_admin') {
    return null;
  }
  return { user, role, client };
}

export async function addMachinery(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም። ስራ አስኪያጅ ወይም ዋና ባለቤት ብቻ ማሽን መመዝገብ ይችላሉ።'));
  }

  const { user, client } = auth;
  const name = String(formData.get('name') || '').trim();
  const quantity = Number(formData.get('quantity'));
  const photo = formData.get('photo');

  if (name.length < 2) redirect(message(path, 'error', 'የማሽኑን ስም ያስገቡ።'));
  if (!Number.isFinite(quantity) || quantity <= 0) redirect(message(path, 'error', 'ብዛቱ ከ0 በላይ መሆን አለበት።'));

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith('image/')) redirect(message(path, 'error', 'የሚጫነው ፋይል የምስል ፎቶ መሆን አለበት።'));
    if (photo.size > 5 * 1024 * 1024) redirect(message(path, 'error', 'ፎቶው ከ5MB መብለጥ የለበትም።'));

    const extension = photo.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from('machinery-photos').upload(photoPath, await photo.arrayBuffer(), {
      contentType: photo.type,
      upsert: false,
    });
    if (uploadError) redirect(message(path, 'error', `ፎቶው አልተጫነም፦ ${uploadError.message}`));
  }

  const insertPayload = {
    name,
    category: 'other',
    quantity,
    status: 'available',
    photo_path: photoPath,
    created_by: user.id,
  };

  const { error } = await client.from('machinery').insert(insertPayload);

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('machinery').insert(insertPayload);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/owner/machinery');
  revalidatePath('/manager/machinery');
  redirect(message(path, 'success', 'ማሽኑ ተመዝግቧል።'));
}

export async function updateMachinery(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም።'));
  }

  const { client } = auth;
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const quantity = Number(formData.get('quantity'));

  if (!id) redirect(message(path, 'error', 'የማሽኑ መለያ አልተገኘም።'));
  if (name.length < 2) redirect(message(path, 'error', 'የማሽኑን ስም ያስገቡ።'));
  if (!Number.isFinite(quantity) || quantity <= 0) redirect(message(path, 'error', 'ብዛቱ ከ0 በላይ መሆን አለበት።'));

  const updatePayload = {
    name,
    quantity,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from('machinery').update(updatePayload).eq('id', id);

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('machinery').update(updatePayload).eq('id', id);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/owner/machinery');
  revalidatePath('/manager/machinery');
  redirect(message(path, 'success', 'የማሽኑ መረጃ በተሳካ ሁኔታ ተሻሽሏል።'));
}

export async function deleteMachinery(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም።'));
  }

  const { client } = auth;
  const id = String(formData.get('id') || '').trim();
  const photoPath = String(formData.get('photo_path') || '').trim();

  if (!id) redirect(message(path, 'error', 'የማሽኑ መለያ አልተገኘም።'));

  if (photoPath) {
    await client.storage.from('machinery-photos').remove([photoPath]);
  }

  const { error } = await client.from('machinery').delete().eq('id', id);

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('machinery').delete().eq('id', id);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/owner/machinery');
  revalidatePath('/manager/machinery');
  redirect(message(path, 'success', 'ማሽኑ በተሳካ ሁኔታ ተሰርዟል።'));
}
