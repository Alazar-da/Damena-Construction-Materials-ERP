import Link from 'next/link';
import { formatEthiopicDateTime } from '@/lib/ethiopian-calendar';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  DollarSign,
  Factory,
  Flame,
  PlusCircle,
  ShoppingCart,
} from 'lucide-react';

interface DashboardMovement {
  id: string;
  product_name: string;
  quantity_delta: number;
  movement_type: string;
  created_at: string;
  reason: string | null;
}

interface ServiceTotal {
  id: string;
  label: string;
  amount: number;
}

interface DashboardViewProps {
  dateLabel: string;
  cementQuantity: number;
  cementUsed: number;
  producedQuantity: number;
  serviceRevenue: number;
  serviceTotals: ServiceTotal[];
  movements: DashboardMovement[];
}

const movementLabels: Record<string, string> = {
  receipt: 'ወደ መጋዘን ገባ',
  internal_use: 'ለምርት ወጪ',
  sale: 'ሽያጭ',
  production_output: 'ምርት ተጠናቋል',
};

function localizeReason(reason: string | null) {
  if (!reason) return '—';
  if (reason === 'Finished production') return 'ምርት ተጠናቋል';
  if (reason === 'Given to production') return 'ለምርት ተሰጥቷል';
  if (reason === 'Production shift') return 'የምርት ፈረቃ';
  if (reason.startsWith('Sold on ')) return `የሽያጭ ደረሰኝ ${reason.slice(8)}`;
  return reason;
}

export default function DashboardView({
  dateLabel,
  cementQuantity,
  cementUsed,
  producedQuantity,
  serviceRevenue,
  serviceTotals,
  movements,
}: DashboardViewProps) {
  return (
    <div className="space-y-7 sm:space-y-9">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {dateLabel}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">የዛሬ ስራዎች</h1>
        <p className="mt-2 text-base text-slate-600">የሲሚንቶ ክምችት፣ ምርት እና የአገልግሎት ገቢ</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-[#eaf1ff] p-6 sm:p-8 lg:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-blue-200/70" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
                <Factory className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-blue-900">የዛሬ ውጤት</p>
                <h2 className="text-xl font-bold text-slate-950">የተጠናቀቀ ምርት</h2>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-5xl font-bold tracking-tight text-slate-950 tabular-nums sm:text-6xl">
                  {producedQuantity.toLocaleString('en-US')}
                </p>
                <p className="mt-2 text-base font-medium text-slate-700">ብሎኮች እና ቴራሶ · ክፍሎች</p>
              </div>
              <Link href="/app/production" className="erp-btn-primary min-h-12 gap-2 px-5 text-base shadow-lg shadow-blue-900/10">
                <Factory className="h-5 w-5" aria-hidden="true" />
                ምርት ይመዝግቡ
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[2rem] bg-[#111827] p-6 text-white shadow-lg sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/10">
                <Boxes className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">የመጋዘን ሁኔታ</span>
            </div>
            <p className="mt-6 text-base font-medium text-slate-300">በመጋዘን ያለ ሲሚንቶ</p>
            <p className="mt-2 text-4xl font-bold tabular-nums">
              {cementQuantity.toLocaleString('en-US')} <span className="text-lg font-semibold text-slate-300">ከረጢት</span>
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
              <Flame className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <p className="text-base text-slate-200">ዛሬ ለምርት የወጣ <strong className="ml-1 text-white">{cementUsed.toLocaleString('en-US')} ከረጢት</strong></p>
            </div>
          </div>
          <Link href="/app/stock" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-base font-bold text-slate-950 transition hover:bg-blue-50">
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            ሲሚንቶ ይመዝግቡ
          </Link>
        </div>
      </section>

      <section aria-label="ፈጣን ድርጊቶች" className="grid gap-3 sm:grid-cols-3">
        <Link href="/app/stock" className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800"><PlusCircle className="h-6 w-6" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-slate-950">ሲሚንቶ ተቀበል</strong><span className="mt-1 block text-sm text-slate-600">አዲስ ክምችት ይጨምሩ</span></span>
          <ArrowRight className="h-5 w-5 text-blue-800 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/app/production" className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Factory className="h-6 w-6" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-slate-950">ምርት መዝግብ</strong><span className="mt-1 block text-sm text-slate-600">የተጠናቀቁ ክፍሎችን ያስገቡ</span></span>
          <ArrowRight className="h-5 w-5 text-blue-800 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/app/sales" className="group flex min-h-[88px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-800"><ShoppingCart className="h-6 w-6" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-slate-950">ሽያጭ መዝግብ</strong><span className="mt-1 block text-sm text-slate-600">የተሸጡ ምርቶችን ያስገቡ</span></span>
          <ArrowRight className="h-5 w-5 text-blue-800 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.5fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-800"><DollarSign className="h-5 w-5" aria-hidden="true" /></span>
            <div><h2 className="text-xl font-bold text-slate-950">የአገልግሎት ገቢ</h2><p className="mt-1 text-sm text-slate-600">ዛሬ የተመዘገበ ገቢ</p></div>
          </div>
          <p className="mt-6 text-4xl font-bold text-slate-950 tabular-nums">{serviceRevenue.toLocaleString('en-US')} <span className="text-lg">ብር</span></p>
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            {serviceTotals.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-3 text-base">
                <span className="text-slate-700">{service.label}</span>
                <span className="font-bold tabular-nums text-slate-950">{service.amount.toLocaleString('en-US')} ብር</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><h2 className="text-xl font-bold text-slate-950">የቅርብ ጊዜ የመጋዘን እንቅስቃሴ</h2><p className="mt-1 text-sm text-slate-600">የተመዘገቡ ግብይቶች እና የምርት ለውጦች</p></div>
            <Link href="/app/stock" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-blue-800 hover:bg-blue-50">ሁሉንም ይመልከቱ <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="divide-y divide-slate-100 px-5 sm:px-7">
            {movements.slice(0, 5).map((movement) => {
              const isNegative = Number(movement.quantity_delta) < 0;
              return (
                <div key={movement.id} className="flex items-center gap-4 py-4">
                  <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex ${isNegative ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                    {isNegative ? <ArrowUpRight className="h-5 w-5" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-950">{movement.product_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">{movementLabels[movement.movement_type] ?? movement.movement_type}</span>
                      <span className="text-sm text-slate-600">{localizeReason(movement.reason)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-bold tabular-nums ${isNegative ? 'text-rose-800' : 'text-emerald-800'}`}>{isNegative ? '−' : '+'}{Math.abs(Number(movement.quantity_delta)).toLocaleString('en-US')}</p>
                    <time className="mt-1 block text-sm text-slate-600" dateTime={movement.created_at}>{formatEthiopicDateTime(movement.created_at)}</time>
                  </div>
                </div>
              );
            })}
            {movements.length === 0 && <div className="py-10 text-center text-base text-slate-600">እስካሁን የተመዘገበ እንቅስቃሴ የለም</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
