import { db } from '@/lib/supabase/server';
import PricesView from './prices-view';

export const dynamic = 'force-dynamic';

export default async function OwnerPricesPage() {
  const c = await db();

  const { data: products } = await c
    .from('products')
    .select('id,name,sku,category,unit,selling_price,stock_on_hand,low_stock_threshold,is_active')
    .eq('is_active', true)
    .order('name');

  return <PricesView initialProducts={products ?? []} />;
}
