import {db} from '@/lib/supabase/server';
import OwnerRecords from './records-view';

export const dynamic='force-dynamic';

export default async function OwnerRecordsPage(){
  const client=await db();
  const [{data:sales},{data:services},{data:payroll},{data:production},{data:movements}]=await Promise.all([
    client.from('sales').select('id,invoice_number,sale_date,customer_name,total_amount,paid_amount,payment_method,status,notes,created_at,recorded_by,sale_lines(id,quantity,unit_price,product_id,item_name_snapshot,unit_snapshot)').neq('status','void').order('created_at',{ascending:false}).limit(300),
    client.from('service_payments').select('id,service_type,customer_name,amount,notes,created_at').order('created_at',{ascending:false}).limit(300),
    client.from('payroll_records').select('id,worker_name,pay_type,period_start,amount,rate_snapshot,payment_method,status,notes,created_at,created_by').eq('status','paid').order('created_at',{ascending:false}).limit(300),
    client.from('production_runs').select('id,production_date,output_product_id,output_quantity,notes,created_at,products(name,unit)').order('created_at',{ascending:false}).limit(300),
    client.from('inventory_movements').select('id,product_id,quantity_delta,movement_type,reason,created_at,products(name,unit)').in('movement_type',['receipt','internal_use']).order('created_at',{ascending:false}).limit(300),
  ]);
  return <OwnerRecords sales={sales??[]} services={services??[]} payroll={payroll??[]} production={production??[]} movements={(movements??[]).filter(m=>m.reason!=='Used in production')}/>;
}
