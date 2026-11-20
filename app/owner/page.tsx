import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/supabase/server';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag,
  ChartNoAxesCombined,
  Wrench,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type OverviewPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly';

const todayInNairobi = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const currentHourInNairobi = () => {
  const str = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: 'numeric',
    hour12: false,
  }).format(new Date());
  return parseInt(str, 10) || 12;
};

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
  name.includes('10/10')
    ? '/products/block-10-10.png'
    : name.includes('15/15')
    ? '/products/block-15-15.png'
    : name.includes('20/20')
    ? '/products/block-20-20.png'
    : '/products/terrace.png';

const displayProductName = (name: string) =>
  name.replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ').replace(/Terrace/i, 'ቴራሶ');

interface ProductCertConfig {
  name: string;
  key: string;
  minRate: number;
  maxRate: number;
  threshold: number; // 1 full cement output difference
}

const CERT_CONFIGS: ProductCertConfig[] = [
  { name: '10/10 ብሎክ', key: '10/10', minRate: 65, maxRate: 70, threshold: 65 },
  { name: '15/15 ብሎክ', key: '15/15', minRate: 60, maxRate: 65, threshold: 60 },
  { name: '20/20 ብሎክ', key: '20/20', minRate: 55, maxRate: 60, threshold: 55 },
];

export default async function OwnerPortal({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const rawPeriod = params.period || 'today';
  const period: OverviewPeriod = ['today', 'yesterday', 'weekly', 'monthly'].includes(rawPeriod)
    ? (rawPeriod as OverviewPeriod)
    : 'today';

  const client = await db();
  const today = todayInNairobi();
  const currentHour = currentHourInNairobi();

  let startDate = today;
  let endDate = today;
  let periodLabel = 'ዛሬ (Today)';

  if (period === 'yesterday') {
    startDate = addDays(today, -1);
    endDate = addDays(today, -1);
    periodLabel = 'ትናንት (Yesterday)';
  } else if (period === 'weekly') {
    startDate = addDays(today, -7);
    endDate = today;
    periodLabel = 'ይህ ሳምንት (This Week)';
  } else if (period === 'monthly') {
    startDate = `${today.slice(0, 7)}-01`;
    endDate = today;
    periodLabel = 'ይህ ወር (This Month)';
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

  // 1. SIMPLE MONEY FLOW (PURE CASH ONLY - NO CREDIT)
  const productSalesIncome = (sales ?? []).reduce(
    (sum, row) => sum + Number(row.paid_amount || row.total_amount),
    0
  );
  const serviceIncome = (services ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalMoneyIn = productSalesIncome + serviceIncome;

  const totalPayrollExpenses = (payroll ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalMoneyOut = totalPayrollExpenses;

  // 2. PRODUCT CERTIFICATION ALGORITHM (DAILY SHIFTS & YIELD AUDIT)
  const certifications = CERT_CONFIGS.map((config) => {
    const prod = (products ?? []).find((p) => p.name.includes(config.key));
    if (!prod) return null;

    // Total cement taken across all shifts for this block type
    const cementBags = Math.round(
      (cementMovements ?? [])
        .filter((m) => m.reason && m.reason.includes(config.key))
        .reduce((sum, m) => sum + Math.abs(Number(m.quantity_delta)), 0)
    );

    // Total blocks produced across all shifts for this block type
    const blocksProduced = Math.round(
      (production ?? [])
        .filter((r) => r.output_product_id === prod.id)
        .reduce((sum, r) => sum + Number(r.output_quantity), 0)
    );

    // Rule: "if there is a certification if there is not dont display it"
    if (cementBags <= 0 && blocksProduced <= 0) {
      return null;
    }

    const minExpected = cementBags * config.minRate;
    const maxExpected = cementBags * config.maxRate;
    const yieldPerBag = cementBags > 0 ? (blocksProduced / cementBags).toFixed(1) : '0';
    const shortfall = minExpected - blocksProduced;

    // Shift in progress logic:
    // If evaluating today and work day is still ongoing (< 18:00) and output is below min,
    // workers are still in their second shift -> do NOT raise false shortfall alert mid-day.
    const isToday = period === 'today';
    const isDayOngoing = isToday && currentHour < 18;

    let status: 'certified' | 'flagged' | 'in_progress' = 'certified';
    let statusLabel = '✓ ተረጋግጧል (Certified)';
    let explanation = '';

    if (isDayOngoing && shortfall > 0) {
      status = 'in_progress';
      statusLabel = 'ፈረቃ በሂደት ላይ (In Progress)';
      explanation = 'የቀኑ ሁለተኛ ፈረቃ ስራ ገና ስላላለቀ ሙሉ ቆጠራው በቀኑ መጨረሻ ላይ ተረጋግጦ ይቀርባል።';
    } else if (shortfall >= config.threshold) {
      // Shortfall is >= 1 full cement output difference! (e.g. 10 bags used, only 550 produced)
      status = 'flagged';
      statusLabel = '⚠ ልዩነት አለ (Flagged)';
      explanation = `ጉድለቱ (${shortfall} ብሎክ) ከ1 ሙሉ ከረጢት ሲሚንቶ ምርት (${config.threshold}) በላይ ነው! የቆጠራ ስህተት ወይም የሲሚንቶ ብክነት ሊኖር ስለሚችል መጣራት አለበት።`;
    } else if (blocksProduced > maxExpected + config.threshold) {
      // Overcount by >= 1 full cement output! (someone might have counted twice)
      status = 'flagged';
      statusLabel = '⚠ የተጋነነ ቆጠራ (Overcount)';
      explanation = `የተመዘገበው ምርት ከተጠበቀው በ${blocksProduced - maxExpected} ብሎክ ብልጫ አለው። በቆጠራ ወቅት በስህተት ሁለት ጊዜ ተቆጥሮ ሊሆን ይችላል።`;
    } else {
      // Within standard range OR dropped by less than 1 cement output (e.g. dropped by 30, 40, 50 blocks)
      status = 'certified';
      statusLabel = '✓ ተረጋግጧል (Certified)';
      explanation =
        shortfall > 0
          ? `የተመዘገበው ቅናሽ (${shortfall} ብሎክ) ከ1 ከረጢት ምርት ያነሰ ስለሆነ እንደ መደበኛ የምርት ብክነት አልፏል።`
          : `ምርቱ በትክክለኛ የፋብሪካው መመዘኛ (Recipe) መሰረት ተመርቶ ተረጋግጧል።`;
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

  // Yard stock products for at-a-glance status
  const yardProducts = (products ?? []).filter(
    (p) => !['cement', 'service'].includes(p.category)
  );

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER ROW & SIMPLE PERIOD FILTER
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">
              የፋብሪካው የስራ ሁኔታ · {today}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            የባለቤት ዳሽቦርድ (Executive Overview)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            የደመነ ግንባታ እቃዎች ማምረቻ ዕለታዊ የገንዘብ እና የምርት ማረጋገጫ ማጠቃለያ
          </p>
        </div>

        {/* Simple Filter: Today, Yesterday, Week, Month */}
        <nav
          aria-label="Period selector"
          className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-center"
        >
          {[
            { id: 'today', label: 'ዛሬ (Today)' },
            { id: 'yesterday', label: 'ትናንት (Yesterday)' },
            { id: 'weekly', label: 'ይህ ሳምንት (Week)' },
            { id: 'monthly', label: 'ይህ ወር (Month)' },
          ].map((tab) => {
            const isActive = period === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/owner?period=${tab.id}`}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* =========================================================================
          2. SIMPLE MONEY FLOW (ONLY MONEY IN & MONEY OUT - NO NET CASH, NO CREDIT)
      ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>💵 የገንዘብ ፍሰት (Money Flow)</span>
            <span className="text-xs text-slate-400 font-normal font-mono">· {periodLabel}</span>
          </h2>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            ጥሬ ገንዘብ ብቻ (Cash Only)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. Total Money In */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
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
                +{money(totalMoneyIn)}
              </div>
              <p className="text-xs text-slate-500 mt-1">ከምርት ሽያጭ እና ከአገልግሎት ክፍያዎች የተሰበሰበ</p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>የምርት ሽያጭ: {money(productSalesIncome)}</span>
              <span>አገልግሎት: {money(serviceIncome)}</span>
            </div>
          </div>

          {/* 2. Total Money Out */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
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

      {/* =========================================================================
          3. PRODUCT CERTIFICATION SECTION (CEMENT VS OUTPUT VERIFICATION)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                የእለቱ የምርት ማረጋገጫ (Product Certification)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold font-mono">
                የቀኑ ሙሉ ድምር (Full-Day Shifts)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              <strong>የአሰራር ህግ፦</strong> በቀን ውስጥ 2 ፈረቃዎች ስለሚኖሩ ማረጋገጫው የሚሰራው በቀኑ መጨረሻ ላይ ነው። የ1 ከረጢት ሙሉ ምርት ልዩነት ሲኖር ብቻ ያሳውቃል፤ ከ1 ከረጢት በታች የሆነ ቅናሽ (30፣ 40፣ 50 ብሎክ) መደበኛ ነው አይታገድም።
            </p>
          </div>
          <div className="text-left lg:text-right text-xs font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
            <div className="font-bold text-slate-800">የማሽኑ መመዘኛ (Yield Standards):</div>
            <div>• 10/10 ብሎክ፦ <strong>65 - 70 pcs / ከረጢት</strong> (1 ከረጢት = 65)</div>
            <div>• 15/15 ብሎክ፦ <strong>60 - 65 pcs / ከረጢት</strong> (1 ከረጢት = 60)</div>
            <div>• 20/20 ብሎክ፦ <strong>55 - 60 pcs / ከረጢት</strong> (1 ከረጢት = 55)</div>
          </div>
        </div>

        {/* Certification Cards Grid */}
        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certifications.map((item) => {
              if (!item) return null;
              const isFlagged = item.status === 'flagged';
              const isInProgress = item.status === 'in_progress';

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    isFlagged
                      ? 'border-rose-400 bg-rose-50/25 ring-2 ring-rose-500/10'
                      : isInProgress
                      ? 'border-blue-400 bg-blue-50/20'
                      : 'border-emerald-500/30 bg-emerald-50/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <Image
                          src={imageFor(item.name)}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="max-h-8 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          1 ከረጢት = {item.minRate} - {item.maxRate} ብሎክ
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                        isFlagged
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  {/* Numbers Grid */}
                  <div
                    className={`grid grid-cols-2 gap-2 p-3 rounded-xl border text-xs bg-white ${
                      isFlagged ? 'border-rose-200' : 'border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="text-slate-400 text-[10px] block">የወጣ ሲሚንቶ</span>
                      <span className="font-mono font-black text-sm text-slate-900">
                        {item.cementBags} ከረጢት
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">የቀኑ ጠቅላላ ምርት</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          isFlagged ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.blocksProduced.toLocaleString()} ክፍሎች
                      </span>
                    </div>
                  </div>

                  {/* Explanation Banner */}
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] space-y-0.5 ${
                      isFlagged
                        ? 'bg-rose-100/70 border-rose-200 text-rose-900'
                        : isInProgress
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>የሚጠበቀው፦ {item.minExpected} - {item.maxExpected} pcs</span>
                      <span className="font-mono">
                        {item.shortfall > 0
                          ? `ቅናሽ፦ ${item.shortfall} ብሎክ`
                          : `አማካይ፦ ${item.yieldPerBag}/ከረጢት`}
                      </span>
                    </div>
                    <p className="text-[10px] opacity-90 leading-snug">{item.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            በዚህ ጊዜ የተከናወነ ምርት ወይም የወጣ ሲሚንቶ የለም።
          </div>
        )}

        {/* Footnote */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>ቀኑ በሂደት ላይ ሳለ (Mid-day):</strong> ሁለተኛው ፈረቃ ገና ስላላለቀ ቀድሞ ማንቂያ አይሰጥም (ባጅ፦ <em>"ፈረቃ በሂደት ላይ"</em> ተብሎ ይጠበቃል)።
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            * ሲሚንቶ ያልወጣለት ምርት አይታይም
          </span>
        </div>
      </div>

      {/* =========================================================================
          4. SIMPLE YARD STOCK AT A GLANCE (Ready to Sell Stock in Yard)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              በግቢው ያለ ክምችት (Yard Stock at a Glance)
            </h2>
            <p className="text-[11px] text-slate-400">አሁን ለመሸጥ ዝግጁ የሆኑ ምርቶች</p>
          </div>
          <Link
            href="/app/stock"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            የመጋዘን ዝርዝር →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {yardProducts.map((p) => {
            const stock = Number(p.stock_on_hand || 0);
            const threshold = Number(p.low_stock_threshold || 20);
            const isLow = stock <= threshold;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  isLow
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  <Image
                    src={imageFor(p.name)}
                    alt={p.name}
                    width={44}
                    height={44}
                    className="max-h-11 w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {displayProductName(p.name)}
                  </div>
                  <div
                    className={`text-base font-black font-mono ${
                      isLow ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {stock.toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] font-bold ${
                      isLow ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {isLow ? 'ዝቅተኛ ⚠' : 'በቂ ክምችት ✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          5. QUICK OWNER SHORTCUTS
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/owner/prices"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">የሽያጭ ዋጋዎች</div>
            <div className="text-[10px] text-slate-400">ዋጋዎችን አስተካክል</div>
          </div>
        </Link>

        <Link
          href="/owner/reports"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <ChartNoAxesCombined className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">ሙሉ ሪፖርቶች</div>
            <div className="text-[10px] text-slate-400">የፋይናንስ ሪፖርት</div>
          </div>
        </Link>

        <Link
          href="/owner/machinery"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">ማሽነሪዎች</div>
            <div className="text-[10px] text-slate-400">የመሳሪያዎች ሁኔታ</div>
          </div>
        </Link>

        <Link
          href="/owner/records"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">መዝገቦች</div>
            <div className="text-[10px] text-slate-400">የስራ መዝገቦች</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
