'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChartNoAxesCombined,
  Receipt,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
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
  audit: AuditEntry[];
  cementYieldChecks: {
    date: string;
    productName: string;
    productKey: string;
    cement: number;
    blocks: number;
    minimum: number;
    maximum: number;
    flagged: boolean;
    explanation: string;
  }[];
}

const money = (n: number) =>
  `ብር ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

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
    sale: 'የሽያጭ መዝገብ',
    service_payment: 'የአገልግሎት ክፍያ',
    payroll: 'የደመወዝ ክፍያ',
    production: 'የምርት ምዝገባ',
    stock_movement: 'የክምችት እንቅስቃሴ',
    product_price: 'የምርት ዋጋ',
    stock_threshold: 'የማስጠንቀቂያ መጠን',
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
  audit,
  cementYieldChecks,
}: ReportsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'daily' | 'sales' | 'audit'>('daily');
  const [customOpen, setCustomOpen] = useState(mode === 'custom');
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  // Financial totals
  const collections = sales.reduce((n, s) => n + Number(s.paid_amount), 0);
  const serviceIncome = services.reduce((n, s) => n + Number(s.amount), 0);
  const payrollPaid = payroll.reduce((n, p) => n + Number(p.amount), 0);

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

  const PAGE_SIZE = 10;
  const [dailyPage, setDailyPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  const totalDailyPages = Math.max(1, Math.ceil(dailyRows.length / PAGE_SIZE));
  const pagedDailyRows = dailyRows.slice((dailyPage - 1) * PAGE_SIZE, dailyPage * PAGE_SIZE);

  const totalSalesPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const pagedSales = sales.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE);

  const totalAuditPages = Math.max(1, Math.ceil(audit.length / PAGE_SIZE));
  const pagedAudit = audit.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE);

  const applyPeriod = (newMode: string) => {
    if (newMode === 'custom') {
      setCustomOpen(true);
    } else {
      setCustomOpen(false);
      setDailyPage(1);
      setSalesPage(1);
      setAuditPage(1);
      router.push(`/owner/reports?period=${newMode}`);
    }
  };

  const submitCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setDailyPage(1);
    setSalesPage(1);
    setAuditPage(1);
    router.push(`/owner/reports?period=custom&from=${fromDate}&to=${toDate}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* =========================================================================
          PRODUCT CERTIFICATION ALERT (RED ONLY WHEN DEFICIT FLAGGED)
      ========================================================================= */}
      {cementYieldChecks.some((c) => c.flagged) && (
        <section className="bg-red-50 border-2 border-red-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-red-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-xs sm:text-sm font-black text-red-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>የምርት ጉድለት ማስጠንቀቂያ (ከ1 ከረጢት በላይ ጉድለት)</span>
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black font-mono">
              ጉድለት ተገኝቷል
            </span>
          </div>

          {/* Mobile View: Cards */}
          <div className="space-y-2.5 sm:hidden">
            {cementYieldChecks
              .filter((c) => c.flagged)
              .map((check, idx) => (
                <div
                  key={`${check.date}-${check.productKey}-${idx}`}
                  className="bg-white rounded-xl border border-red-300 p-3 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{check.productName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{check.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-red-50/60 p-2 rounded-lg font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">የወጣ ሲሚንቶ</span>
                      <span className="font-bold text-slate-900">{check.cement} ከረጢት</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">የቀኑ ምርት</span>
                      <span className="font-bold text-red-600">{check.blocks.toLocaleString()} ብሎክ</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-600 text-white text-[11px] font-bold">
                    ⚠ {check.explanation}
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-red-200 text-[10px] font-black uppercase text-red-800">
                <tr>
                  <th className="px-3 py-2">ቀን</th>
                  <th className="px-3 py-2">የምርት ዓይነት</th>
                  <th className="px-3 py-2">የወጣ ሲሚንቶ</th>
                  <th className="px-3 py-2">የቀኑ ምርት</th>
                  <th className="px-3 py-2">የሚጠበቀው</th>
                  <th className="px-3 py-2">ሁኔታ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200/60 bg-white rounded-xl">
                {cementYieldChecks
                  .filter((c) => c.flagged)
                  .map((check, idx) => (
                    <tr key={`${check.date}-${check.productKey}-${idx}`} className="bg-red-50/70 font-semibold">
                      <td className="px-3 py-2.5 font-mono text-slate-900">{check.date}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{check.productName}</td>
                      <td className="px-3 py-2.5 font-mono">{check.cement} ከረጢት</td>
                      <td className="px-3 py-2.5 font-mono font-black text-red-600">
                        {check.blocks.toLocaleString()} ብሎክ
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">
                        {check.minimum.toLocaleString()}–{check.maximum.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">
                          ⚠ {check.explanation}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          HEADER ROW & RESPONSIVE PERIOD SELECTOR
      ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የተጣራ የሂሳብ መረጃ
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            የፋይናንስ እና የስራ ሪፖርቶች
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>ከ {from} እስከ {to}</span>
          </p>
        </div>

        {/* Responsive Segmented Period Control */}
        <div className="w-full md:w-auto">
          <nav
            aria-label="Period selector"
            className="grid grid-cols-4 w-full md:w-auto bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80 gap-1 shrink-0"
          >
            {[
              { id: 'daily', mobileLabel: 'ዛሬ', fullLabel: 'ዛሬ' },
              { id: 'weekly', mobileLabel: '7 ቀናት', fullLabel: 'ያለፉት 7 ቀናት' },
              { id: 'monthly', mobileLabel: 'ይህ ወር', fullLabel: 'ይህ ወር' },
              { id: 'custom', mobileLabel: 'ብጁ ቀን', fullLabel: 'ብጁ የቀን ክልል' },
            ].map((item) => {
              const isSelected = mode === item.id || (item.id === 'custom' && customOpen);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyPeriod(item.id)}
                  className={`text-center py-2 px-1 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.fullLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Custom Date Form (Shown when custom is selected) */}
      {customOpen && (
        <form
          onSubmit={submitCustomRange}
          className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-in fade-in"
        >
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-slate-600 shrink-0">ከ (From):</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              required
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-slate-600 shrink-0">እስከ (To):</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>ሪፖርት አውጣ</span>
          </button>
        </form>
      )}

      {/* =========================================================================
          FINANCIAL KPI SUMMARY (MONEY IN & OUT)
      ========================================================================= */}
      <div className="space-y-2.5 sm:space-y-3">
        {/* Mobile View: Side-by-side executive stat tiles */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {/* Money In */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-white rounded-2xl p-3.5 border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  የገባ ገቢ
                </span>
                <span className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-base xs:text-lg font-black font-mono text-emerald-600 tracking-tight leading-none">
                +{money(collections + serviceIncome)}
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-emerald-100/80 text-[10px] font-mono text-slate-500 space-y-0.5">
              <div className="truncate">ሽያጭ: <span className="font-semibold text-slate-700">{money(collections)}</span></div>
              <div className="truncate">አገልግሎት: <span className="font-semibold text-slate-700">{money(serviceIncome)}</span></div>
            </div>
          </div>

          {/* Money Out */}
          <div className="bg-gradient-to-br from-rose-50/80 to-white rounded-2xl p-3.5 border border-rose-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">
                  የወጣ ወጪ
                </span>
                <span className="w-6 h-6 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-base xs:text-lg font-black font-mono text-rose-600 tracking-tight leading-none">
                -{money(payrollPaid)}
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-rose-100/80 text-[10px] font-mono text-slate-500 space-y-0.5">
              <div className="truncate">ደመወዝ: <span className="font-semibold text-slate-700">{money(payrollPaid)}</span></div>
              <div className="truncate">ክፍያዎች: <span className="font-semibold text-slate-700">{payroll.length} ሰራተኞች</span></div>
            </div>
          </div>
        </div>

        {/* Desktop View: Full Spacious Cards */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ጠቅላላ የገባ ገቢ (Money In)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 tracking-tight">
                +{money(collections + serviceIncome)}
              </div>
              <p className="text-xs text-slate-500 mt-1">የምርት ሽያጭ እና የአገልግሎት ገቢዎች</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>የምርት ሽያጭ: {money(collections)}</span>
              <span>አገልግሎት: {money(serviceIncome)}</span>
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                የወጣ ወጪ (Money Out)
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black font-mono text-rose-600 tracking-tight">
                -{money(payrollPaid)}
              </div>
              <p className="text-xs text-slate-500 mt-1">የቀን ሰራተኞች ደመወዝ እና የስራ ወጪዎች</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>የደመወዝ ወጪ: {money(payrollPaid)}</span>
              <span>የተከፈሉ መዝገቦች: {payroll.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTIVITY SECTION TABS & LISTS
      ========================================================================= */}
      <div className="space-y-3.5 pt-1">
        {/* Modern Segmented Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'daily', label: 'ዕለታዊ እንቅስቃሴ', count: dailyRows.length, icon: ChartNoAxesCombined },
            { id: 'sales', label: 'የሽያጭ ደረሰኞች', count: sales.length, icon: Receipt },
            { id: 'audit', label: 'የለውጥ ታሪክ', count: audit.length, icon: Activity },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black whitespace-nowrap rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
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
          <div className="space-y-3">
            {/* Mobile View: Touch Cards */}
            <div className="space-y-2.5 sm:hidden">
              {pagedDailyRows.map(([date, values]) => {
                const dayNet = values.sales + values.services - values.payroll;
                return (
                  <div
                    key={date}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-black text-xs text-slate-900 font-mono">{date}</span>
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                          dayNet >= 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        Net: {money(dayNet)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-[10px] block font-sans font-semibold">ሽያጭ</span>
                        <span className="font-black text-slate-800">
                          {money(values.sales)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-[10px] block font-sans font-semibold">አገልግሎቶች</span>
                        <span className="font-black text-slate-800">
                          {money(values.services)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-[10px] block font-sans font-semibold">ደመወዝ</span>
                        <span className="font-black text-slate-800">
                          {money(values.payroll)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-[10px] block font-sans font-semibold">የተመረተ</span>
                        <span className="font-black text-slate-900">
                          +{values.production.toLocaleString()} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ቀን</th>
                    <th className="py-3 px-4">ሽያጭ</th>
                    <th className="py-3 px-4">አገልግሎቶች</th>
                    <th className="py-3 px-4">ደመወዝ</th>
                    <th className="py-3 px-4 text-right">የተመረተ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {pagedDailyRows.map(([date, values]) => (
                    <tr key={date} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{date}</td>
                      <td className="py-3 px-4 text-slate-700">{money(values.sales)}</td>
                      <td className="py-3 px-4 text-slate-700">{money(values.services)}</td>
                      <td className="py-3 px-4 text-slate-700">{money(values.payroll)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        +{values.production.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dailyRows.length === 0 && (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                በዚህ ክፍለ-ጊዜ ምንም የተመዘገበ የስራ እንቅስቃሴ የለም።
              </div>
            )}

            {/* Pagination Controls */}
            {totalDailyPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <button
                  type="button"
                  disabled={dailyPage <= 1}
                  onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ቀዳሚ</span>
                </button>
                <span className="text-xs font-semibold font-mono text-slate-700 px-2">
                  ገጽ {dailyPage} ከ {totalDailyPages}
                </span>
                <button
                  type="button"
                  disabled={dailyPage >= totalDailyPages}
                  onClick={() => setDailyPage((p) => Math.min(totalDailyPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>ቀጣይ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: SALES (SOLD ITEMS)
        ========================================================================= */}
        {activeTab === 'sales' && (
          <div className="space-y-3">
            {/* Mobile View: Touch Cards */}
            <div className="space-y-2.5 sm:hidden">
              {pagedSales.map((s) => {
                const isPaid = Number(s.paid_amount) >= Number(s.total_amount);
                const due = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
                const line = s.sale_lines?.[0];
                const itemName = line?.item_name_snapshot || 'Product Sale';
                const itemQty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '';

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900 truncate">
                        {itemName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPaid ? 'ተከፍሏል' : `ያልተከፈለ: ${money(due)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">
                          {itemQty ? `${itemQty} · ` : ''}{s.customer_name || 'በቀጥታ ሽያጭ'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{s.sale_date} · በ{recordedBy(s.profiles)} ተመዝግቧል</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-black text-slate-900 text-sm">
                          {money(Number(s.total_amount))}
                        </span>
                        {!isPaid && (
                          <span className="block text-[10px] text-slate-400">
                            የተከፈለ: {money(Number(s.paid_amount))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">የተሸጠ እቃ</th>
                    <th className="py-3 px-4">ብዛት</th>
                    <th className="py-3 px-4">ደንበኛ</th>
                    <th className="py-3 px-4">ድምር</th>
                    <th className="py-3 px-4">የተከፈለ</th>
                    <th className="py-3 px-4 text-right">ሁኔታ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedSales.map((s) => {
                    const isPaid = Number(s.paid_amount) >= Number(s.total_amount);
                    const due = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
                    const line = s.sale_lines?.[0];
                    const itemName = line?.item_name_snapshot || 'Product Sale';
                    const itemQty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '—';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{itemName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{s.sale_date}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{itemQty}</td>
                        <td className="py-3 px-4 text-slate-800">
                          {s.customer_name || 'በቀጥታ ሽያጭ'}
                          <span className="mt-0.5 block text-xs text-slate-400">በ{recordedBy(s.profiles)} ተመዝግቧል</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {money(Number(s.total_amount))}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {money(Number(s.paid_amount))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isPaid ? 'ተከፍሏል' : `ያልተከፈለ (${money(due)})`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sales.length === 0 && (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                በዚህ ክፍለ-ጊዜ ምንም የተመዘገበ የሽያጭ ደረሰኝ የለም።
              </div>
            )}

            {/* Pagination Controls */}
            {totalSalesPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <button
                  type="button"
                  disabled={salesPage <= 1}
                  onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ቀዳሚ</span>
                </button>
                <span className="text-xs font-semibold font-mono text-slate-700 px-2">
                  ገጽ {salesPage} ከ {totalSalesPages}
                </span>
                <button
                  type="button"
                  disabled={salesPage >= totalSalesPages}
                  onClick={() => setSalesPage((p) => Math.min(totalSalesPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>ቀጣይ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: AUDIT HISTORY
        ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {pagedAudit.map((entry) => {
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
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {labelFor(entry.entity_type)}
                      </span>
                      <span className="text-[11px] text-slate-400">በ</span>
                      <span className="text-slate-700 font-bold">
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
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                      >
                        <span className="text-slate-400 capitalize">
                          {labelFor(key.split('.').at(-1) || key)}:
                        </span>
                        <span>{showValue(key, before[key])}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-slate-900">
                          {showValue(key, after[key])}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {audit.length === 0 && (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                በዚህ ክፍለ-ጊዜ ምንም የተመዘገበ የለውጥ ታሪክ የለም።
              </div>
            )}

            {/* Pagination Controls */}
            {totalAuditPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <button
                  type="button"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ቀዳሚ</span>
                </button>
                <span className="text-xs font-semibold font-mono text-slate-700 px-2">
                  ገጽ {auditPage} ከ {totalAuditPages}
                </span>
                <button
                  type="button"
                  disabled={auditPage >= totalAuditPages}
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>ቀጣይ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
