import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import {
  TrendingUp,
  Tag,
  ChartNoAxesCombined,
  ArrowRight,
  AlertTriangle,
  MoreVertical,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  IsometricSolidBlock,
  IsometricHollowBlock,
  IsometricPavingBlocks,
  IsometricCementBag,
} from './components/isometric-icons';

export const dynamic = 'force-dynamic';

type OverviewPeriod = 'daily' | 'weekly' | 'monthly';

const todayInNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const money = (n: number) =>
  `ETB ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

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

  const startDate =
    period === 'daily'
      ? today
      : period === 'weekly'
      ? addDays(today, -((weekday + 6) % 7))
      : `${month}-01`;
  const endDate = today;
  const nextDate = addDays(endDate, 1);

  const periodLabel =
    period === 'daily'
      ? 'Today'
      : period === 'weekly'
      ? 'Last 7 Days'
      : 'This Month';

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
      .select(
        'id,invoice_number,customer_name,total_amount,paid_amount,sale_date,created_at,status,recorded_by,sale_lines(item_name_snapshot,quantity,unit_snapshot)'
      )
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

  // Financial calculations
  const totalSales = (sales ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const paidSales = (sales ?? []).reduce((sum, row) => sum + Number(row.paid_amount), 0);
  const totalServices = (services ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalPayroll = (payroll ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  const netCash = paidSales + totalServices - totalPayroll;
  const unpaidBalances = (sales ?? []).reduce(
    (sum, row) => sum + Math.max(0, Number(row.total_amount) - Number(row.paid_amount)),
    0
  );
  const unpaidCount = (sales ?? []).filter(
    (row) => Number(row.paid_amount) < Number(row.total_amount)
  ).length;

  // Transaction history rows
  const transactions = [
    ...(sales ?? []).map((row) => {
      const line = row.sale_lines?.[0];
      const itemName = line?.item_name_snapshot || 'Product sale';
      const qty = line?.quantity ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '';
      const isPaid = Number(row.paid_amount) >= Number(row.total_amount);
      const due = Math.max(0, Number(row.total_amount) - Number(row.paid_amount));

      return {
        id: `sale-${row.id}`,
        type: 'Sale',
        date: row.sale_date,
        item: itemName,
        detail: qty ? `${qty} · ${row.customer_name || 'Walk-in'}` : row.customer_name || 'Walk-in',
        cashFlow: Number(row.total_amount),
        isExpense: false,
        status: isPaid ? 'Paid' : `Unpaid (${money(due)})`,
        statusType: isPaid ? 'success' : 'warning',
        timestamp: new Date(row.created_at).getTime(),
      };
    }),
    ...(services ?? []).map((row) => ({
      id: `service-${row.id}`,
      type: 'Service',
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(
        new Date(row.created_at)
      ),
      item:
        ({
          battery_charging: 'Battery Charging',
          battery_acid: 'Battery Acid Filling',
          welding: 'Welding',
        } as Record<string, string>)[row.service_type] || row.service_type.replaceAll('_', ' '),
      detail: row.customer_name || 'Walk-in customer',
      cashFlow: Number(row.amount),
      isExpense: false,
      status: 'Completed',
      statusType: 'neutral',
      timestamp: new Date(row.created_at).getTime(),
    })),
    ...(payroll ?? []).map((row) => ({
      id: `payroll-${row.id}`,
      type: 'Payroll',
      date: row.paid_at || row.period_start,
      item: `Payroll · ${row.worker_name || 'Worker'}`,
      detail:
        row.pay_type === 'daily'
          ? 'Daily wage'
          : row.pay_type === 'weekly'
          ? 'Weekly wage'
          : 'Monthly salary',
      cashFlow: -Number(row.amount),
      isExpense: true,
      status: 'Paid',
      statusType: 'neutral',
      timestamp: new Date(row.paid_at || row.period_start).getTime(),
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  // Grouped Product Stock Cards
  const solidProduct =
    (products ?? []).find((p) => p.name.includes('10/10')) ||
    (products ?? []).find((p) => p.category === 'brick') ||
    products?.[0];
  const hollowProduct =
    (products ?? []).find((p) => p.name.includes('15/15') || p.name.includes('20/20')) ||
    products?.[1];
  const pavingProduct =
    (products ?? []).find((p) => p.category === 'terazone' || p.name.toLowerCase().includes('terrace')) ||
    products?.[2];
  const cementProduct =
    (products ?? []).find((p) => p.category === 'cement') || products?.[3];

  const stockCards = [
    {
      title: 'Solid Blocks',
      subtitle: solidProduct?.name || '10/10 Block',
      stock: Number(solidProduct?.stock_on_hand || 0),
      threshold: Number(solidProduct?.low_stock_threshold || 20),
      unit: solidProduct?.unit || 'pcs',
      icon: IsometricSolidBlock,
    },
    {
      title: 'Hollow Blocks',
      subtitle: hollowProduct?.name || '15/15 Block',
      stock: Number(hollowProduct?.stock_on_hand || 0),
      threshold: Number(hollowProduct?.low_stock_threshold || 20),
      unit: hollowProduct?.unit || 'pcs',
      icon: IsometricHollowBlock,
    },
    {
      title: 'Paving Blocks',
      subtitle: pavingProduct?.name || 'Terrace Pavers',
      stock: Number(pavingProduct?.stock_on_hand || 0),
      threshold: Number(pavingProduct?.low_stock_threshold || 20),
      unit: pavingProduct?.unit || 'pcs',
      icon: IsometricPavingBlocks,
    },
    {
      title: 'Cement Store',
      subtitle: cementProduct?.name || 'Cement 50kg',
      stock: Number(cementProduct?.stock_on_hand || 0),
      threshold: Number(cementProduct?.low_stock_threshold || 10),
      unit: cementProduct?.unit || 'bags',
      icon: IsometricCementBag,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* =========================================================================
          TOP BAR: DASHBOARD TITLE & ACTIONS
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Overview · {periodLabel}
          </p>
        </div>

        {/* Period Selector Tabs & Quick Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <nav
            aria-label="Overview period"
            className="inline-flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs"
          >
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
            ].map((tab) => {
              const isActive = period === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/owner?period=${tab.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/owner/prices"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Prices</span>
          </Link>

          <Link
            href="/owner/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <ChartNoAxesCombined className="w-3.5 h-3.5" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: STOCK CARDS (ISOMETRIC PRODUCT CARDS)
      ========================================================================= */}
      <section aria-labelledby="stock-cards-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="stock-cards-heading"
            className="text-sm font-bold tracking-tight text-slate-900 uppercase font-mono text-[11px] text-slate-500"
          >
            Stock cards
          </h2>
          <Link
            href="/app/stock"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Yard Inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile Swipeable / Desktop Grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:overflow-visible no-scrollbar snap-x">
          {stockCards.map((card) => {
            const Icon = card.icon;
            const isHigh = card.stock > card.threshold;
            return (
              <div
                key={card.title}
                className="min-w-[240px] sm:min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all snap-start"
              >
                {/* 3D Isometric Illustration */}
                <div className="flex items-center justify-center py-2 min-h-[76px]">
                  <Icon className="w-28 h-18 drop-shadow-xs" />
                </div>

                {/* Card Meta */}
                <div className="mt-3 pt-2 border-t border-slate-100/80">
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 font-mono">
                    {card.stock.toLocaleString()} in stock
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                        isHigh
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHigh ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isHigh ? 'Stock Level: High' : 'Stock Level: Low'}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {card.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HERO KPI CARDS WITH GRADIENT WAVE SPARKLINES
      ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: NET CASH FLOW */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs overflow-hidden flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 tracking-tight uppercase font-mono">
                Net Cash Flow
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                aria-label="Cash flow options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 tracking-tight">
              {netCash >= 0 ? '+' : ''} {money(netCash)}
            </div>

            <div className="mt-1 text-[11px] text-slate-400 font-mono">
              Inflow: {money(paidSales + totalServices)} · Outflow: {money(totalPayroll)}
            </div>
          </div>

          {/* Smooth Green Area Wave SVG */}
          <div className="absolute -bottom-1 left-0 right-0 pointer-events-none opacity-90">
            <svg
              viewBox="0 0 320 65"
              className="w-full h-14 sm:h-16"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="greenWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,50 Q 50,45 100,32 T 200,28 T 260,18 T 320,10 L 320,65 L 0,65 Z"
                fill="url(#greenWave)"
              />
              <path
                d="M 0,50 Q 50,45 100,32 T 200,28 T 260,18 T 320,10"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 2: UNPAID BALANCES */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs overflow-hidden flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 tracking-tight uppercase font-mono">
                  Unpaid Balances
                </span>
                {unpaidBalances > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                aria-label="Unpaid balance options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 tracking-tight flex items-center gap-2">
              <span>{money(unpaidBalances)}</span>
              {unpaidBalances > 0 && (
                <span className="text-sm font-sans font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                  ⚠ {unpaidCount} Due
                </span>
              )}
            </div>

            <div className="mt-1 text-[11px] text-slate-400 font-mono">
              Outstanding customer credit awaiting collection
            </div>
          </div>

          {/* Smooth Amber Area Wave SVG */}
          <div className="absolute -bottom-1 left-0 right-0 pointer-events-none opacity-90">
            <svg
              viewBox="0 0 320 65"
              className="w-full h-14 sm:h-16"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="amberWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,42 Q 60,35 120,44 T 210,30 T 270,38 T 320,22 L 320,65 L 0,65 Z"
                fill="url(#amberWave)"
              />
              <path
                d="M 0,42 Q 60,35 120,44 T 210,30 T 270,38 T 320,22"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PERFORMANCE CHART & TRANSACTION HISTORY
      ========================================================================= */}
      <section className="grid gap-5 md:grid-cols-12">
        {/* LEFT: PERFORMANCE CHART */}
        <div className="md:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                  Performance Chart
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Revenue and activity trend ({periodLabel})
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Chart menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* SVG Performance Chart with Y-axis gridlines */}
            <div className="mt-4 relative h-48 sm:h-56 w-full flex items-stretch">
              {/* Y-axis Ticks */}
              <div className="w-8 shrink-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono pb-4 pr-1 text-right select-none">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Chart SVG Canvas */}
              <div className="flex-1 relative">
                {/* Horizontal gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pb-4 pointer-events-none">
                  <div className="w-full border-b border-slate-100" />
                  <div className="w-full border-b border-slate-100" />
                  <div className="w-full border-b border-slate-100" />
                  <div className="w-full border-b border-slate-100" />
                  <div className="w-full border-b border-slate-200/80" />
                </div>

                {/* SVG Line & Area Fill */}
                <svg
                  viewBox="0 0 300 160"
                  className="w-full h-full pb-4"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.16" />
                      <stop offset="70%" stopColor="#0f172a" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area */}
                  <path
                    d="M 0,135 Q 35,125 70,110 T 140,85 T 200,60 T 260,35 T 300,20 L 300,160 L 0,160 Z"
                    fill="url(#perfGradient)"
                  />

                  {/* High-contrast smooth stroke */}
                  <path
                    d="M 0,135 Q 35,125 70,110 T 140,85 T 200,60 T 260,35 T 300,20"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Active marker points */}
                  <circle cx="140" cy="85" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="260" cy="35" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="300" cy="20" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Production: {(production ?? []).reduce((s, p) => s + Number(p.output_quantity), 0).toLocaleString()} pcs</span>
            <span>Sales: {money(totalSales)}</span>
          </div>
        </div>

        {/* RIGHT: TRANSACTION HISTORY */}
        <div className="md:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                  Transaction History
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Recent plant and cash movements
                </p>
              </div>
              <Link
                href="/owner/records"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Table / List */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase font-mono text-slate-400">
                    <th className="py-2.5 pr-2">Date</th>
                    <th className="py-2.5 px-2">Inventory / Item</th>
                    <th className="py-2.5 px-2 text-right">Cash Flow</th>
                    <th className="py-2.5 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-2 font-mono text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-2.5 px-2">
                        <p className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                          {tx.item}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                          {tx.detail}
                        </p>
                      </td>

                      <td
                        className={`py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap ${
                          tx.isExpense ? 'text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {tx.cashFlow >= 0 ? '+' : ''}
                        {money(tx.cashFlow)}
                      </td>

                      <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            tx.statusType === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.statusType === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No recorded transactions in this period.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{transactions.length} shown</span>
            <Link
              href="/owner/records"
              className="font-semibold text-slate-700 hover:text-slate-900"
            >
              Manage entries →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
