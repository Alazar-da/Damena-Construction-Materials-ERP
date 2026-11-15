import { db } from '@/lib/supabase/server';
import PayrollForm from './payroll-form';
import { History } from 'lucide-react';

const money = (value: number) =>
  `ETB ${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payroll
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{formatDisplayDate()}</p>
        </div>

        <div className="bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl text-xs">
          <span className="text-slate-600">የዛሬ ድምር፦ </span>
          <strong className="text-slate-900 font-mono font-bold text-sm">
            {money(todayPaid)}
          </strong>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="erp-card p-4">
          <span className="text-xs font-semibold text-slate-500">ዛሬ የተከፈለ</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {money(todayPaid)}
          </div>
        </div>

        <div className="erp-card p-4">
          <span className="text-xs font-semibold text-slate-500">በዚህ ወር የተከፈለ</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {money(monthPaid)}
          </div>
        </div>

        <div className="erp-card p-4">
          <span className="text-xs font-semibold text-slate-500">የዚህ ወር ክፍያዎች</span>
          <div className="mt-2 text-2xl font-extrabold text-sky-700 font-mono">
            {paidRecords.filter((r) => String(r.period_start).startsWith(month)).length}
          </div>
        </div>
      </div>

      {/* Main Grid: Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-5">
          <PayrollForm systemDate={date} />
        </div>

        {/* History Table */}
        <div className="lg:col-span-7">
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">የክፍያ ታሪክ</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {records?.length ?? 0} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">ሰራተኛ</th>
                    <th className="py-2.5 px-4">ጊዜ</th>
                    <th className="py-2.5 px-4">መጠን</th>
                    <th className="py-2.5 px-4">ቀን</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records?.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.worker_name ?? 'Worker'}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">
                        {r.pay_type === 'daily'
                          ? 'Day'
                          : r.pay_type === 'weekly'
                          ? 'Week'
                          : 'Month'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {money(r.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                        {r.period_start}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!records || records.length === 0) && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No wage payments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
