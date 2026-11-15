import { db } from '@/lib/supabase/server';
import SalesDesk from './sales-desk';

export default async function SalesPage() {
  const c = await db();

  const [
    { data: products },
    { data: productSales },
    { data: servicePayments },
  ] = await Promise.all([
    c
      .from('products')
      .select('id,name,unit,selling_price,stock_on_hand,category,is_stock_tracked')
      .eq('is_active', true)
      .not('category', 'in', '(service,cement)')
      .order('name'),
    c
      .from('sales')
      .select(
        'id,invoice_number,sale_date,customer_name,total_amount,paid_amount,payment_method,created_at,notes,recorded_by,profiles:recorded_by(display_name),sale_lines(product_id,item_name_snapshot,unit_snapshot,quantity,unit_price,line_total)'
      )
      .order('created_at', { ascending: false })
      .limit(50),
    c
      .from('service_payments')
      .select('id,service_type,customer_name,amount,created_at,notes')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <SalesDesk
      products={products ?? []}
      productSales={productSales ?? []}
      servicePayments={servicePayments ?? []}
    />
  );
}
