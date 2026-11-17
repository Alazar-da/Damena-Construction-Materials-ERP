import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Factory,
  Tag,
  WalletCards,
} from 'lucide-react';

const todayInNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
const money = (n: number) =>
  `${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })} ብር`;
const localizeProductName = (name: string) =>
  name.replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ').replace(/Terrace/i, 'ቴራሶ');

export const dynamic = 'force-dynamic';

type OverviewPeriod = 'daily' | 'weekly' | 'monthly';

const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export default async function OwnerPortal({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period: OverviewPeriod = ['daily', 'weekly', 'monthly'].includes(params.period || '')
    ? (params.period as OverviewPeriod)
    : 'monthly';
  const client = await db();
  const today = todayInNairobi();
  const month = today.slice(0, 7);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const startDate = period === 'daily'
    ? today
    : period === 'weekly'
    ? addDays(today, -((weekday + 6) % 7))
    : `${month}-01`;
  const endDate = today;
  const nextDate = addDays(endDate, 1);
  const periodName = period === 'daily' ? 'የዛሬ' : period === 'weekly' ? 'የዚህ ሳምንት' : 'የዚህ ወር';
  const periodLabel = period === 'daily'
    ? new Intl.DateTimeFormat('am-ET', {
        timeZone: 'Africa/Nairobi', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      }).format(new Date(`${today}T12:00:00+03:00`))
    : period === 'monthly'
    ? new Intl.DateTimeFormat('am-ET', {
        timeZone: 'Africa/Nairobi',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${today}T12:00:00+03:00`))
    : `${new Intl.DateTimeFormat('am-ET', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric' }).format(new Date(`${startDate}T12:00:00+03:00`))} – ${new Intl.DateTimeFormat('am-ET', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric' }).format(new Date(`${endDate}T12:00:00+03:00`))}`;

  const [
    { data: products },
    { data: sales },
    { data: services },
    { data: payroll },
    { data: production },
  ] = await Promise.all([
    client
      .from('products')
      .select('id,name,unit,category,selling_price,stock_on_hand,low_stock_threshold,is_active')
      .eq('is_active', true)
      .order('name'),
    client
      .from('sales')
      .select('id,invoice_number,customer_name,total_amount,sale_date,created_at,status,recorded_by,profiles:recorded_by(display_name),sale_lines(item_name_snapshot,quantity,unit_snapshot)')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .neq('status', 'void')
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from('service_payments')
      .select('id,service_type,customer_name,amount,created_at')
      .gte('created_at', `${startDate}T00:00:00+03:00`)
      .lt('created_at', `${nextDate}T00:00:00+03:00`)
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from('payroll_records')
      .select('id,worker_name,pay_type,period_start,amount,paid_at,status')
      .eq('status', 'paid')
      .gte('period_start', startDate)
      .lte('period_start', endDate)
      .order('paid_at', { ascending: false })
      .limit(100),
    client
      .from('production_runs')
      .select('id,production_date,output_quantity')
      .gte('production_date', startDate)
      .lte('production_date', endDate),
  ]);

  const rows = [
    ...(sales ?? []).map((row) => {
      const line = row.sale_lines?.[0];
      const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const name = localizeProductName(line?.item_name_snapshot || 'የምርት ሽያጭ');
      const unit = line?.unit_snapshot === 'piece' ? 'ክፍል' : line?.unit_snapshot || 'ክፍል';
      const qty = line ? `${line.quantity} ${unit} · ` : '';
      return {
        id: `sale-${row.id}`,
        type: 'ሽያጭ',
        name,
        detail: `${qty}${row.customer_name || 'በቀጥታ ሽያጭ'} · በ${actor?.display_name || 'ያልታወቀ ተጠቃሚ'} ተመዝግቧል`,
        amount: Number(row.total_amount),
        date: row.created_at,
      };
    }),
    ...(services ?? []).map((row) => ({
      id: `service-${row.id}`,
      type: 'አገልግሎት',
      name: ({
        battery_charging: 'ባትሪ መሙላት',
        battery_acid: 'የባትሪ አሲድ መሙላት',
        welding: 'ብየዳ',
      } as Record<string, string>)[row.service_type] || row.service_type.replaceAll('_', ' '),
      detail: row.customer_name || 'አገልግሎት',
      amount: Number(row.amount),
      date: row.created_at,
    })),
    ...(payroll ?? []).map((row) => ({
      id: `payroll-${row.id}`,
      type: 'ደመወዝ',
      name: row.worker_name || 'ሰራተኛ',
      detail: row.pay_type === 'daily' ? 'የቀን ክፍያ' : row.pay_type === 'weekly' ? 'የሳምንት ክፍያ' : 'የወር ክፍያ',
      amount: -Number(row.amount),
      date: row.paid_at || row.period_start,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const totals = {
    sales: (sales ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0),
    services: (services ?? []).reduce((sum, row) => sum + Number(row.amount), 0),
    payroll: (payroll ?? []).reduce((sum, row) => sum + Number(row.amount), 0),
    output: (production ?? []).reduce((sum, row) => sum + Number(row.output_quantity), 0),
  };

  const netCash = totals.sales + totals.services - totals.payroll;
  const stockUnits = (products ?? []).reduce((sum, item) => sum + Number(item.stock_on_hand), 0);
  const lowStock = (products ?? []).filter(
    (item) => Number(item.stock_on_hand) <= Number(item.low_stock_threshold)
  );

  return (
    <div className="owner-dashboard space-y-7 sm:space-y-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {periodLabel}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            የንግድ አጠቃላይ እይታ
          </h1>
          <p className="mt-2 text-base text-slate-600">{periodName} ገቢ፣ ወጪ እና የምርት ማጠቃለያ</p>
          <nav aria-label="የማጠቃለያ ጊዜ ይምረጡ" className="mt-5 inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {([
              { id: 'daily', label: 'ዕለታዊ' },
              { id: 'weekly', label: 'ሳምንታዊ' },
              { id: 'monthly', label: 'ወርሃዊ' },
            ] as const).map((item) => (
              <Link
                key={item.id}
                href={`/owner?period=${item.id}`}
                aria-current={period === item.id ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${period === item.id ? 'bg-[#111827] text-white shadow-sm' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/owner/reports" className="erp-btn-secondary min-h-12 gap-2 px-5 text-base">
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden="true" />
            ሪፖርቶችን ይመልከቱ
          </Link>
          <Link href="/owner/prices" className="erp-btn-primary min-h-12 gap-2 px-5 text-base">
            <Tag className="h-5 w-5" aria-hidden="true" />
            ዋጋዎችን ያስተዳድሩ
          </Link>
        </div>
      </header>

      <section aria-label={`${periodName} የገንዘብ ማጠቃለያ`} className="owner-finance-hero relative overflow-hidden rounded-[2rem] bg-[#111827] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-36 h-96 w-96 rounded-full border-[48px] border-blue-400/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/15 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3 text-blue-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/15 ring-1 ring-blue-200/20">
                <CircleDollarSign className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold">የተጣራ የገንዘብ ፍሰት</span>
            </div>
            <p className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{money(netCash)}</p>
            <p className="mt-3 text-base text-slate-300">ከሽያጭና ከአገልግሎት ገቢ የደመወዝ ወጪ ተቀንሶ</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <ArrowUpRight className="mb-4 h-5 w-5 text-sky-300" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-300">{periodName} የምርት ሽያጭ</p>
              <p className="mt-2 text-xl font-bold">{money(totals.sales)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <Activity className="mb-4 h-5 w-5 text-blue-300" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-300">{periodName} የአገልግሎት ገቢ</p>
              <p className="mt-2 text-xl font-bold">{money(totals.services)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <WalletCards className="mb-4 h-5 w-5 text-amber-300" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-300">{periodName} የተከፈለ ደመወዝ</p>
              <p className="mt-2 text-xl font-bold">{money(totals.payroll)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">የቅርብ ጊዜ እንቅስቃሴ</h2>
                <p className="mt-1 text-sm text-slate-600">{periodName} ገቢና ወጪ</p>
              </div>
            </div>
            <Link href="/owner/records" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-blue-800 hover:bg-blue-50">
              ሁሉንም መዝገቦች ይመልከቱ <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 px-5 sm:px-7">
            {rows.map((row) => {
              const isExpense = row.amount < 0;
              return (
                <div key={row.id} className="flex items-center gap-4 py-4 sm:py-5">
                  <span className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex ${isExpense ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                    {isExpense ? <ArrowDownRight className="h-6 w-6" aria-hidden="true" /> : <ArrowUpRight className="h-6 w-6" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-bold text-slate-950">{row.name}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">{row.type}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{row.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-base font-bold tabular-nums ${isExpense ? 'text-amber-800' : 'text-slate-950'}`}>
                      {isExpense ? '− ' : '+ '}{money(Math.abs(row.amount))}
                    </p>
                    <time className="mt-1 block text-sm text-slate-600" dateTime={row.date}>
                      {new Date(row.date).toLocaleDateString('am-ET', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric' })}
                    </time>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="py-12 text-center">
                <Activity className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-slate-700">በዚህ ወር የተመዘገበ እንቅስቃሴ የለም</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-600">ጠቅላላ የምርት ክምችት</p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 tabular-nums">{stockUnits.toLocaleString('en-US')}</p>
                <p className="mt-1 text-base text-slate-600">የምርት ክፍሎች</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                <Boxes className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
              <div>
                <p className="text-sm text-slate-600">{periodName} የተመረተ</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{totals.output.toLocaleString('en-US')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">ዝቅተኛ ክምችት</p>
                <p className={`mt-1 text-xl font-bold ${lowStock.length ? 'text-rose-700' : 'text-emerald-800'}`}>{lowStock.length} ምርቶች</p>
              </div>
            </div>
          </section>

          <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${lowStock.length ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${lowStock.length ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                {lowStock.length ? <AlertTriangle className="h-5 w-5" aria-hidden="true" /> : <Factory className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">{lowStock.length ? 'የክምችት ማስጠንቀቂያ' : 'ክምችት ደህና ነው'}</h2>
                <p className="mt-1 text-sm text-slate-700">{lowStock.length ? `${lowStock.length} ምርቶች ከመደበኛው ደረጃ በታች ናቸው` : 'ሁሉም ምርቶች በቂ ክምችት አላቸው'}</p>
              </div>
            </div>
            {lowStock.length > 0 && (
              <ul className="mt-5 space-y-2">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3">
                    <span className="truncate text-base font-semibold text-slate-900">{item.name}</span>
                    <span className="shrink-0 text-base font-bold text-rose-800">{Number(item.stock_on_hand).toLocaleString('en-US')} {item.unit}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/owner/prices" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-base font-bold text-slate-900 underline decoration-amber-600 decoration-2 underline-offset-4">
              የእቃ ዝርዝርን ይመልከቱ <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
