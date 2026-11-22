import { db } from '@/lib/supabase/server';
import PricesView from './prices-view';

export const dynamic = 'force-dynamic';

export default async function AppPricesPage() {
  const c = await db();

  const { data: products } = await c
    .from('products')
    .select('id,name,sku,category,unit,selling_price,stock_on_hand,low_stock_threshold,is_active')
    .eq('is_active', true)
    .order('name');

  // Cement is consumed internally in production and is not sold, so it does not have a selling price.
  const sellableProducts = (products ?? []).filter(
    (p) =>
      p.category !== 'cement' &&
      !p.name.toLowerCase().includes('cement') &&
      !p.name.includes('ሲሚንቶ')
  );

  return <PricesView initialProducts={sellableProducts} />;
}
