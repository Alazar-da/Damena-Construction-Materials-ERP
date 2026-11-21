import { db } from '@/lib/supabase/server';
import PayrollForm from './payroll-form';
import PayrollHistory from './payroll-history';
import { CalendarDays, Users, Wallet } from 'lucide-react';

const money = (value: number) =>
  `${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })} ብር`;

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());

const formatDisplayDate = () =>
  new Intl.DateTimeFormat('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

export default async function PayrollScreen() {
  const c = await db();

  const { data: records } = await c
    .from('payroll_records')
    .select(
      'id,worker_name,pay_type,period_start,period_end,quantity,rate_snapshot,amount,status,notes,payment_method,paid_at,created_at'
    )
    .order('paid_at', { ascending: false })
    .order('period_start', { ascending: false })
    .limit(100);

  const date = today();
  const month = date.slice(0, 7);

  const paidRecords = (records ?? []).filter((r) => r.status === 'paid');
  const monthPaid = paidRecords
    .filter((r) => String(r.period_start).startsWith(month))
    .reduce((n, r) => n + Number(r.amount), 0);
  const todayPaid = paidRecords
    .filter((r) => String(r.period_start) === date)
    .reduce((n, r) => n + Number(r.amount), 0);

  return (
    <div className="space-y-7 sm:space-y-9">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#111827] p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 h-64 w-64 rounded-full border-[36px] border-blue-400/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-blue-100 ring-1 ring-white/10">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDisplayDate()}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">የሰራተኛ ክፍያ</h1>
            <p className="mt-2 text-base text-slate-300">የቀን፣ የሳምንት ወይም የወር ክፍያ በቀላሉ ይመዝግቡ</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 sm:min-w-52">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200"><Wallet className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="text-sm text-slate-300">ዛሬ የተከፈለ</p><strong className="mt-0.5 block text-lg font-bold tabular-nums">{money(todayPaid)}</strong></div>
          </div>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><Wallet className="h-5 w-5" aria-hidden="true" /></span><span className="text-base font-semibold text-slate-700">ዛሬ የተከፈለ</span></div>
          <div className="mt-4 text-2xl font-extrabold text-slate-950 tabular-nums sm:text-3xl">
            {money(todayPaid)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span><span className="text-base font-semibold text-slate-700">በዚህ ወር የተከፈለ</span></div>
          <div className="mt-4 text-2xl font-extrabold text-slate-950 tabular-nums sm:text-3xl">
            {money(monthPaid)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-800"><Users className="h-5 w-5" aria-hidden="true" /></span><span className="text-base font-semibold text-slate-700">የዚህ ወር ክፍያዎች</span></div>
          <div className="mt-4 text-2xl font-extrabold text-blue-800 tabular-nums sm:text-3xl">
            {paidRecords.filter((r) => String(r.period_start).startsWith(month)).length}
          </div>
        </div>
      </div>

      {/* Main Grid: Form + History */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.5fr)] xl:gap-7">
        {/* Form */}
        <div>
          <PayrollForm systemDate={date} />
        </div>

        {/* History Table */}
        <div>
          <PayrollHistory records={records ?? []} />
        </div>
      </div>
    </div>
  );
}
