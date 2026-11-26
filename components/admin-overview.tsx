import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/supabase/server';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Tag,
  ChartNoAxesCombined,
  Wrench,
  Boxes,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { getTodayEthiopic, ethiopicToGregorian } from '@/lib/ethiopian-calendar';
import { resolveProductionAlert } from '@/app/actions/resolve-production-alert';

export const dynamic = 'force-dynamic';

type OverviewPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly';

const todayInNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const money = (n: number) =>
  `${Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ብር`;

const imageFor = (name: string) =>
  name.toLowerCase().includes('cement') || name.includes('ሲሚንቶ')
    ? '/products/cement-50kg.png'
    : name.includes('10/10')
    ? '/products/block-10-10.png'
    : name.includes('15/15')
    ? '/products/block-15-15.png'
    : name.includes('20/20')
    ? '/products/block-20-20.png'
    : '/products/terrace.png';

const displayProductName = (name: string) =>
  name
    .replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ')
    .replace(/Terrace/i, 'ቴራሶ')
    .replace(/Cement\s*50kg/i, 'ሲሚንቶ (50kg)');

interface ProductCertConfig {
  name: string;
  key: string;
  minRate: number;
  maxRate: number;
  threshold: number;
}

const CERT_CONFIGS: ProductCertConfig[] = [
  { name: '10/10 ብሎክ', key: '10/10', minRate: 65, maxRate: 70, threshold: 65 },
  { name: '15/15 ብሎክ', key: '15/15', minRate: 60, maxRate: 65, threshold: 60 },
  { name: '20/20 ብሎክ', key: '20/20', minRate: 55, maxRate: 60, threshold: 55 },
];

interface AdminOverviewProps {
  basePath: '/app' | '/owner' | '/manager';
  title?: string;
  searchParams: Promise<{ period?: string; alert_error?: string }>;
}

export default async function AdminOverview({
  basePath,
  title = 'አጠቃላይ እይታ',
  searchParams,
}: AdminOverviewProps) {
  const params = await searchParams;
  const rawPeriod = params.period || 'today';
  const period: OverviewPeriod = ['today', 'yesterday', 'weekly', 'monthly'].includes(rawPeriod)
    ? (rawPeriod as OverviewPeriod)
    : 'today';

  const client = await db();
  const today = todayInNairobi();

  let startDate = today;
  let endDate = today;
  let periodLabel = 'ዛሬ';

  if (period === 'yesterday') {
    startDate = addDays(today, -1);
    endDate = addDays(today, -1);
    periodLabel = 'ትናንት';
  } else if (period === 'weekly') {
    startDate = addDays(today, -7);
    endDate = today;
    periodLabel = 'ይህ ሳምንት';
  } else if (period === 'monthly') {
    const todayEth = getTodayEthiopic();
    startDate = ethiopicToGregorian(todayEth.year, todayEth.month, 1);
    endDate = today;
    periodLabel = `ይህ ወር (${todayEth.monthName})`;
  }

  const nextDate = addDays(endDate, 1);

  const [
    { data: products },
    { data: sales },
    { data: services },
    { data: payroll },
    { data: production },
    { data: cementMovements },
  ] = await Promise.all([
    client
      .from('products')
      .select('id,name,unit,category,selling_price,stock_on_hand,low_stock_threshold,is_active')
      .eq('is_active', true)
      .order('name'),
    client
      .from('sales')
      .select(
        'id,invoice_number,customer_name,total_amount,paid_amount,sale_date,created_at,status,sale_lines(item_name_snapshot,quantity,unit_snapshot)'
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
      .select('id,production_date,output_quantity,output_product_id,created_at')
      .gte('production_date', startDate)
      .lte('production_date', endDate)
      .order('created_at', { ascending: false }),
    client
      .from('inventory_movements')
      .select('id,product_id,quantity_delta,movement_type,reason,created_at')
      .eq('movement_type', 'internal_use')
      .gte('created_at', `${startDate}T00:00:00+03:00`)
      .lt('created_at', `${nextDate}T00:00:00+03:00`),
  ]);

  // 1. SIMPLE MONEY FLOW (MONEY IN & OUT)
  const productSalesIncome = (sales ?? []).reduce(
    (sum, row) => sum + Number(row.paid_amount || row.total_amount),
    0
  );
  const serviceIncome = (services ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalMoneyIn = productSalesIncome + serviceIncome;

  const totalPayrollExpenses = (payroll ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalMoneyOut = totalPayrollExpenses;

  // 2. PRODUCT CERTIFICATION ALGORITHM (COMPLETED DAYS ONLY — WAIT 1 FULL DAY BEFORE FLAGGING)
  // Today's shifts may finish in the evening, so never flag today's production today;
  // only audit completed days strictly before today (< today).
  const todayStartIso = `${today}T00:00:00+03:00`;
  const completedCementMovements = (cementMovements ?? []).filter(
    (m) => m.created_at < todayStartIso
  );
  const completedProduction = (production ?? []).filter(
    (r) => r.production_date < today
  );

  const certifications = CERT_CONFIGS.map((config) => {
    const prod = (products ?? []).find((p) => p.name.includes(config.key));
    if (!prod) return null;

    const cementBags = Math.round(
      completedCementMovements
        .filter((m) => m.reason && m.reason.includes(config.key))
        .reduce((sum, m) => sum + Math.abs(Number(m.quantity_delta)), 0)
    );

    const blocksProduced = Math.round(
      completedProduction
        .filter((r) => r.output_product_id === prod.id)
        .reduce((sum, r) => sum + Number(r.output_quantity), 0)
    );

    if (cementBags <= 0 && blocksProduced <= 0) {
      return null;
    }

    const minExpected = cementBags * config.minRate;
    const maxExpected = cementBags * config.maxRate;
    const yieldPerBag = cementBags > 0 ? (blocksProduced / cementBags).toFixed(1) : '0';
    const shortfall = minExpected - blocksProduced;

    let status: 'certified' | 'flagged' = 'certified';
    let statusLabel = 'ትክክል ✓';
    let explanation = '';

    if (shortfall >= config.threshold) {
      status = 'flagged';
      statusLabel = 'ጉድለት አለ! ⚠';
      explanation = `${shortfall} ብሎክ ጉድለት (ከ1 ከረጢት በላይ)። ይጣራ!`;
    } else {
      status = 'certified';
      statusLabel = 'ትክክል ✓';
      explanation = 'መደበኛ ምርት።';
    }

    return {
      ...config,
      productId: prod.id,
      cementBags,
      blocksProduced,
      minExpected,
      maxExpected,
      yieldPerBag,
      shortfall,
      status,
      statusLabel,
      explanation,
    };
  }).filter(Boolean);

  const yesterdayDate = addDays(today, -1);
  const alertPeriodKey =
    period === 'yesterday'
      ? startDate
      : `${period}:${startDate}:${yesterdayDate}`;

  let resolvedProductKeys = new Set<string>();
  try {
    const { data: resolutions, error: resErr } = await client
      .from('production_alert_resolutions')
      .select('period_key, product_key')
      .or(`period_key.eq.${alertPeriodKey},and(period_key.gte.${startDate},period_key.lte.${yesterdayDate})`);
    if (!resErr && resolutions) {
      resolvedProductKeys = new Set(resolutions.map((r) => r.product_key));
    }
  } catch {
    resolvedProductKeys = new Set<string>();
  }

  const flaggedCertifications = certifications.filter(
    (item): item is NonNullable<typeof item> =>
      item !== null && item.status === 'flagged' && !resolvedProductKeys.has(item.key)
  );

  const sortRank = (name: string) => {
    if (name.includes('10/10')) return 1;
    if (name.includes('15/15')) return 2;
    if (name.includes('20/20')) return 3;
    if (name.toLowerCase().includes('cement') || name.includes('ሲሚንቶ')) return 4;
    return 5;
  };

  const stockProducts = (products ?? [])
    .filter((p) => p.category !== 'service')
    .sort((a, b) => sortRank(a.name) - sortRank(b.name));

  const cementProduct = stockProducts.find(
    (p) =>
      p.category === 'cement' ||
      p.name.toLowerCase().includes('cement') ||
      p.name.includes('ሲሚንቶ')
  );
  const finishedProducts = stockProducts.filter((p) => p !== cementProduct);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. HEADER ROW & RESPONSIVE PERIOD FILTER */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የቀጥታ ስራ ሁኔታ · {today}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            የደመነ ግንባታ እቃዎች ማምረቻ ዕለታዊ የገንዘብ ፍሰት እና የስራ እንቅስቃሴ
          </p>
        </div>

        {/* Responsive Segmented Filter */}
        <nav
          aria-label="Period selector"
          className="grid grid-cols-4 w-full md:w-auto bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80 gap-1 shrink-0"
        >
          {[
            { id: 'today', mobileLabel: t.overview.today, fullLabel: t.overview.today },
            { id: 'yesterday', mobileLabel: t.overview.yesterday, fullLabel: t.overview.yesterday },
            { id: 'weekly', mobileLabel: 'ሳምንት', fullLabel: t.overview.thisWeek },
            { id: 'monthly', mobileLabel: 'ወር', fullLabel: t.overview.thisMonth },
          ].map((tab) => {
            const isActive = period === tab.id;
            return (
              <Link
                key={tab.id}
                href={`${basePath}?period=${tab.id}`}
                className={`text-center py-2 px-1 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. SIMPLE MONEY FLOW (ONLY MONEY IN & MONEY OUT) */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>💵 የገንዘብ ፍሰት</span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-normal font-mono">· {periodLabel}</span>
          </h2>
        </div>

        {/* Mobile View: High-density Executive Finance Tiles */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {/* Mobile Money In */}
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
                +{money(totalMoneyIn)}
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-emerald-100/80 text-[10px] font-mono text-slate-500 space-y-0.5">
              <div className="truncate">ሽያጭ: <span className="font-semibold text-slate-700">{money(productSalesIncome)}</span></div>
              <div className="truncate">አገልግሎት: <span className="font-semibold text-slate-700">{money(serviceIncome)}</span></div>
            </div>
          </div>

          {/* Mobile Money Out */}
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
                -{money(totalMoneyOut)}
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-rose-100/80 text-[10px] font-mono text-slate-500 space-y-0.5">
              <div className="truncate">ደመወዝ: <span className="font-semibold text-slate-700">{money(totalPayrollExpenses)}</span></div>
              <div className="truncate">ክፍያዎች: <span className="font-semibold text-slate-700">{payroll?.length ?? 0} ሰራተኞች</span></div>
            </div>
          </div>
        </div>

        {/* Desktop View: Full Spacious Cards */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ጠቅላላ የገባ ገቢ
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 tracking-tight">
                +{money(totalMoneyIn)}
              </div>
              <p className="text-xs text-slate-500 mt-1">ከምርት ሽያጭ እና ከአገልግሎት ክፍያዎች የተሰበሰበ</p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>የምርት ሽያጭ: {money(productSalesIncome)}</span>
              <span>አገልግሎት: {money(serviceIncome)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                የወጣ ወጪ
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black font-mono text-rose-600 tracking-tight">
                -{money(totalMoneyOut)}
              </div>
              <p className="text-xs text-slate-500 mt-1">የቀን ሰራተኞች ደመወዝ እና የስራ ወጪዎች</p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>የደመወዝ ክፍያ: {money(totalPayrollExpenses)}</span>
              <span>የተከፈሉ መዝገቦች: {payroll?.length ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT CERTIFICATION ALERT (ONLY SHOWN IN RED WHEN FLAGGED) */}
      {params.alert_error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-900">
          ⚠️ {params.alert_error}
        </div>
      )}

      {flaggedCertifications.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-red-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-sm sm:text-lg font-black text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
                <span>የምርት ጉድለት ማስጠንቀቂያ (ከ1 ከረጢት በላይ ጉድለት)</span>
              </h2>
            </div>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-red-600 text-white text-[11px] sm:text-xs font-black font-mono shadow-2xs">
              {flaggedCertifications.length} ጉድለት ተገኝቷል
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {flaggedCertifications.map((item) => (
              <div
                key={item.key}
                className="bg-white rounded-2xl border-2 border-red-500 p-3.5 sm:p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 p-1 flex items-center justify-center shrink-0">
                      <Image
                        src={imageFor(item.name)}
                        alt={item.name}
                        width={32}
                        height={32}
                        className="max-h-8 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{item.name}</h3>
                      <p className="text-[10px] text-red-600 font-mono font-bold">
                        1 ከረጢት = {item.minRate}-{item.maxRate} ብሎክ
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {item.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-red-200 bg-red-50/50 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-semibold">የወጣ ሲሚንቶ</span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {item.cementBags} ከረጢት
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-semibold">የቀኑ ምርት</span>
                    <span className="font-mono font-black text-sm text-red-600">
                      {item.blocksProduced.toLocaleString()} ብሎክ
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-red-600 text-white text-xs font-bold space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-red-100">
                    <span>የሚጠበቀው፦ {item.minExpected} - {item.maxExpected}</span>
                    <span className="font-mono font-black text-white">
                      -{item.shortfall} ብሎክ ጉድለት
                    </span>
                  </div>
                  <div className="text-xs text-white font-black leading-snug">
                    {item.explanation}
                  </div>
                </div>

                {(basePath === '/manager' || basePath === '/owner') && (
                  <form
                    action={resolveProductionAlert}
                    className="pt-2 border-t border-red-100 flex items-center gap-1.5"
                  >
                    <input type="hidden" name="period_key" value={alertPeriodKey} />
                    <input type="hidden" name="product_key" value={item.key} />
                    <input type="hidden" name="return_to" value={`${basePath}?period=${period}`} />
                    <input
                      name="resolution_note"
                      placeholder="ማብራሪያ (አማራጭ)..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] rounded-lg border border-red-200 bg-red-50/40 focus:bg-white focus:outline-none focus:border-red-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>ተጣርቷል (አንሳ)</span>
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SIMPLE STOCK AT A GLANCE (Blocks, Cement & Terrace) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              በግቢው ያለ ክምችት
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400">የምርቶች እና የሲሚንቶ ክምችት መጠን</p>
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {stockProducts.length} ዓይነቶች
          </span>
        </div>

        {/* Mobile View: Cement hero raw material card + 2x2 grid for finished blocks */}
        <div className="space-y-2.5 sm:hidden">
          {cementProduct && (
            <div className="p-3.5 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-amber-200/60 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <Image
                    src={imageFor(cementProduct.name)}
                    alt={cementProduct.name}
                    width={40}
                    height={40}
                    className="max-h-10 w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {displayProductName(cementProduct.name)}
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    የመጋዘን ጥሬ እቃ
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black font-mono text-slate-900">
                  {Number(cementProduct.stock_on_hand || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">ከረጢት</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {finishedProducts.map((p) => {
              const stock = Number(p.stock_on_hand || 0);
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col items-center text-center shadow-2xs transition-colors"
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                    <Image
                      src={imageFor(p.name)}
                      alt={p.name}
                      width={44}
                      height={44}
                      className="max-h-11 w-auto object-contain"
                    />
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate w-full">
                    {displayProductName(p.name)}
                  </div>
                  <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                    {stock.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">ክምችት</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View: Full 5-column grid */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stockProducts.map((p) => {
            const stock = Number(p.stock_on_hand || 0);
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <Image
                    src={imageFor(p.name)}
                    alt={p.name}
                    width={40}
                    height={40}
                    className="max-h-10 w-auto object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {displayProductName(p.name)}
                  </div>
                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    {stock.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {p.category === 'cement' ? 'ከረጢት' : 'ክምችት'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. QUICK SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          href={`${basePath}/prices`}
          className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">የሽያጭ ዋጋዎች</div>
            <div className="text-[10px] text-slate-400 truncate">ዋጋዎችን አስተካክል</div>
          </div>
        </Link>

        <Link
          href={`${basePath}/reports`}
          className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <ChartNoAxesCombined className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">ሙሉ ሪፖርቶች</div>
            <div className="text-[10px] text-slate-400 truncate">የፋይናንስ ሪፖርት</div>
          </div>
        </Link>

        <Link
          href={`${basePath}/machinery`}
          className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">ማሽነሪዎች</div>
            <div className="text-[10px] text-slate-400 truncate">የመሳሪያዎች ሁኔታ</div>
          </div>
        </Link>

        {basePath === '/app' ? (
          <Link
            href="/app/stock"
            className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">የሲሚንቶ መጋዘን</div>
              <div className="text-[10px] text-slate-400 truncate">ክምችት እና እንቅስቃሴ</div>
            </div>
          </Link>
        ) : basePath === '/manager' ? (
          <Link
            href="/manager/profile"
            className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">የስራ አስኪያጅ መገለጫ</div>
              <div className="text-[10px] text-slate-400 truncate">የመለያ ዝርዝር መረጃ</div>
            </div>
          </Link>
        ) : (
          <Link
            href="/owner/users"
            className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-98 transition-all flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-50 text-violet-800 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">የስራ አስኪያጅ መለያ</div>
              <div className="text-[10px] text-slate-400 truncate">አዲስ ስራ አስኪያጅ ፍጠር</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
