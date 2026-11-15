'use server'; import {redirect} from 'next/navigation'; import {db} from '@/lib/supabase/server';
export async function recordService(formData:FormData){const c=await db(); const {error}=await c.rpc('record_service_payment',{p_service_type:String(formData.get('service_type')),p_customer_name:String(formData.get('customer_name')||''),p_amount:Number(formData.get('amount')),p_notes:String(formData.get('notes')||'')}); if(error) throw new Error(error.message); redirect('/app/sales');}
export type ProductSaleState = { error: string };
export async function recordProductSale(_previousState: ProductSaleState, formData: FormData): Promise<ProductSaleState> {
  const c=await db(); const saleDate=String(formData.get('sale_date')||'');
  const {error}=await c.rpc('record_product_sale',{p_product_id:String(formData.get('product_id')),p_quantity:Number(formData.get('quantity')),p_customer_name:String(formData.get('customer_name')||''),p_payment_method:String(formData.get('payment_method')||'cash'),p_sale_date:saleDate||null,p_notes:String(formData.get('notes')||'')});
  if(error) return {error: error.message.toLowerCase().includes('insufficient stock') ? 'Not enough stock to complete this sale. Refresh the page to see the latest quantity, then reduce the sale quantity or record new production/stock.' : error.message};
  redirect('/app/sales');
}
