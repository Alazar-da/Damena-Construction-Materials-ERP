'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

const returnPath = (formData: FormData) => String(formData.get('return_to') || '/app/machinery');
const message = (path: string, key: 'error' | 'success', value: string) =>
  `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;

const allowedCategories = new Set(['production', 'tool', 'vehicle', 'other']);
const allowedStatuses = new Set(['available', 'in_use', 'maintenance', 'out_of_service']);

export async function addMachinery(formData: FormData) {
  const client = await db();
  const path = returnPath(formData);
  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || 'other');
  const quantity = Number(formData.get('quantity'));
  const status = String(formData.get('status') || 'available');
  const location = String(formData.get('location') || '').trim();
  const notes = String(formData.get('notes') || '').trim();
  const photo = formData.get('photo');

  if (name.length < 2) redirect(message(path, 'error', 'የማሽኑን ስም ያስገቡ።'));
  if (!allowedCategories.has(category)) redirect(message(path, 'error', 'የማሽኑ ዓይነት አይሰራም።'));
  if (!Number.isFinite(quantity) || quantity <= 0) redirect(message(path, 'error', 'ብዛቱ ከ0 በላይ መሆን አለበት።'));
  if (!allowedStatuses.has(status)) redirect(message(path, 'error', 'የማሽኑ ሁኔታ አይሰራም።'));

  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(message(path, 'error', 'እባክዎ እንደገና ይግቡ።'));

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

  const { error } = await client.from('machinery').insert({
    name,
    category,
    quantity,
    status,
    location: location || null,
    notes: notes || null,
    photo_path: photoPath,
    created_by: user.id,
  });
  if (error) redirect(message(path, 'error', error.message));

  revalidatePath('/app/machinery');
  revalidatePath('/owner/machinery');
  revalidatePath('/manager/machinery');
  redirect(message(path, 'success', 'ማሽኑ ተመዝግቧል።'));
}
