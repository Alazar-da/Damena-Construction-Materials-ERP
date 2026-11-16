'use server';

import {redirect} from 'next/navigation';
import {db} from '@/lib/supabase/server';

export async function updateProductPrice(formData:FormData){
  const client=await db();
  const {error}=await client.rpc('update_product_price',{p_product_id:String(formData.get('product_id')),p_price:Number(formData.get('selling_price'))});
  if(error) throw new Error(error.message);
  redirect('/owner');
}
