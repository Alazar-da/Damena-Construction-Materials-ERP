'use client';

import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, X, AlertTriangle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { formatEthiopicDateTime } from '@/lib/ethiopian-calendar';

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

function getMovementBadge(m: Movement) {
  const r = m.reason || '';
  if (m.movement_type === 'receipt') {
    if (r.includes('ጉድለት')) {
      return {
        label: 'በጉድለት ገቢ',
        cls: 'bg-rose-50 text-rose-700 border border-rose-200',
        isShortage: true,
        isFollowUp: false,
      };
    }
    if (r.includes('ተጨማሪ ቆጠራ')) {
      return {
        label: 'የቀረ ሲሚንቶ ገቢ',
        cls: 'bg-blue-50 text-blue-700 border border-blue-200',
        isShortage: false,
        isFollowUp: true,
      };
    }
    return {
      label: 'ገቢ (ቆጠራ)',
      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      isShortage: false,
      isFollowUp: false,
    };
  }
  if (m.movement_type === 'internal_use') {
    return {
      label: 'ለምርት ወጪ',
      cls: 'bg-amber-50 text-amber-700 border border-amber-200',
      isShortage: false,
      isFollowUp: false,
    };
  }
  if (m.movement_type === 'sale') {
    return {
      label: 'ሽያጭ',
      cls: 'bg-sky-50 text-sky-700 border border-sky-200',
      isShortage: false,
      isFollowUp: false,
    };
  }
  if (m.movement_type === 'production') {
    return {
      label: 'ምርት',
      cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      isShortage: false,
      isFollowUp: false,
    };
  }
  if (m.movement_type === 'breakage') {
    return {
      label: 'ስብራት',
      cls: 'bg-rose-50 text-rose-700 border border-rose-200',
      isShortage: false,
      isFollowUp: false,
    };
  }
  return {
    label: m.movement_type.replace('_', ' '),
    cls: 'bg-slate-100 text-slate-700 border border-slate-200',
    isShortage: false,
    isFollowUp: false,
  };
}

export default function StockActivityHistory({
  movements,
  itemNames,
}: StockActivityHistoryProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [filter, setFilter] = useState<'all' | 'receipt' | 'internal_use' | 'discrepancy'>('all');
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const filteredMovements = movements.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'receipt') return m.movement_type === 'receipt';
    if (filter === 'internal_use') return m.movement_type === 'internal_use';
    if (filter === 'discrepancy') {
      const r = m.reason || '';
      return r.includes('ጉድለት') || r.includes('ተጨማሪ ቆጠራ') || r.includes('ትርፍ');
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMovements.length / PAGE_SIZE) || 1;
  const pagedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!showHistory) {
    return (
      <div className="flex justify-center pt-2 pb-6">
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>የእንቅስቃሴ ታሪክ አሳይ ({movements.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="erp-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">የእንቅስቃሴ ታሪክ</h2>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredMovements.length} መዝገቦች)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="sm:hidden text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-100 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>ዝጋ</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            {[
              { id: 'all', label: 'ሁሉም' },
              { id: 'receipt', label: 'ገቢ (ቆጠራ)' },
              { id: 'internal_use', label: 'ለምርት ወጪ' },
              { id: 'discrepancy', label: 'ጉድለት / ተጨማሪ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id as typeof filter);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="hidden sm:flex text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>ዝጋ</span>
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-slate-100">
        {pagedMovements.map((m) => {
          const delta = Number(m.quantity_delta);
          const isNegative = delta < 0;
          const itemName = itemNames[m.product_id] ?? 'እቃ';
          const badge = getMovementBadge(m);

          return (
            <div
              key={m.id}
              className={`p-3.5 space-y-1.5 ${
                badge.isShortage ? 'bg-rose-50/40' : badge.isFollowUp ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs text-slate-900 truncate">{itemName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <span className={`font-mono font-black text-sm shrink-0 ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNegative ? '' : '+'}
                  {delta}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed flex items-start gap-1.5">
                {badge.isShortage && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                {badge.isFollowUp && <PlusCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                <span>{localizeReason(m.reason)}</span>
              </p>

              <p className="text-[10px] font-mono text-slate-400">
                {formatEthiopicDateTime(m.created_at)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">ቀን / ሰዓት</th>
              <th className="py-2.5 px-4">እቃ</th>
              <th className="py-2.5 px-4">ዓይነት</th>
              <th className="py-2.5 px-4">ብዛት</th>
              <th className="py-2.5 px-4">ምክንያት / ዝርዝር</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedMovements.map((m) => {
              const delta = Number(m.quantity_delta);
              const isNegative = delta < 0;
              const itemName = itemNames[m.product_id] ?? 'እቃ';
              const badge = getMovementBadge(m);

              return (
                <tr
                  key={m.id}
                  className={
                    badge.isShortage
                      ? 'bg-rose-50/40 hover:bg-rose-50/70'
                      : badge.isFollowUp
                      ? 'bg-blue-50/30 hover:bg-blue-50/60'
                      : 'hover:bg-slate-50/50'
                  }
                >
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono whitespace-nowrap">
                    {formatEthiopicDateTime(m.created_at)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {itemName}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                    <span className={isNegative ? 'text-rose-600' : 'text-emerald-600'}>
                      {isNegative ? '' : '+'}
                      {delta}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-xs">
                    <div className="flex items-start gap-1.5">
                      {badge.isShortage && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      {badge.isFollowUp && (
                        <PlusCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      {!badge.isShortage && !badge.isFollowUp && m.movement_type === 'receipt' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <span>{localizeReason(m.reason)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredMovements.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400">
          ምንም እንቅስቃሴ አልተመዘገበም።
        </div>
      )}

      {/* Pagination Controls (8 items at a time) */}
      {filteredMovements.length > PAGE_SIZE && (
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
