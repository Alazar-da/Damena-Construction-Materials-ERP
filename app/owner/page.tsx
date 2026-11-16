import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import { ArrowRight, Tag } from 'lucide-react';

const todayInNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
const money = (n: number) =>
  `ETB ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export const dynamic = 'force-dynamic';

export default async function OwnerPortal() {
  const client = await db();
  const today = todayInNairobi();
  const month = today.slice(0, 7);

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
      .select('id,invoice_number,customer_name,total_amount,sale_date,created_at,status,sale_lines(item_name_snapshot,quantity,unit_snapshot)')
      .gte('sale_date', `${month}-01`)
      .lte('sale_date', today)
      .neq('status', 'void')
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from('service_payments')
      .select('id,service_type,customer_name,amount,created_at')
      .gte('created_at', `${month}-01T00:00:00+03:00`)
      .lte('created_at', `${today}T23:59:59+03:00`)
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from('payroll_records')
      .select('id,worker_name,pay_type,period_start,amount,paid_at,status')
      .eq('status', 'paid')
      .gte('period_start', `${month}-01`)
      .lte('period_start', today)
      .order('paid_at', { ascending: false })
      .limit(100),
    client
      .from('production_runs')
      .select('id,production_date,output_quantity')
      .gte('production_date', `${month}-01`)
      .lte('production_date', today),
  ]);

  const rows = [
    ...(sales ?? []).map((row) => {
      const line = row.sale_lines?.[0];
      const name = line?.item_name_snapshot || 'Product sale';
      const qty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'} · ` : '';
      return {
        id: `sale-${row.id}`,
        type: 'Sale',
        name,
        detail: `${qty}${row.customer_name || 'Walk-in'}`,
        amount: Number(row.total_amount),
        date: row.created_at,
      };
    }),
    ...(services ?? []).map((row) => ({
      id: `service-${row.id}`,
      type: 'Service',
      name: row.service_type,
      detail: row.customer_name || 'Service',
      amount: Number(row.amount),
      date: row.created_at,
    })),
    ...(payroll ?? []).map((row) => ({
      id: `payroll-${row.id}`,
      type: 'Payroll',
      name: row.worker_name || 'Worker',
      detail: row.pay_type,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Owner Overview
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5">{month}</p>
        </div>

        <Link
          href="/owner/prices"
          className="erp-btn-secondary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 w-fit"
        >
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span>ዋጋዎችን አስተዳድር</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="erp-card p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">
            Net Cash Flow
          </span>
          <div className="mt-1.5 text-base sm:text-2xl font-bold font-mono text-slate-900 truncate">
            {money(netCash)}
          </div>
        </div>

        <div className="erp-card p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">
            Product Sales
          </span>
          <div className="mt-1.5 text-base sm:text-2xl font-bold font-mono text-slate-900 truncate">
            {money(totals.sales)}
          </div>
        </div>

        <div className="erp-card p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">
            Service Income
          </span>
          <div className="mt-1.5 text-base sm:text-2xl font-bold font-mono text-slate-900 truncate">
            {money(totals.services)}
          </div>
        </div>

        <div className="erp-card p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">
            Payroll Paid
          </span>
          <div className="mt-1.5 text-base sm:text-2xl font-bold font-mono text-slate-900 truncate">
            {money(totals.payroll)}
          </div>
        </div>
      </div>

      {/* Grid: Financial Activity + Inventory */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Activity Table */}
        <div className="lg:col-span-8 erp-card overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ ግብይቶች</h2>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {rows.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">ዓይነት</th><th className="py-2.5 px-4">ዝርዝር</th><th className="py-2.5 px-4">ቀን</th><th className="py-2.5 px-4 text-right">መጠን</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {row.type}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{row.detail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {new Date(row.date).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        row.amount < 0 ? 'text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {money(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No transactions recorded this month.
              </div>
            )}
          </div>
        </div>

        {/* Stock Health */}
        <div className="lg:col-span-4 erp-card p-4 sm:p-5 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">ጠቅላላ የምርት ክምችት</span>
            <div className="mt-1.5 text-2xl font-bold font-mono text-slate-900">
              {stockUnits.toLocaleString()} pcs
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              Low Stock Warnings ({lowStock.length})
            </span>
            {lowStock.length > 0 ? (
              <ul className="space-y-2">
                {lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    <span className="font-mono font-bold text-rose-600">
                      {Number(item.stock_on_hand).toLocaleString()} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">ሁሉም ምርቶች ከዝቅተኛው የክምችት ደረጃ በላይ ናቸው።</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
