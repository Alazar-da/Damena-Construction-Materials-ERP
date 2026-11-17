import { db } from '@/lib/supabase/server';
import ReportsView from './reports-view';

const todayNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const shiftDay = (day: string, offset: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const dynamic = 'force-dynamic';

export default async function OwnerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const client = await db();
  const today = todayNairobi();
  const params = await searchParams;
  const mode = ['daily', 'weekly', 'monthly', 'custom'].includes(params.period || '')
    ? params.period!
    : 'monthly';

  let from =
    mode === 'daily'
      ? today
      : mode === 'weekly'
      ? shiftDay(today, -6)
      : `${today.slice(0, 7)}-01`;
  let to = today;

  if (mode === 'custom') {
    const valid = (value?: string) => {
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
    from = valid(params.from) ? params.from! : from;
    to = valid(params.to) ? params.to! : today;
    if (from > to) [from, to] = [to, from];
  }

  const startTime = `${from}T00:00:00+03:00`;
  const endTime = `${to}T23:59:59.999+03:00`;

  const [
    { data: sales },
    { data: services },
    { data: payroll },
    { data: production },
    { data: products },
    { data: audit },
  ] = await Promise.all([
    client
      .from('sales')
      .select(
        'id,invoice_number,sale_date,customer_name,total_amount,paid_amount,status,recorded_by,profiles:recorded_by(display_name),sale_lines(item_name_snapshot,quantity,unit_snapshot,unit_price)'
      )
      .gte('sale_date', from)
      .lte('sale_date', to)
      .neq('status', 'void')
      .order('sale_date', { ascending: false })
      .limit(1000),
    client
      .from('service_payments')
      .select('id,service_type,customer_name,amount,created_at')
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .order('created_at', { ascending: false })
      .limit(1000),
    client
      .from('payroll_records')
      .select('id,worker_name,pay_type,period_start,amount,status')
      .eq('status', 'paid')
      .gte('period_start', from)
      .lte('period_start', to)
      .order('period_start', { ascending: false })
      .limit(1000),
    client
      .from('production_runs')
      .select('id,production_date,output_quantity,output_product_id')
      .gte('production_date', from)
      .lte('production_date', to)
      .order('production_date', { ascending: false })
      .limit(1000),
    client
      .from('products')
      .select('id,name,unit,category,stock_on_hand,low_stock_threshold,selling_price')
      .eq('is_active', true)
      .order('name'),
    client
      .from('owner_edit_log')
      .select(
        'id,actor_id,entity_type,entity_id,before_data,after_data,created_at,profiles(display_name)'
      )
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const cementProductIds = (products ?? []).filter((product) => product.category === 'cement').map((product) => product.id);
  const blockProductIds = new Set((products ?? [])
    .filter((product) => product.category === 'brick' || /block|ብሎክ/i.test(product.name))
    .map((product) => product.id));
  const { data: cementMovements } = cementProductIds.length
    ? await client.from('inventory_movements')
        .select('created_at,quantity_delta,product_id')
        .in('product_id', cementProductIds)
        .eq('movement_type', 'internal_use')
        .lt('quantity_delta', 0)
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .limit(5000)
    : { data: [] };

  const dailyYield = new Map<string, { cement: number; blocks: number }>();
  const localDay = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(value));
  for (const movement of cementMovements ?? []) {
    const day = localDay(movement.created_at);
    const totals = dailyYield.get(day) ?? { cement: 0, blocks: 0 };
    totals.cement += Math.abs(Number(movement.quantity_delta));
    dailyYield.set(day, totals);
  }
  for (const run of production ?? []) {
    if (!blockProductIds.has(run.output_product_id)) continue;
    const totals = dailyYield.get(run.production_date) ?? { cement: 0, blocks: 0 };
    totals.blocks += Number(run.output_quantity);
    dailyYield.set(run.production_date, totals);
  }
  const cementYieldChecks = Array.from(dailyYield, ([date, totals]) => ({ date, ...totals }))
    .filter((day) => day.cement > 0)
    .map((day) => ({ ...day, minimum: day.cement * 55, maximum: day.cement * 60,
      flagged: day.blocks < day.cement * 55 || day.blocks > day.cement * 60 }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ReportsView
      mode={mode}
      from={from}
      to={to}
      sales={sales ?? []}
      services={services ?? []}
      payroll={payroll ?? []}
      production={production ?? []}
      products={products ?? []}
      audit={audit ?? []}
      cementYieldChecks={cementYieldChecks}
    />
  );
}
