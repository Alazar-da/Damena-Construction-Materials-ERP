import { db } from '@/lib/supabase/server';
import DashboardView from './dashboard-view';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const nextDay = (day: string) => {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const client = await db();
  const date = today();

  const [
    { data: products },
    { data: movements },
    { data: todayMovements },
    { data: production },
    { data: services },
  ] = await Promise.all([
    client
      .from('products')
      .select('id,name,category,unit,stock_on_hand')
      .eq('is_active', true),
    client
      .from('inventory_movements')
      .select('id,quantity_delta,movement_type,created_at,reason,product_id')
      .order('created_at', { ascending: false })
      .limit(5),
    client
      .from('inventory_movements')
      .select('quantity_delta')
      .eq('movement_type', 'internal_use')
      .gte('created_at', `${date}T00:00:00+03:00`)
      .lt('created_at', `${nextDay(date)}T00:00:00+03:00`),
    client
      .from('production_runs')
      .select('output_quantity')
      .eq('production_date', date),
    client
      .from('service_payments')
      .select('service_type,amount')
      .gte('created_at', `${date}T00:00:00+03:00`)
      .lt('created_at', `${nextDay(date)}T00:00:00+03:00`),
  ]);

  const productNames = new Map((products ?? []).map((product) => [product.id, product.name]));
  const cementQuantity = (products ?? [])
    .filter((product) => product.category === 'cement')
    .reduce((total, product) => total + Number(product.stock_on_hand), 0);
  const cementUsed = (todayMovements ?? []).reduce(
    (total, movement) => total + Math.abs(Number(movement.quantity_delta)),
    0
  );
  const producedQuantity = (production ?? []).reduce(
    (total, run) => total + Number(run.output_quantity),
    0
  );

  const serviceLabels: Record<string, string> = {
    battery_charging: 'ባትሪ መሙላት',
    battery_acid: 'የባትሪ አሲድ መሙላት',
    welding: 'ብየዳ',
  };
  const totals = new Map<string, number>([
    ['battery_charging', 0],
    ['battery_acid', 0],
    ['welding', 0],
  ]);
  for (const service of services ?? []) {
    totals.set(service.service_type, (totals.get(service.service_type) ?? 0) + Number(service.amount));
  }
  const serviceTotals = [...totals.entries()].map(([id, amount]) => ({
    id,
    label: serviceLabels[id] ?? id.replaceAll('_', ' '),
    amount,
  }));

  const localizeName = (name: string) =>
    name
      .replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ')
      .replace(/Cement 50kg/i, 'ሲሚንቶ 50 ኪ.ግ.')
      .replace(/Terrace/i, 'ቴራሶ');

  const movementRows = (movements ?? []).map((movement) => ({
    id: movement.id,
    product_name: localizeName(productNames.get(movement.product_id) ?? 'እቃ'),
    quantity_delta: Number(movement.quantity_delta),
    movement_type: movement.movement_type,
    created_at: movement.created_at,
    reason: movement.reason,
  }));

  const dateLabel = new Intl.DateTimeFormat('am-ET', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00+03:00`));

  return (
    <DashboardView
      dateLabel={dateLabel}
      cementQuantity={cementQuantity}
      cementUsed={cementUsed}
      producedQuantity={producedQuantity}
      serviceRevenue={serviceTotals.reduce((total, service) => total + service.amount, 0)}
      serviceTotals={serviceTotals}
      movements={movementRows}
    />
  );
}
