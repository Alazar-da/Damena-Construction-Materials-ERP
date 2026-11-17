'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  Receipt,
  Boxes,
  Activity,
  AlertTriangle,
} from 'lucide-react';

type Sale = {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  recorded_by: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  sale_lines?: {
    item_name_snapshot: string;
    quantity: number;
    unit_snapshot: string;
    unit_price: number;
  }[];
};

const recordedBy = (value: Sale['profiles']) => {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.display_name || 'ያልታወቀ ተጠቃሚ';
};

type Service = {
  id: string;
  service_type: string;
  customer_name: string | null;
  amount: number;
  created_at: string;
};

type Payroll = {
  id: string;
  worker_name: string | null;
  pay_type: string;
  period_start: string;
  amount: number;
  status: string;
};

type Production = {
  id: string;
  production_date: string;
  output_quantity: number;
  output_product_id: string;
};

type Product = {
  id: string;
  name: string;
  unit: string;
  category: string;
  stock_on_hand: number;
  low_stock_threshold: number;
  selling_price: number | null;
};

type AuditEntry = {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

interface ReportsViewProps {
  mode: string;
  from: string;
  to: string;
  sales: Sale[];
  services: Service[];
  payroll: Payroll[];
  production: Production[];
  products: Product[];
  audit: AuditEntry[];
  cementYieldChecks: { date: string; cement: number; blocks: number; minimum: number; maximum: number; flagged: boolean }[];
}

const money = (n: number) =>
  `ETB ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

const moneyKeys = new Set([
  'amount',
  'total_amount',
  'paid_amount',
  'selling_price',
  'unit_price',
  'rate_snapshot',
]);

const labelFor = (key: string) =>
  ({
    sale: 'Sale',
    service_payment: 'Service',
    payroll: 'Payroll',
    production: 'Production',
    stock_movement: 'Stock',
    product_price: 'Price',
    stock_threshold: 'Threshold',
  }[key] || key.replaceAll('_', ' '));

const flatten = (v: unknown, prefix = ''): Record<string, unknown> => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.entries(v as Record<string, unknown>).reduce(
      (o, [k, x]) => ({ ...o, ...flatten(x, prefix ? `${prefix}.${k}` : k) }),
      {}
    );
  }
  return { [prefix]: v };
};

const showValue = (key: string, value: unknown) =>
  value == null || value === ''
    ? '—'
    : moneyKeys.has(key.split('.').at(-1) || '') && Number.isFinite(Number(value))
    ? money(Number(value))
    : String(value);

export default function ReportsView({
  mode,
  from,
  to,
  sales,
  services,
  payroll,
  production,
  products,
  audit,
  cementYieldChecks,
}: ReportsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'daily' | 'sales' | 'stock' | 'audit'>('daily');
  const [customOpen, setCustomOpen] = useState(mode === 'custom');
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  // Financial totals
  const salesGross = sales.reduce((n, s) => n + Number(s.total_amount), 0);
  const collections = sales.reduce((n, s) => n + Number(s.paid_amount), 0);
  const receivables = sales.reduce(
    (n, s) => n + Math.max(0, Number(s.total_amount) - Number(s.paid_amount)),
    0
  );
  const serviceIncome = services.reduce((n, s) => n + Number(s.amount), 0);
  const payrollPaid = payroll.reduce((n, p) => n + Number(p.amount), 0);
  const produced = production.reduce((n, p) => n + Number(p.output_quantity), 0);
  const netCash = collections + serviceIncome - payrollPaid;

  // Daily map
  const byDay = new Map<
    string,
    { sales: number; services: number; payroll: number; production: number }
  >();
  const daily = (date: string) => {
    if (!byDay.has(date)) byDay.set(date, { sales: 0, services: 0, payroll: 0, production: 0 });
    return byDay.get(date)!;
  };

  sales.forEach((s) => (daily(s.sale_date).sales += Number(s.total_amount)));
  services.forEach((s) => {
    const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(
      new Date(s.created_at)
    );
    daily(d).services += Number(s.amount);
  });
  payroll.forEach((p) => (daily(p.period_start).payroll += Number(p.amount)));
  production.forEach((p) => (daily(p.production_date).production += Number(p.output_quantity)));

  const dailyRows = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const applyPeriod = (newMode: string) => {
    if (newMode === 'custom') {
      setCustomOpen(true);
    } else {
      setCustomOpen(false);
      router.push(`/owner/reports?period=${newMode}`);
    }
  };

  const submitCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/owner/reports?period=custom&from=${fromDate}&to=${toDate}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="erp-card overflow-hidden border border-amber-200">
        <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50/70 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">የሲሚንቶ እና የብሎክ ምርት ማረጋገጫ</h2>
            <p className="mt-1 text-xs text-slate-600">በአንድ የሲሚንቶ ከረጢት ከ55–60 ብሎኮች እንደሚጠበቅ ተቆጥሯል። ከዚህ ክልል ውጭ ያሉ ቀናት ለዋና አስተዳዳሪው ይታያሉ።</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-white text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-4 py-2.5">ቀን</th><th className="px-4 py-2.5">የተጠቀመ ሲሚንቶ (ከረጢት)</th><th className="px-4 py-2.5">የተመረቱ ብሎኮች</th><th className="px-4 py-2.5">የሚጠበቅ ምርት</th><th className="px-4 py-2.5">ሁኔታ</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{cementYieldChecks.map((check) => <tr key={check.date} className={check.flagged ? 'bg-rose-50/60' : ''}><td className="px-4 py-3 font-mono">{check.date}</td><td className="px-4 py-3">{check.cement.toLocaleString()}</td><td className="px-4 py-3 font-semibold">{check.blocks.toLocaleString()}</td><td className="px-4 py-3">{check.minimum.toLocaleString()}–{check.maximum.toLocaleString()}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${check.flagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{check.flagged ? 'ልዩነት ተገኝቷል — ይመርምሩ' : 'በመደበኛ ክልል'}</span></td></tr>)}{cementYieldChecks.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">በዚህ የቀን ክልል የሲሚንቶ አጠቃቀም መዝገብ የለም።</td></tr>}</tbody>
          </table>
        </div>
      </section>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {from} to {to}
          </p>
        </div>

        <Link
          href="/owner"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>አጠቃላይ እይታ</span>
        </Link>
      </div>

      {/* Period Selector (Segmented buttons for mobile) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'daily', label: 'ዛሬ' },
            { id: 'weekly', label: 'ያለፉት 7 ቀናት' },
            { id: 'monthly', label: 'ይህ ወር' },
            { id: 'custom', label: 'ብጁ የቀን ክልል' },
          ].map((item) => {
            const isSelected = mode === item.id || (item.id === 'custom' && customOpen);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPeriod(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {customOpen && (
          <form
            onSubmit={submitCustomRange}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs"
          >
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-semibold text-slate-500 shrink-0">ከ</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                required
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-semibold text-slate-500 shrink-0">እስከ</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ተግብር</span>
            </button>
          </form>
        )}
      </div>

      {/* Net Cash Flow Hero Tile */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">የተጣራ የገንዘብ ፍሰት</span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              netCash >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {netCash >= 0 ? '+' : ''}
            {money(netCash)}
          </span>
        </div>
        <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono text-slate-900 truncate">
          {money(netCash)}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Inflow: {money(collections + serviceIncome)}</span>
          <span>Outflow: {money(payrollPaid)}</span>
        </div>
      </div>

      {/* Financial Summary Cards (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
            Product Sales
          </span>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-slate-900 truncate">
            {money(salesGross)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
            Collected: {money(collections)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
            Receivables (Due)
          </span>
          <div
            className={`mt-1 text-base sm:text-xl font-bold font-mono truncate ${
              receivables > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {money(receivables)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
            Unpaid invoices
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
            Service Income
          </span>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-slate-900 truncate">
            {money(serviceIncome)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
            {services.length} services
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
            Blocks Molded
          </span>
          <div className="mt-1 text-base sm:text-xl font-bold font-mono text-slate-900 truncate">
            {produced.toLocaleString()} pcs
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
            {production.length} batches
          </span>
        </div>
      </div>

      {/* Activity Section Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
          {[
            { id: 'daily', label: 'ዕለታዊ እንቅስቃሴ', count: dailyRows.length, icon: ChartNoAxesCombined },
            { id: 'sales', label: 'የሽያጭ ደረሰኞች', count: sales.length, icon: Receipt },
            { id: 'stock', label: 'የአሁኑ ክምችት', count: products.length, icon: Boxes },
            { id: 'audit', label: 'የለውጥ ታሪክ', count: audit.length, icon: Activity },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  isActive
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: DAILY ACTIVITY
        ========================================================================= */}
        {activeTab === 'daily' && (
          <div className="space-y-2">
            {/* Mobile View: Touch Cards */}
            <div className="space-y-2.5 sm:hidden">
              {dailyRows.map(([date, values]) => {
                const dayNet = values.sales + values.services - values.payroll;
                return (
                  <div
                    key={date}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 font-mono">{date}</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          dayNet >= 0 ? 'text-slate-900' : 'text-rose-600'
                        }`}
                      >
                        Net: {money(dayNet)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">ሽያጭ</span>
                        <span className="font-semibold text-slate-800">
                          {money(values.sales)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">አገልግሎቶች</span>
                        <span className="font-semibold text-slate-800">
                          {money(values.services)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">ደመወዝ</span>
                        <span className="font-semibold text-slate-800">
                          {money(values.payroll)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">የተመረተ</span>
                        <span className="font-semibold text-slate-800">
                          +{values.production.toLocaleString()} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ቀን</th><th className="py-2.5 px-4">ሽያጭ</th><th className="py-2.5 px-4">አገልግሎቶች</th><th className="py-2.5 px-4">ደመወዝ</th><th className="py-2.5 px-4 text-right">ምርት</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dailyRows.map(([date, values]) => (
                    <tr key={date} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{date}</td>
                      <td className="py-2.5 px-4 text-slate-700">{money(values.sales)}</td>
                      <td className="py-2.5 px-4 text-slate-700">{money(values.services)}</td>
                      <td className="py-2.5 px-4 text-slate-700">{money(values.payroll)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        +{values.production.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dailyRows.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No activity recorded in this period.
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: SALES (SOLD ITEMS)
        ========================================================================= */}
        {activeTab === 'sales' && (
          <div className="space-y-2">
            {/* Mobile View: Touch Cards */}
            <div className="space-y-2.5 sm:hidden">
              {sales.map((s) => {
                const isPaid = Number(s.paid_amount) >= Number(s.total_amount);
                const due = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
                const line = s.sale_lines?.[0];
                const itemName = line?.item_name_snapshot || 'Product Sale';
                const itemQty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '';

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {itemName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPaid ? 'Paid' : `Unpaid: ${money(due)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-slate-700">
                          {itemQty ? `${itemQty} · ` : ''}{s.customer_name || 'በቀጥታ ሽያጭ'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.sale_date} · በ{recordedBy(s.profiles)} ተመዝግቧል</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 text-sm">
                          {money(Number(s.total_amount))}
                        </span>
                        {!isPaid && (
                          <span className="block text-[10px] text-slate-400">
                            Paid: {money(Number(s.paid_amount))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">የተሸጠ እቃ</th><th className="py-2.5 px-4">ብዛት</th><th className="py-2.5 px-4">ደንበኛ</th><th className="py-2.5 px-4">ድምር</th><th className="py-2.5 px-4">የተከፈለ</th><th className="py-2.5 px-4 text-right">ሁኔታ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((s) => {
                    const isPaid = Number(s.paid_amount) >= Number(s.total_amount);
                    const due = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
                    const line = s.sale_lines?.[0];
                    const itemName = line?.item_name_snapshot || 'Product Sale';
                    const itemQty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '—';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-900 block">{itemName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{s.sale_date}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs">{itemQty}</td>
                        <td className="py-2.5 px-4 text-slate-800">{s.customer_name || 'በቀጥታ ሽያጭ'}<span className="mt-1 block text-xs text-slate-500">በ{recordedBy(s.profiles)} ተመዝግቧል</span></td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                          {money(Number(s.total_amount))}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {money(Number(s.paid_amount))}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isPaid ? 'Paid' : `Unpaid (${money(due)})`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sales.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No sales invoices in this period.
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: CURRENT STOCK
        ========================================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-2">
            {/* Mobile View: Cards */}
            <div className="space-y-2 sm:hidden">
              {products.map((p) => {
                const isLow = Number(p.stock_on_hand) <= Number(p.low_stock_threshold);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{p.category}</span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end font-mono">
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span
                          className={`font-bold text-xs ${
                            isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}
                        >
                          {Number(p.stock_on_hand).toLocaleString()} {p.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {p.selling_price == null ? '—' : money(Number(p.selling_price))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ምርት</th><th className="py-2.5 px-4">ምድብ</th><th className="py-2.5 px-4">ያለ ክምችት</th><th className="py-2.5 px-4 text-right">የሽያጭ ዋጋ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-4 capitalize text-slate-500 text-xs">{p.category}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {Number(p.stock_on_hand).toLocaleString()} {p.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {p.selling_price == null ? '—' : money(Number(p.selling_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: AUDIT HISTORY
        ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            {audit.map((entry) => {
              const before = flatten(entry.before_data);
              const after = flatten(entry.after_data);
              const keys = [
                ...new Set([...Object.keys(before), ...Object.keys(after)]),
              ]
                .filter(
                  (key) =>
                    JSON.stringify(before[key]) !== JSON.stringify(after[key])
                )
                .filter(
                  (key) => !key.endsWith('.created_at') && !key.endsWith('.updated_at')
                )
                .slice(0, 5);

              const actor = Array.isArray(entry.profiles)
                ? entry.profiles[0]
                : entry.profiles;

              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">
                        {labelFor(entry.entity_type)}
                      </span>
                      <span className="text-[11px] text-slate-400">በ</span>
                      <span className="text-slate-600 font-medium">
                        {actor?.display_name || 'Super Admin'}
                      </span>
                    </div>
                    <time className="text-[10px] text-slate-400 font-mono">
                      {new Date(entry.created_at).toLocaleDateString('en-KE', {
                        timeZone: 'Africa/Nairobi',
                      })}
                    </time>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {keys.map((key) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                      >
                        <span className="text-slate-400 capitalize">
                          {labelFor(key.split('.').at(-1) || key)}:
                        </span>
                        <span>{showValue(key, before[key])}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-semibold text-slate-900">
                          {showValue(key, after[key])}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {audit.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No owner corrections recorded in this period.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
