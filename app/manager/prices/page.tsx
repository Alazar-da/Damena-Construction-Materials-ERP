import { db } from '@/lib/supabase/server';
import PricesView from './prices-view';

export const dynamic = 'force-dynamic';

export default async function ManagerPricesPage() {
  const client = await db();

  const { data: products } = await client
    .from('products')
    .select('id,name,sku,category,unit,selling_price,stock_on_hand,low_stock_threshold,is_active')
    .eq('is_active', true)
    .neq('category', 'cement')
    .not('name', 'ilike', '%cement%')
    .not('name', 'like', '%ሲሚንቶ%')
    .order('name');

  return <PricesView initialProducts={products ?? []} />;
}
