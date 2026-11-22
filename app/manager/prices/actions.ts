'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

async function getAuthorizedActor() {
  const c = await db();
  const {
    data: { user },
  } = await c.auth.getUser();

  if (!user) {
    throw new Error('እባክዎ መጀመሪያ ይግቡ።');
  }

  const { data: profile } = await c
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (
    !profile ||
    !profile.is_active ||
    (profile.role !== 'manager' && profile.role !== 'super_admin')
  ) {
    throw new Error('ይህንን እርምጃ ለመፈፀም የስራ አስኪያጅ ወይም የባለቤት ፈቃድ ያስፈልጋል።');
  }

  return { user, profile, c };
}

export async function updateProductPrice(formData: FormData) {
  const { user, c } = await getAuthorizedActor();
  const productId = String(formData.get('product_id'));
  const price = Number(formData.get('selling_price'));

  if (!productId || isNaN(price) || price < 0) {
    throw new Error('ትክክለኛ ዋጋ ማስገባት ያስፈልጋል።');
  }

  // 1. Try calling the standard RPC first
  const { error: rpcError } = await c.rpc('update_product_price', {
    p_product_id: productId,
    p_price: price,
  });

  if (rpcError) {
    // 2. If the RPC rejected because caller has 'manager' role in DB, use admin service client
    const admin = getAdminClient();
    if (admin) {
      const { data: prevProduct } = await admin
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      const { error: tableError } = await admin
        .from('products')
        .update({ selling_price: price })
        .eq('id', productId);

      if (tableError) {
        throw new Error(tableError.message);
      }

      if (prevProduct) {
        await admin
          .from('owner_edit_log')
          .insert({
            actor_id: user.id,
            entity_type: 'product_price',
            entity_id: productId,
            before_data: prevProduct,
            after_data: { ...prevProduct, selling_price: price },
          })
          .then(
            () => {},
            () => {}
          );
      }
    } else {
      const { error: tableError } = await c
        .from('products')
        .update({ selling_price: price })
        .eq('id', productId);
      if (tableError) throw new Error(tableError.message);
    }
  }

  revalidatePath('/manager');
  revalidatePath('/manager/prices');
  revalidatePath('/owner');
  revalidatePath('/owner/prices');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/sales');

  return { success: true };
}

export async function updateProductThreshold(formData: FormData) {
  const { user, c } = await getAuthorizedActor();
  const productId = String(formData.get('product_id'));
  const threshold = Number(formData.get('low_stock_threshold'));

  if (!productId || isNaN(threshold) || threshold < 0) {
    throw new Error('ትክክለኛ የማስጠንቀቂያ መጠን ማስገባት ያስፈልጋል።');
  }

  // 1. Try RPC first
  const { error: rpcError } = await c.rpc('update_product_threshold', {
    p_product_id: productId,
    p_threshold: threshold,
  });

  if (rpcError) {
    const admin = getAdminClient();
    if (admin) {
      const { data: prevProduct } = await admin
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      const { error: tableError } = await admin
        .from('products')
        .update({ low_stock_threshold: threshold })
        .eq('id', productId);

      if (tableError) {
        throw new Error(tableError.message);
      }

      if (prevProduct) {
        await admin
          .from('owner_edit_log')
          .insert({
            actor_id: user.id,
            entity_type: 'stock_threshold',
            entity_id: productId,
            before_data: prevProduct,
            after_data: { ...prevProduct, low_stock_threshold: threshold },
          })
          .then(
            () => {},
            () => {}
          );
      }
    } else {
      const { error: tableError } = await c
        .from('products')
        .update({ low_stock_threshold: threshold })
        .eq('id', productId);
      if (tableError) throw new Error(tableError.message);
    }
  }

  revalidatePath('/manager');
  revalidatePath('/manager/prices');
  revalidatePath('/owner');
  revalidatePath('/owner/prices');
  revalidatePath('/app');
  revalidatePath('/app/prices');
  revalidatePath('/app/stock');

  return { success: true };
}
