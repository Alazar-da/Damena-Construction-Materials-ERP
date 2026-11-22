'use client';

import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Movement {
  id: string;
  product_id: string;
  quantity_delta: number | string;
  movement_type: string;
  reason: string | null;
  created_at: string;
}

interface StockActivityHistoryProps {
  movements: Movement[];
  itemNames: Record<string, string>;
}

const localizeReason = (reason: string | null) =>
  ({
    'Used for 10/10 Block': 'ለ10/10 ብሎክ ተሰጥቷል',
    'Used for 15/15 Block': 'ለ15/15 ብሎክ ተሰጥቷል',
    'Used for 20/20 Block': 'ለ20/20 ብሎክ ተሰጥቷል',
    'Used for Terrace': 'ለቴራሶ ተሰጥቷል',
    'Other production use': 'ለሌላ የምርት ስራ ተሰጥቷል',
    'Cement received': 'ሲሚንቶ ገቢ ሆኗል',
  }[reason || ''] ||
  reason ||
  '—');

export default function StockActivityHistory({
  movements,
  itemNames,
}: StockActivityHistoryProps) {
  const [showHistory, setShowHistory] = useState(false);
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(movements.length / PAGE_SIZE) || 1;
  const pagedMovements = movements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!showHistory) {
    return (
      <div className="flex justify-center pt-2 pb-6">
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>የእንቅስቃሴ ታሪክ አሳይ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="erp-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">የእንቅስቃሴ ታሪክ</h2>
          <span className="text-xs text-slate-400 font-mono">
            ({movements.length} መዝገቦች)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(false)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>ዝጋ</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">ቀን / ሰዓት</th>
              <th className="py-2.5 px-4">እቃ</th>
              <th className="py-2.5 px-4">ዓይነት</th>
              <th className="py-2.5 px-4">ብዛት</th>
              <th className="py-2.5 px-4">ምክንያት</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedMovements.map((m) => {
              const delta = Number(m.quantity_delta);
              const isNegative = delta < 0;
              const itemName = itemNames[m.product_id] ?? 'እቃ';

              return (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                    {new Date(m.created_at).toLocaleString('en-KE', {
                      timeZone: 'Africa/Nairobi',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {itemName}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.movement_type === 'receipt'
                          ? 'bg-emerald-50 text-emerald-700'
                          : m.movement_type === 'internal_use'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {m.movement_type === 'receipt'
                        ? 'ገቢ'
                        : m.movement_type === 'internal_use'
                        ? 'ወጪ'
                        : m.movement_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={isNegative ? 'text-rose-600' : 'text-emerald-600'}>
                      {isNegative ? '' : '+'}
                      {delta}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{localizeReason(m.reason)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {movements.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            ምንም እንቅስቃሴ አልተመዘገበም።
          </div>
        )}
      </div>

      {/* Pagination Controls (8 items at a time) */}
      {movements.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 p-3.5 border-t border-slate-100 text-xs bg-slate-50/40">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>ቀዳሚ</span>
          </button>
          <div className="px-3 py-1 text-slate-700 font-mono font-bold text-xs bg-white rounded-lg border border-slate-200 shadow-2xs">
            ገጽ {page} ከ {totalPages}
          </div>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>ቀጣይ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
