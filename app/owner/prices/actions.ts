'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function updateProductPrice(formData: FormData) {
  const c = await db();
  const productId = String(formData.get('product_id'));
  const price = Number(formData.get('selling_price'));

  if (!productId || isNaN(price) || price < 0) {
    throw new Error('Valid price is required');
  }

  const { error: rpcError } = await c.rpc('update_product_price', {
    p_product_id: productId,
    p_price: price,
  });

  if (rpcError) {
    const admin = getAdminClient();
    if (admin) {
      const { error: tableError } = await admin
        .from('products')
        .update({ selling_price: price })
        .eq('id', productId);
      if (tableError) throw new Error(tableError.message);
    } else {
      throw new Error(rpcError.message);
    }
  }

  revalidatePath('/owner/prices');
  revalidatePath('/owner');
  revalidatePath('/manager');
  revalidatePath('/manager/prices');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/sales');

  return { success: true };
}

export async function updateProductThreshold(formData: FormData) {
  const c = await db();
  const productId = String(formData.get('product_id'));
  const threshold = Number(formData.get('low_stock_threshold'));

  if (!productId || isNaN(threshold) || threshold < 0) {
    throw new Error('Valid threshold is required');
  }

  const { error: rpcError } = await c.rpc('update_product_threshold', {
    p_product_id: productId,
    p_threshold: threshold,
  });

  if (rpcError) {
    const admin = getAdminClient();
    if (admin) {
      const { error: tableError } = await admin
        .from('products')
        .update({ low_stock_threshold: threshold })
        .eq('id', productId);
      if (tableError) throw new Error(tableError.message);
    } else {
      throw new Error(rpcError.message);
    }
  }

  revalidatePath('/owner/prices');
  revalidatePath('/owner');
  revalidatePath('/manager');
  revalidatePath('/manager/prices');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/stock');

  return { success: true };
}
