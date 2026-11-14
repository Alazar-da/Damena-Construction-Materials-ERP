import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import {
  Boxes,
  Factory,
  Flame,
  DollarSign,
  ArrowRight,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const nextDay = (day: string) => {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

const formatFullDate = () =>
  new Intl.DateTimeFormat('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

export default async function Dashboard() {
  const client = await db();
  const date = today();

  const [
    { data: products },
    { data: movements },
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
      .limit(10),
    client
      .from('production_runs')
      .select('output_quantity,output_product_id')
      .eq('production_date', date),
    client
      .from('service_payments')
      .select('service_type,amount')
      .gte('created_at', `${date}T00:00:00+03:00`)
      .lt('created_at', `${nextDay(date)}T00:00:00+03:00`),
  ]);

  const cement = (products ?? []).filter((p) => p.category === 'cement');
  const names = new Map((products ?? []).map((p) => [p.id, p.name]));

  const cementQty = cement.reduce((n, p) => n + Number(p.stock_on_hand), 0);
  const used = (movements ?? [])
    .filter((m) => m.movement_type === 'internal_use')
    .reduce((n, m) => n + Math.abs(Number(m.quantity_delta)), 0);
  const made = (production ?? []).reduce(
    (n, p) => n + Number(p.output_quantity),
    0
  );
  const serviceIncome = new Map<string, number>([
    ['battery_charging', 0],
    ['battery_acid', 0],
    ['welding', 0],
  ]);
  for (const service of services ?? []) {
    serviceIncome.set(service.service_type, (serviceIncome.get(service.service_type) ?? 0) + Number(service.amount));
  }
  const revenue = [...serviceIncome.values()].reduce((total, amount) => total + amount, 0);
  const serviceNames: Record<string, string> = {
    battery_charging: 'ባትሪ መሙላት',
    battery_acid: 'የባትሪ አሲድ መሙላት',
    welding: 'ብየዳ',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Today&apos;s Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{formatFullDate()}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/stock"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>ሲሚንቶ ተቀበል</span>
          </Link>
          <Link
            href="/app/production"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ምርት መዝግብ</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cement in Store */}
        <div className="erp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">በመጋዘን ያለ ሲሚንቶ</span>
            <Boxes className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {cementQty.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">ከረጢት</span>
          </div>
          <Link
            href="/app/stock"
            className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
          >
            <span>መጋዘኑን ይመልከቱ</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cement Used */}
        <div className="erp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ያገለገለ ሲሚንቶ</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
              {used.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">ከረጢት</span>
          </div>
          <span className="mt-3 block text-xs text-slate-400">ዛሬ የወጣ</span>
        </div>

        {/* Finished Production */}
        <div className="erp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ዛሬ የተጠናቀቀ</span>
            <Factory className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              {made.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">ክፍሎች</span>
          </div>
          <span className="mt-3 block text-xs text-slate-400">ብሎኮች እና ቴራሶ</span>
        </div>

        {/* Service Cash */}
        <div className="erp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">የአገልግሎት ገቢ</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-amber-600 font-mono">ብር</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {revenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-2">
            {[...serviceIncome.entries()].map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                <span>{serviceNames[type] ?? type.replaceAll('_', ' ')}</span>
                <span className="font-mono font-semibold text-slate-700">{amount.toLocaleString()} ብር</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ እንቅስቃሴዎች</h2>
          <Link
            href="/app/stock"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">እቃ</th><th className="py-2.5 px-4">ዓይነት</th><th className="py-2.5 px-4">ብዛት</th><th className="py-2.5 px-4">ምክንያት</th><th className="py-2.5 px-4">ቀን / ሰዓት</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements?.map((m) => {
                const isNegative = Number(m.quantity_delta) < 0;
                return (
                  <tr key={`${m.created_at}-${m.product_id}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {names.get(m.product_id) ?? 'Item'}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.movement_type === 'receipt'
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.movement_type === 'internal_use'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-sky-50 text-sky-700'
                        }`}
                      >
                        {m.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isNegative ? 'text-rose-600' : 'text-emerald-600'}>
                        {isNegative ? '' : '+'}
                        {m.quantity_delta}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.reason || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {new Date(m.created_at).toLocaleString('en-KE', {
                        timeZone: 'Africa/Nairobi',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!movements || movements.length === 0) && (
            <div className="py-8 text-center text-xs text-slate-400">
              No movements recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
