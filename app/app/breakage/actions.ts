'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export type BreakageState = {
  success?: boolean;
  error?: string;
};

export async function recordBreakage(
  _prevState: BreakageState,
  formData: FormData
): Promise<BreakageState> {
  const productId = String(formData.get('product_id') || '').trim();
  const rawQuantity = String(formData.get('quantity') || '').trim();
  const quantity = Number(rawQuantity);
  const reason = String(formData.get('reason') || '').trim() || 'በትራንስፖርት/በሽያጭ ወቅት የተሰበረ';

  if (!productId) {
    return { error: 'እባክዎ የምርት ዓይነት ይምረጡ።' };
  }
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    return { error: 'የተሰበረው ብዛት ከ 0 በላይ መሆን አለበት።' };
  }

  const client = await db();

  // 1. Try RPC first
  try {
    const { error: rpcError } = await client.rpc('record_broken_materials', {
      p_product_id: productId,
      p_quantity: quantity,
      p_reason: reason,
    });

    if (!rpcError) {
      revalidatePath('/app/breakage');
      revalidatePath('/app/stock');
      revalidatePath('/app/sales');
      revalidatePath('/app/reports');
      revalidatePath('/owner/reports');
      revalidatePath('/manager/reports');
      return { success: true };
    }

    // If RPC returned a specific business exception, return it directly
    if (rpcError && rpcError.code !== 'PGRST202') {
      return { error: rpcError.message };
    }
  } catch (rpcEx: unknown) {
    console.error('RPC call error:', rpcEx);
  }

  // 2. Resilient fallback with client & service role
  try {
    const admin = getAdminClient();

    // Fetch product using user's authenticated client first, then admin
    let product: { id: string; name: string; stock_on_hand: number } | null = null;
    const { data: clientProduct } = await client
      .from('products')
      .select('id, name, stock_on_hand')
      .eq('id', productId)
      .maybeSingle();

    if (clientProduct) {
      product = clientProduct;
    } else if (admin) {
      const { data: adminProduct } = await admin
        .from('products')
        .select('id, name, stock_on_hand')
        .eq('id', productId)
        .maybeSingle();
      if (adminProduct) product = adminProduct;
    }

    if (!product) {
      return { error: 'የተመረጠው ምርት አልተገኘም። እባክዎ ገጹን ሪፍሬሽ አድርገው እንደገና ይሞክሩ።' };
    }

    const currentStock = Number(product.stock_on_hand || 0);
    if (currentStock < quantity) {
      return {
        error: `በቂ ክምችት በመጋዘን የለም። አሁን በመጋዘን ያለው፦ ${currentStock.toLocaleString()} ፍሬ ብቻ ነው።`,
      };
    }

    const newStock = Math.max(0, currentStock - quantity);

    // Update stock via admin or client
    let updateSuccess = false;
    let lastError = '';

    if (admin) {
      const { error: adminUpdateErr } = await admin
        .from('products')
        .update({ stock_on_hand: newStock })
        .eq('id', productId);
      if (!adminUpdateErr) {
        updateSuccess = true;
      } else {
        lastError = adminUpdateErr.message;
      }
    }

    if (!updateSuccess) {
      const { error: clientUpdateErr } = await client
        .from('products')
        .update({ stock_on_hand: newStock })
        .eq('id', productId);
      if (!clientUpdateErr) {
        updateSuccess = true;
      } else {
        lastError = clientUpdateErr.message;
      }
    }

    if (!updateSuccess) {
      return {
        error: `ክምችት መቀነስ አልተቻለም። እባክዎ በ Supabase SQL Editor ውስጥ breakage_setup.sql ፋይልን ያሂዱ (${lastError})`,
      };
    }

    // Insert movement
    const movementPayload = {
      product_id: productId,
      quantity_delta: -quantity,
      movement_type: 'breakage',
      reason,
    };

    if (admin) {
      await admin.from('inventory_movements').insert(movementPayload);
    } else {
      await client.from('inventory_movements').insert(movementPayload);
    }

    revalidatePath('/app/breakage');
    revalidatePath('/app/stock');
    revalidatePath('/app/sales');
    revalidatePath('/app/reports');
    revalidatePath('/owner/reports');
    revalidatePath('/manager/reports');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'ስብርባሪውን መመዝገብ አልተቻለም።';
    return { error: message };
  }
}
