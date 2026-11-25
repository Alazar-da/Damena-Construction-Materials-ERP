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

  const insertPayload = {
    expense_date: validDate,
    category,
    item_name: itemName,
    amount,
    notes: notes || null,
    recorded_by: user.id,
  };

  const { error } = await client.from('expenses').insert(insertPayload);

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
  const expenseDate = String(formData.get('expense_date') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  if (!id) redirect(message(path, 'error', 'የወጪው መለያ አልተገኘም።'));
  if (!allowedCategories.has(category)) redirect(message(path, 'error', 'ትክክለኛ የወጪ ምድብ ይምረጡ።'));
  if (itemName.length < 2) redirect(message(path, 'error', 'የእቃውን ወይም የወጪውን ስም ያስገቡ።'));
  if (!Number.isFinite(amount) || amount <= 0) redirect(message(path, 'error', 'የገንዘብ መጠኑ ከ0 ብር በላይ መሆን አለበት።'));

  const updatePayload: Record<string, string | number | null> = {
    category,
    item_name: itemName,
    amount,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  if (/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    updatePayload.expense_date = expenseDate;
  }

  const { error } = await client.from('expenses').update(updatePayload).eq('id', id);

  if (error) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { error: serviceError } = await serviceClient.from('expenses').update(updatePayload).eq('id', id);
      if (serviceError) redirect(message(path, 'error', serviceError.message));
    } else {
      redirect(message(path, 'error', error.message));
    }
  }

  revalidatePath('/manager/expenses');
  revalidatePath('/owner/expenses');
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
