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

export async function receive(formData: FormData) {
  const c = await db();
  const { error } = await c.rpc('receive_cement', {
    p_quantity: Number(formData.get('quantity')),
    p_reason: String(formData.get('reason') || 'Cement received'),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/app/stock');
  redirect('/app/stock');
}

export async function issue(formData: FormData) {
  const c = await db();
  const { error } = await c.rpc('issue_cement', {
    p_quantity: Number(formData.get('quantity')),
    p_reason: String(formData.get('reason') || 'Used for 10/10 Block'),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/app/stock');
  redirect('/app/stock');
}

export async function approveCementDelivery(formData: FormData) {
  const expenseId = String(formData.get('expense_id') || '').trim();
  const countedQuantity = Number(formData.get('counted_quantity'));
  const notes = String(formData.get('notes') || '').trim();

  if (!expenseId || !Number.isFinite(countedQuantity) || countedQuantity <= 0) {
    redirect('/app/stock?error=' + encodeURIComponent('እባክዎ ትክክለኛ የከረጢት ብዛት ያስገቡ።'));
  }

  const c = await db();
  const adminDb = getServiceClient() || c;

  // Check if this is a follow-up receipt for missing bags on an already partially-received session
  const { data: preCheckRow } = await adminDb
    .from('expenses')
    .select('quantity, verified_quantity, delivery_status, notes')
    .eq('id', expenseId)
    .single();

  if (preCheckRow?.delivery_status === 'delivered' && preCheckRow?.verified_quantity != null) {
    const prevVerified = Number(preCheckRow.verified_quantity || 0);
    const newTotalVerified = prevVerified + countedQuantity;

    const { data: cementProduct } = await adminDb
      .from('products')
      .select('id, stock_on_hand')
      .eq('sku', 'CEMENT-50KG')
      .single();

    if (cementProduct) {
      const currentStock = Number(cementProduct.stock_on_hand || 0);
      await adminDb
        .from('products')
        .update({ stock_on_hand: currentStock + countedQuantity })
        .eq('id', cementProduct.id);

      await adminDb.from('inventory_movements').insert({
        product_id: cementProduct.id,
        quantity_delta: countedQuantity,
        movement_type: 'receipt',
        reason: `ተጨማሪ ቆጠራ (+${countedQuantity} ከረጢት)${notes ? ` - ${notes}` : ''}`,
      });
    }

    const existingNotes = preCheckRow.notes || '';
    const followUpTag = `[ተጨማሪ ቆጠራ፦ +${countedQuantity} ከረጢት${notes ? ` - ${notes}` : ''}]`;
    const updatedNotes = existingNotes ? `${existingNotes} · ${followUpTag}` : followUpTag;

    await adminDb
      .from('expenses')
      .update({
        verified_quantity: newTotalVerified,
        notes: updatedNotes,
        verified_at: new Date().toISOString(),
      })
      .eq('id', expenseId);

    revalidatePath('/app/stock');
    revalidatePath('/manager/expenses');
    revalidatePath('/owner/expenses');
    redirect('/app/stock?success=' + encodeURIComponent(`+${countedQuantity} ከረጢት ሲሚንቶ ወደዚሁ መዝገብ ተጨምሯል (ጠቅላላ የገባ፦ ${newTotalVerified})።`));
  }

  // Try PostgreSQL RPC function first for initial pending delivery
  const { error: rpcError } = await c.rpc('approve_cement_delivery', {
    p_expense_id: expenseId,
    p_counted_quantity: countedQuantity,
    p_notes: notes || null,
  });

  if (!rpcError) {
    // Ensure the admin's count note / discrepancy reason is saved on expenses.notes
    // even if an older version of the RPC ran on the database
    const { data: expRow } = await adminDb
      .from('expenses')
      .select('quantity, notes')
      .eq('id', expenseId)
      .single();

    if (expRow) {
      const existingNotes = expRow.notes || '';
      const expectedQty = Number(expRow.quantity || countedQuantity);
      const diff = countedQuantity - expectedQty;

      if (!existingNotes.includes('[ቆጠራ')) {
        let updatedExpNotes: string | null = existingNotes || null;
        if (notes) {
          updatedExpNotes = existingNotes ? `${existingNotes} · [ቆጠራ፦ ${notes}]` : `[ቆጠራ፦ ${notes}]`;
        } else if (diff < 0) {
          updatedExpNotes = existingNotes
            ? `${existingNotes} · [ቆጠራ፦ ${Math.abs(diff)} ከረጢት ጉድለት]`
            : `[ቆጠራ፦ ${Math.abs(diff)} ከረጢት ጉድለት]`;
        }

        if (updatedExpNotes !== expRow.notes) {
          await adminDb
            .from('expenses')
            .update({ notes: updatedExpNotes })
            .eq('id', expenseId);
        }
      }
    }
  } else {
    // Graceful fallback: update cement stock in products and inventory_movements
    const { data: cementProduct } = await adminDb
      .from('products')
      .select('id, stock_on_hand')
      .eq('sku', 'CEMENT-50KG')
      .single();

    const { data: expRow } = await adminDb
      .from('expenses')
      .select('quantity, notes')
      .eq('id', expenseId)
      .single();

    const expectedQty = Number(expRow?.quantity || countedQuantity);
    const diff = countedQuantity - expectedQty;
    let finalReason = notes;
    if (!finalReason) {
      if (diff < 0) {
        finalReason = `ከግዢ የተረጋገጠ ሲሚንቶ (${Math.abs(diff)} ከረጢት ጉድለት ተገኝቷል)`;
      } else if (diff > 0) {
        finalReason = `ከግዢ የተረጋገጠ ሲሚንቶ (+${diff} ከረጢት ትርፍ)`;
      } else {
        finalReason = 'ከግዢ የተረጋገጠ ሲሚንቶ';
      }
    } else if (diff < 0) {
      finalReason += ` (${Math.abs(diff)} ከረጢት ጉድለት)`;
    }

    let updatedExpNotes = expRow?.notes || null;
    if (notes) {
      updatedExpNotes = expRow?.notes ? `${expRow.notes} · [ቆጠራ፦ ${notes}]` : `[ቆጠራ፦ ${notes}]`;
    } else if (diff < 0) {
      updatedExpNotes = expRow?.notes ? `${expRow.notes} · [ቆጠራ፦ ${Math.abs(diff)} ከረጢት ጉድለት]` : `[ቆጠራ፦ ${Math.abs(diff)} ከረጢት ጉድለት]`;
    }

    if (cementProduct) {
      const currentStock = Number(cementProduct.stock_on_hand || 0);
      await adminDb
        .from('products')
        .update({ stock_on_hand: currentStock + countedQuantity })
        .eq('id', cementProduct.id);

      await adminDb.from('inventory_movements').insert({
        product_id: cementProduct.id,
        quantity_delta: countedQuantity,
        movement_type: 'receipt',
        reason: finalReason,
      });
    }

    // Update expense record delivery_status
    await adminDb
      .from('expenses')
      .update({
        delivery_status: 'delivered',
        verified_quantity: countedQuantity,
        notes: updatedExpNotes,
        verified_at: new Date().toISOString(),
      })
      .eq('id', expenseId);
  }

  revalidatePath('/app/stock');
  revalidatePath('/manager/expenses');
  revalidatePath('/owner/expenses');
  redirect('/app/stock?success=' + encodeURIComponent(`${countedQuantity} ከረጢት ሲሚንቶ ተቆጥሮ ወደ መጋዘን ገብቷል።`));
}
