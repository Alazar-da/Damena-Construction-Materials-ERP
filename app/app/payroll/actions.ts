'use server';
import { z } from 'zod'; import { redirect } from 'next/navigation'; import { createClient } from '@/lib/supabase/server';
const schema=z.object({employee_id:z.string().uuid(),period_start:z.string(),quantity:z.coerce.number().positive(),notes:z.string().optional()});
export async function createPayroll(formData:FormData){const p=schema.safeParse(Object.fromEntries(formData));if(!p.success)throw new Error('Invalid payroll input');const db=await createClient();const {error}=await db.rpc('create_payroll_record',{p_employee_id:p.data.employee_id,p_period_start:p.data.period_start,p_quantity:p.data.quantity,p_notes:p.data.notes||null});if(error)throw new Error(error.message);redirect('/app/payroll');}
