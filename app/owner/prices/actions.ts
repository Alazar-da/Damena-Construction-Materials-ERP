'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase/server';

export async function updateProductPrice(formData: FormData) {
  const c = await db();
  const productId = String(formData.get('product_id'));
  const price = Number(formData.get('selling_price'));

  if (!productId || isNaN(price) || price < 0) {
    throw new Error('Valid price is required');
  }

  const { error } = await c.rpc('update_product_price', {
    p_product_id: productId,
    p_price: price,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/owner/prices');
  revalidatePath('/owner');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/sales');
}

export async function updateProductThreshold(formData: FormData) {
  const c = await db();
  const productId = String(formData.get('product_id'));
  const threshold = Number(formData.get('low_stock_threshold'));

  if (!productId || isNaN(threshold) || threshold < 0) {
    throw new Error('Valid threshold is required');
  }

  const { error } = await c.rpc('update_product_threshold', {
    p_product_id: productId,
    p_threshold: threshold,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/owner/prices');
  revalidatePath('/owner');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/stock');
}
