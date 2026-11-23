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

  // Try RPC first
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
  } catch {
    // Fall back to direct table update via admin client
  }

  // Resilient fallback with service role admin client
  try {
    const admin = getAdminClient();
    const dbClient = admin || client;

    // 1. Fetch product
    const { data: product, error: fetchErr } = await dbClient
      .from('products')
      .select('id, name, stock_on_hand')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) {
      return { error: 'የተመረጠው ምርት አልተገኘም።' };
    }

    const currentStock = Number(product.stock_on_hand || 0);
    if (currentStock < quantity) {
      return {
        error: `በቂ ክምችት በመጋዘን የለም። አሁን በመጋዘን ያለው፦ ${currentStock.toLocaleString()} ፍሬ ብቻ ነው።`,
      };
    }

    const newStock = Math.max(0, currentStock - quantity);

    // 2. Minus from store stock
    const { error: updateErr } = await dbClient
      .from('products')
      .update({ stock_on_hand: newStock })
      .eq('id', productId);

    if (updateErr) {
      return { error: `ክምችት መቀነስ አልተቻለም፦ ${updateErr.message}` };
    }

    // 3. Log into inventory_movements
    await dbClient.from('inventory_movements').insert({
      product_id: productId,
      quantity_delta: -quantity,
      movement_type: 'breakage',
      reason,
    });

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
