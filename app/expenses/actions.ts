'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';

const allowedCategories = new Set(['production_materials', 'workshop_services', 'other']);

const returnPath = (formData: FormData) => {
  const raw = String(formData.get('return_to') || '/manager/expenses');
  return raw === '/owner/expenses' ? '/owner/expenses' : '/manager/expenses';
};

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
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile?.is_active) return null;
  if (profile.role !== 'manager' && profile.role !== 'super_admin') {
    return null;
  }

  return { user, role: profile.role, client };
}

export async function addExpense(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም። ስራ አስኪያጅ ወይም ዋና ባለቤት ብቻ ወጪ መመዝገብ ይችላሉ።'));
  }

  const { user, client } = auth;
  const category = String(formData.get('category') || '').trim();
  const itemName = String(formData.get('item_name') || '').trim();
  const amount = Number(formData.get('amount'));
  const expenseDate = String(formData.get('expense_date') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  if (!allowedCategories.has(category)) {
    redirect(message(path, 'error', 'እባክዎ ትክክለኛ የወጪ ምድብ ይምረጡ።'));
  }
  if (itemName.length < 2) {
    redirect(message(path, 'error', 'እባክዎ የተገዛውን እቃ ወይም የወጪውን ስም ያስገቡ።'));
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(message(path, 'error', 'የገንዘብ መጠኑ ከ0 ብር በላይ መሆን አለበት።'));
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ? expenseDate : today;

  const rawQty = formData.get('quantity');
  const quantity = rawQty ? Number(rawQty) : null;
  const isCement = category === 'production_materials' && itemName.toLowerCase().includes('ሲሚንቶ');

  const insertPayload: Record<string, unknown> = {
    expense_date: validDate,
    category,
    item_name: itemName,
    amount,
    notes: notes || null,
    recorded_by: user.id,
  };

  if (isCement && quantity && quantity > 0) {
    insertPayload.quantity = quantity;
    insertPayload.delivery_status = 'pending';
  }

  let { error } = await client.from('expenses').insert(insertPayload);

  // If column error occurs (e.g. table not yet migrated on remote db), fallback without breaking
  if (error && (error.message?.includes('column') || error.code === '42703')) {
    delete insertPayload.quantity;
    delete insertPayload.delivery_status;
    if (quantity) {
      insertPayload.notes = `[የተገዛ፦ ${quantity} ከረጢት] ${notes || ''}`.trim();
    }
    const res = await client.from('expenses').insert(insertPayload);
    error = res.error;
  }

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('expenses').insert(insertPayload);
      if (serviceError) {
        redirect(message(path, 'error', serviceError.message));
      }
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/manager/expenses');
  revalidatePath('/owner/expenses');
  redirect(message(path, 'success', 'ወጪው በተሳካ ሁኔታ ተመዝግቧል።'));
}

export async function updateExpense(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም።'));
  }

  const { client } = auth;
  const id = String(formData.get('id') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const itemName = String(formData.get('item_name') || '').trim();
  const amount = Number(formData.get('amount'));
  const rawQuantity = String(formData.get('quantity') || '').trim();
  const expenseDate = String(formData.get('expense_date') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  if (!id) redirect(message(path, 'error', 'የወጪው መለያ አልተገኘም።'));
  if (!allowedCategories.has(category)) redirect(message(path, 'error', 'ትክክለኛ የወጪ ምድብ ይምረጡ።'));
  if (itemName.length < 2) redirect(message(path, 'error', 'የእቃውን ወይም የወጪውን ስም ያስገቡ።'));
  if (!Number.isFinite(amount) || amount <= 0) redirect(message(path, 'error', 'የገንዘብ መጠኑ ከ0 ብር በላይ መሆን አለበት።'));

  let quantity: number | null = null;
  if (rawQuantity) {
    const parsedQty = Number(rawQuantity);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      redirect(message(path, 'error', 'ትክክለኛ የሲሚንቶ ከረጢት ብዛት ያስገቡ።'));
    }
    quantity = parsedQty;
  }

  const adminDb = getServiceRoleClient() || client;
  const { data: existingExp } = await adminDb
    .from('expenses')
    .select('quantity, verified_quantity, delivery_status, verified_at')
    .eq('id', id)
    .single();

  let finalNotes = notes;
  const verifiedQty =
    existingExp?.verified_quantity != null ? Number(existingExp.verified_quantity) : null;

  // If manager corrected the cement quantity to match what actually arrived, clean up old shortage tags in notes
  if (
    quantity !== null &&
    existingExp?.delivery_status === 'delivered' &&
    verifiedQty !== null &&
    quantity === verifiedQty &&
    finalNotes
  ) {
    finalNotes = finalNotes
      .replace(/\[(?:ተጨማሪ\s+)?ቆጠራ፦[^\]]*ጉድለት[^\]]*\]/g, '')
      .replace(/(?:^\s*·\s*|\s*·\s*$)/g, '')
      .replace(/\s*·\s*·\s*/g, ' · ')
      .trim();
  }

  const updatePayload: Record<string, string | number | null> = {
    category,
    item_name: itemName,
    amount,
    notes: finalNotes || null,
    updated_at: new Date().toISOString(),
  };

  if (quantity !== null) {
    updatePayload.quantity = quantity;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    updatePayload.expense_date = expenseDate;
  }

  let { error } = await client.from('expenses').update(updatePayload).eq('id', id);

  if (error && (error.message?.includes('column') || error.code === '42703')) {
    delete updatePayload.quantity;
    const retryRes = await client.from('expenses').update(updatePayload).eq('id', id);
    error = retryRes.error;
  }

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('expenses').update(updatePayload).eq('id', id);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  // Sync cement store inventory_movements ("የእንቅስቃሴ ታሪክ") if manager edited/corrected the cement quantity
  if (
    quantity !== null &&
    existingExp?.delivery_status === 'delivered' &&
    verifiedQty !== null
  ) {
    try {
      const { error: syncRpcErr } = await client.rpc('sync_cement_movement_for_expense', {
        p_expense_id: id,
      });

      if (syncRpcErr) {
        const { data: cementProd } = await adminDb
          .from('products')
          .select('id')
          .eq('sku', 'CEMENT-50KG')
          .single();

        if (cementProd) {
          const { data: recentReceipts } = await adminDb
            .from('inventory_movements')
            .select('id, quantity_delta, reason, created_at')
            .eq('product_id', cementProd.id)
            .eq('movement_type', 'receipt')
            .order('created_at', { ascending: false })
            .limit(30);

          if (recentReceipts && recentReceipts.length > 0) {
            const verifiedTime = existingExp.verified_at
              ? new Date(existingExp.verified_at).getTime()
              : null;

            let target = recentReceipts.find((m) => {
              if (verifiedTime) {
                const diffMs = Math.abs(new Date(m.created_at).getTime() - verifiedTime);
                if (diffMs <= 120_000) return true;
              }
              return false;
            });

            if (!target) {
              target = recentReceipts.find(
                (m) =>
                  Number(m.quantity_delta) === verifiedQty ||
                  (m.reason || '').includes('ጉድለት')
              );
            }

            if (target) {
              const diff = verifiedQty - quantity;
              let updatedReason = 'ከግዢ የተረጋገጠ ሲሚንቶ (ሙሉ ገብቷል — በስራ አስኪያጅ ተስተካክሏል)';
              if (diff < 0) {
                updatedReason = `ከግዢ የተረጋገጠ ሲሚንቶ (${Math.abs(diff)} ከረጢት ጉድለት ተገኝቷል)`;
              } else if (diff > 0) {
                updatedReason = `ከግዢ የተረጋገጠ ሲሚንቶ (+${diff} ከረጢት ትርፍ)`;
              }

              await adminDb
                .from('inventory_movements')
                .update({ reason: updatedReason })
                .eq('id', target.id);
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('Could not sync inventory_movements reason after expense edit:', syncErr);
    }
  }

  revalidatePath('/manager/expenses');
  revalidatePath('/owner/expenses');
  revalidatePath('/app/stock');
  redirect(message(path, 'success', 'የወጪው መረጃ በተሳካ ሁኔታ ተሻሽሏል።'));
}

export async function deleteExpense(formData: FormData) {
  const path = returnPath(formData);
  const auth = await getAuthorizedUser();
  if (!auth) {
    redirect(message(path, 'error', 'ይህንን እርምጃ ለመፈጸም ፈቃድ የለዎትም።'));
  }

  const { client } = auth;
  const id = String(formData.get('id') || '').trim();
  if (!id) redirect(message(path, 'error', 'የወጪው መለያ አልተገኘም።'));

  const { error } = await client.from('expenses').delete().eq('id', id);

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('expenses').delete().eq('id', id);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/manager/expenses');
  revalidatePath('/owner/expenses');
  redirect(message(path, 'success', 'ወጪው በተሳካ ሁኔታ ተሰርዟል።'));
}
