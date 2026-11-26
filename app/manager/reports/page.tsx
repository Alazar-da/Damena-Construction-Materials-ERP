import { db } from '@/lib/supabase/server';
import ReportsView from '@/app/owner/reports/reports-view';
import { getTodayEthiopic, ethiopicToGregorian } from '@/lib/ethiopian-calendar';

const todayNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const shiftDay = (day: string, offset: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const dynamic = 'force-dynamic';

export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const client = await db();
  const today = todayNairobi();
  const params = await searchParams;
  const mode = ['daily', 'weekly', 'monthly', 'half_year', 'year', 'custom'].includes(params.period || '')
    ? params.period!
    : 'monthly';

  const todayEth = getTodayEthiopic();
  const ethMonthStart = ethiopicToGregorian(todayEth.year, todayEth.month, 1);

  let from =
    mode === 'daily'
      ? today
      : mode === 'weekly'
        ? shiftDay(today, -6)
        : mode === 'monthly'
          ? ethMonthStart
          : mode === 'half_year'
            ? shiftDay(today, -180)
            : mode === 'year'
              ? shiftDay(today, -365)
              : ethMonthStart;
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
    { data: breakages },
    { data: expenses },
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
      .limit(5000),
    client
      .from('service_payments')
      .select('id,service_type,customer_name,amount,created_at')
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .order('created_at', { ascending: false })
      .limit(5000),
    client
      .from('payroll_records')
      .select('id,worker_name,pay_type,period_start,amount,status')
      .eq('status', 'paid')
      .gte('period_start', from)
      .lte('period_start', to)
      .order('period_start', { ascending: false })
      .limit(5000),
    client
      .from('production_runs')
      .select('id,production_date,output_quantity,output_product_id')
      .gte('production_date', from)
      .lte('production_date', to)
      .order('production_date', { ascending: false })
      .limit(5000),
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
      .limit(5000),
    client
      .from('inventory_movements')
      .select(
        'id,product_id,quantity_delta,movement_type,reason,created_at,products(name,unit,selling_price)'
      )
      .eq('movement_type', 'breakage')
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .order('created_at', { ascending: false })
      .limit(5000),
    client
      .from('expenses')
      .select('id,expense_date,category,item_name,amount,notes,created_at,profiles:recorded_by(display_name)')
      .gte('expense_date', from)
      .lte('expense_date', to)
      .order('expense_date', { ascending: false })
      .limit(5000),
  ]);

  const CERT_CONFIGS = [
    { name: '10/10 ብሎክ', key: '10/10', minRate: 65, maxRate: 70, threshold: 65 },
    { name: '15/15 ብሎክ', key: '15/15', minRate: 60, maxRate: 65, threshold: 60 },
    { name: '20/20 ብሎክ', key: '20/20', minRate: 55, maxRate: 60, threshold: 55 },
  ];

  const cementProductIds = (products ?? []).filter((product) => product.category === 'cement').map((product) => product.id);
  const { data: cementMovements } = cementProductIds.length
    ? await client.from('inventory_movements')
      .select('created_at,quantity_delta,product_id,reason')
      .in('product_id', cementProductIds)
      .eq('movement_type', 'internal_use')
      .lt('quantity_delta', 0)
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .limit(5000)
    : { data: [] };

  const localDay = (value: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(value));

  // Key: `${date}:${productKey}`
  const dailyProductYield = new Map<
    string,
    { date: string; productKey: string; productName: string; cement: number; blocks: number }
  >();

  for (const m of cementMovements ?? []) {
    const day = localDay(m.created_at);
    const reason = (m.reason || '').toLowerCase();
    for (const cfg of CERT_CONFIGS) {
      if (reason.includes(cfg.key)) {
        const k = `${day}:${cfg.key}`;
        const existing = dailyProductYield.get(k) ?? {
          date: day,
          productKey: cfg.key,
          productName: cfg.name,
          cement: 0,
          blocks: 0,
        };
        existing.cement += Math.abs(Number(m.quantity_delta));
        dailyProductYield.set(k, existing);
      }
    }
  }

  for (const run of production ?? []) {
    const prod = (products ?? []).find((p) => p.id === run.output_product_id);
    if (!prod) continue;
    for (const cfg of CERT_CONFIGS) {
      if (prod.name.includes(cfg.key)) {
        const k = `${run.production_date}:${cfg.key}`;
        const existing = dailyProductYield.get(k) ?? {
          date: run.production_date,
          productKey: cfg.key,
          productName: cfg.name,
          cement: 0,
          blocks: 0,
        };
        existing.blocks += Number(run.output_quantity);
        dailyProductYield.set(k, existing);
      }
    }
  }

  const resolvedMap = new Map<string, string>();
  try {
    const { data: resolutions, error: resErr } = await client
      .from('production_alert_resolutions')
      .select('period_key, product_key, resolution_note')
      .gte('period_key', from)
      .lte('period_key', to);
    if (!resErr && resolutions) {
      for (const r of resolutions) {
        resolvedMap.set(`${r.period_key}:${r.product_key}`, r.resolution_note || 'ተጣርቷል');
      }
    }
  } catch {
    // ignore if table not created yet
  }

  const cementYieldChecks = Array.from(dailyProductYield.values())
    .filter((d) => (d.cement > 0 || d.blocks > 0) && d.date < today)
    .map((item) => {
      const cfg = CERT_CONFIGS.find((c) => c.key === item.productKey)!;
      const minExpected = item.cement * cfg.minRate;
      const maxExpected = item.cement * cfg.maxRate;
      const shortfall = minExpected - item.blocks;
      const rawFlagged = item.cement > 0 && shortfall >= cfg.threshold;
      const resolvedNote = resolvedMap.get(`${item.date}:${item.productKey}`);
      const isFlagged = rawFlagged && !resolvedNote;
      const explanation = resolvedNote
        ? `✓ ተጣርቷል (${resolvedNote})`
        : isFlagged
        ? `${shortfall} ብሎክ ጉድለት (ከ1 ከረጢት በላይ)`
        : 'መደበኛ';

      return {
        date: item.date,
        productName: item.productName,
        productKey: item.productKey,
        cement: item.cement,
        blocks: item.blocks,
        minimum: minExpected,
        maximum: maxExpected,
        flagged: isFlagged,
        explanation,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ReportsView
      basePath="/manager/reports"
      mode={mode}
      from={from}
      to={to}
      sales={sales ?? []}
      services={services ?? []}
      payroll={payroll ?? []}
      production={production ?? []}
      products={products ?? []}
      audit={audit ?? []}
      breakages={breakages ?? []}
      expenses={expenses ?? []}
      cementYieldChecks={cementYieldChecks}
    />
  );
}
