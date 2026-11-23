import { db } from '@/lib/supabase/server';
import BreakageDesk, { type BreakageProduct, type BreakageMovement } from './breakage-desk';

export const dynamic = 'force-dynamic';

export default async function BreakagePage() {
  const client = await db();

  const [
    { data: products },
    { data: movements },
  ] = await Promise.all([
    client
      .from('products')
      .select('id,name,unit,stock_on_hand,selling_price,category')
      .in('name', ['10/10 Block', '15/15 Block', '20/20 Block', 'Terrace'])
      .eq('is_active', true),
    client
      .from('inventory_movements')
      .select('id,product_id,quantity_delta,movement_type,reason,created_at,products(name,unit,selling_price)')
      .eq('movement_type', 'breakage')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Ensure deterministic order for the 4 products: 10/10, 15/15, 20/20, Terrace
  const ORDER = ['10/10 Block', '15/15 Block', '20/20 Block', 'Terrace'];
  const sortedProducts = ((products as BreakageProduct[]) ?? []).sort(
    (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)
  );

  return (
    <BreakageDesk
      products={sortedProducts}
      records={(movements as BreakageMovement[]) ?? []}
    />
  );
}
