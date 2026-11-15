'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

export async function createPayroll(formData: FormData) {
  const c = await db();
  const periodStart = String(formData.get('period_start') || today());

  const { error } = await c.rpc('create_payroll_payment', {
    p_worker_name: String(formData.get('worker_name')),
    p_pay_type: String(formData.get('pay_type')),
    p_period_start: periodStart,
    p_amount: Number(formData.get('amount')),
    p_notes: String(formData.get('notes') || '') || null,
    p_payment_method: String(formData.get('payment_method') || 'cash'),
  });

  if (error) throw new Error(error.message);
  redirect('/app/payroll');
}
