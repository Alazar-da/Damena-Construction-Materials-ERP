'use server';
import { z } from 'zod'; import { redirect } from 'next/navigation'; import { createClient } from '@/lib/supabase/server';
const schema=z.object({name:z.string().min(2),employee_number:z.string().optional(),pay_type:z.enum(['monthly','daily','weekly']),rate:z.coerce.number().nonnegative(),contact:z.string().optional()});
export async function createEmployee(formData:FormData){const p=schema.safeParse(Object.fromEntries(formData));if(!p.success)throw new Error('Invalid employee input');const db=await createClient();const {error}=await db.from('employees').insert({...p.data,employee_number:p.data.employee_number||null,contact:p.data.contact||null});if(error)throw new Error('Unable to create employee');redirect('/app/employees');}
