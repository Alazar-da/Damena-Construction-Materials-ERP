import { db } from '@/lib/supabase/server';
import ProductionDesk from './production-desk';

export default async function ProductionPage() {
  const c = await db();

  const [
    { data: outputs, error: outputsError },
    { data: runs, error: runsError },
  ] = await Promise.all([
    c
      .from('products')
      .select('id,name,unit')
      .in('name', ['10/10 Block', '15/15 Block', '20/20 Block', 'Terrace'])
      .eq('is_active', true),
    c
      .from('production_runs')
      .select('id,production_date,output_quantity,output_product_id,created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (outputsError)
    throw new Error(`Unable to read production products: ${outputsError.message}`);
  if (runsError)
    throw new Error(`Unable to read production history: ${runsError.message}`);

  return (
    <ProductionDesk
      products={outputs ?? []}
      runs={runs ?? []}
    />
  );
}
