'use client';

import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatEthiopicDate } from '@/lib/ethiopian-calendar';

export type PayrollHistoryRecord = {
  id: string;
  worker_name: string | null;
  pay_type: string;
  period_start: string;
  period_end?: string | null;
  quantity?: number | null;
  rate_snapshot?: number | null;
  amount: number;
  status: string;
  notes?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

const money = (value: number) =>
  `${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })} ብር`;

const PAGE_SIZE = 8;

export default function PayrollHistory({
  records,
}: {
  records: PayrollHistoryRecord[];
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pagedRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!showHistory) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">የክፍያ ታሪክ</h3>
          <p className="text-xs text-slate-500 mt-0.5">የተመዘገቡ የሰራተኞች ክፍያዎች ({records.length} ክፍያዎች)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="mt-1 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-600" />
          <span>የክፍያ ታሪክ አሳይ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
            <History className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950 sm:text-xl">የክፍያ ታሪክ</h2>
            <p className="mt-0.5 text-sm text-slate-600">የቅርብ ጊዜ የተመዘገቡ ክፍያዎች</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700">
            {records.length} ክፍያ
          </span>
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>ዝጋ</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
            <tr>
              <th className="px-4 py-3">ሰራተኛ</th>
              <th className="px-4 py-3">የክፍያ ጊዜ</th>
              <th className="px-4 py-3">መጠን</th>
              <th className="px-4 py-3">ቀን</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedRecords.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-blue-50/50">
                <td className="px-4 py-4 font-semibold text-slate-950">
                  {r.worker_name ?? 'ሰራተኛ'}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {r.pay_type === 'daily'
                    ? 'የቀን'
                    : r.pay_type === 'weekly'
                    ? 'የሳምንት'
                    : 'የወር'}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-bold tabular-nums text-slate-950">
                  {money(r.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {formatEthiopicDate(r.period_start, { withYearSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {records.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <History className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-semibold text-slate-800">እስካሁን ክፍያ አልተመዘገበም</p>
            <p className="mt-1 text-sm text-slate-600">የመጀመሪያውን ክፍያ በግራ በኩል ያስገቡ</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ቀዳሚ</span>
          </button>
          <span className="text-xs font-semibold font-mono text-slate-700 px-2">
            ገጽ {page} ከ {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>ቀጣይ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
