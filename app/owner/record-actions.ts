'use server';

import {redirect} from 'next/navigation';
import {db} from '@/lib/supabase/server';

async function save(rpc:string,args:Record<string,unknown>){
  const client=await db();
  const {error}=await client.rpc(rpc,args);
  if(error) throw new Error(error.message);
  redirect('/owner/records');
}

export async function updateOwnerSale(formData:FormData){
  await save('owner_update_sale',{p_sale_id:String(formData.get('id')),p_quantity:Number(formData.get('quantity')),p_unit_price:Number(formData.get('unit_price')),p_customer_name:String(formData.get('customer_name')||''),p_paid_amount:Number(formData.get('paid_amount')),p_payment_method:String(formData.get('payment_method')),p_sale_date:String(formData.get('sale_date')),p_notes:String(formData.get('notes')||'')});
}
export async function updateOwnerService(formData:FormData){
  await save('owner_update_service_payment',{p_id:String(formData.get('id')),p_service_type:String(formData.get('service_type')),p_customer_name:String(formData.get('customer_name')||''),p_amount:Number(formData.get('amount')),p_notes:String(formData.get('notes')||'')});
}
export async function updateOwnerPayroll(formData:FormData){
  await save('owner_update_payroll',{p_id:String(formData.get('id')),p_worker_name:String(formData.get('worker_name')),p_pay_type:String(formData.get('pay_type')),p_period_start:String(formData.get('period_start')),p_amount:Number(formData.get('amount')),p_payment_method:String(formData.get('payment_method')),p_notes:String(formData.get('notes')||'')});
}
export async function updateOwnerProduction(formData:FormData){
  await save('owner_update_production',{p_id:String(formData.get('id')),p_production_date:String(formData.get('production_date')),p_output_quantity:Number(formData.get('output_quantity')),p_notes:String(formData.get('notes')||'')});
}
export async function updateOwnerMovement(formData:FormData){
  await save('owner_update_movement',{p_id:String(formData.get('id')),p_quantity:Number(formData.get('quantity')),p_reason:String(formData.get('reason')||'')});
}
