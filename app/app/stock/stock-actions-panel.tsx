'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { receive, issue, approveCementDelivery } from './actions';
import { Plus, ArrowRight, CheckCircle2, Truck, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { formatEthiopicDate } from '@/lib/ethiopian-calendar';

export interface PendingCementDelivery {
  id: string;
  expense_date: string;
  item_name: string;
  quantity: number;
  verified_quantity?: number | null;
  delivery_status?: string | null;
  notes: string | null;
  recorded_by_name: string;
  created_at: string;
}

export default function StockActionsPanel({
  cementOnHand,
  pendingDeliveries = [],
}: {
  cementOnHand: number;
  pendingDeliveries?: PendingCementDelivery[];
}) {
  // Manual emergency receive form state
  const [showManualReceive, setShowManualReceive] = useState(false);
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveReason, setReceiveReason] = useState('ልዩ ገቢ');

  // Issue Cement Form state
  const [issueQty, setIssueQty] = useState('');
  const [issueReason, setIssueReason] = useState('Used for 10/10 Block');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* =========================================================================
          LEFT PANE: CEMENT PURCHASES TO COUNT & APPROVE (NO PRICE SHOWN)
      ========================================================================= */}
      <div className="erp-card p-5 border-t-2 border-t-emerald-500 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1.5 shrink-0 text-emerald-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">የተገዛ ሲሚንቶ ቆጠራ እና ማረጋገጫ</h3>
              <p className="text-xs text-slate-500">በስራ አስኪያጅ የተገዙትን ቆጥረው ወደ መጋዘን ያስገቡ</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              pendingDeliveries.length > 0
                ? 'bg-amber-100 text-amber-800 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {pendingDeliveries.length > 0
              ? `${pendingDeliveries.length} ቆጠራ የሚጠብቁ`
              : 'ሁሉም ተረጋግጧል ✓'}
          </span>
        </div>

        {/* Pending Purchases List */}
        {pendingDeliveries.length > 0 ? (
          <div className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              በአሁኑ ወቅት ማረጋገጫ የሚጠብቅ አዲስ የሲሚንቶ ግዢ የለም
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              ስራ አስኪያጁ በወጪ ገጽ ላይ ሲሚንቶ ሲገዛ፣ እዚህ ገጽ ላይ ወዲያውኑ ቆጥረው ወደ መጋዘን ክምችት የሚያስገቡበት ዝርዝር ይመጣል።
            </p>
          </div>
        )}

        {/* Emergency Manual Cement Receipt Toggle (for unlisted/emergency receipts) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowManualReceive(!showManualReceive)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {showManualReceive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>ያልተመዘገበ ሲሚንቶ በእጅ ተቀበል (ልዩ ሁኔታ)</span>
          </button>

          {showManualReceive && (
            <form action={receive} className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">ብዛት (ከረጢት)</label>
                <div className="flex items-center gap-1">
                  {[50, 100, 200].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReceiveQty(String(num))}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="erp-input font-mono font-bold bg-white"
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                placeholder="0"
                value={receiveQty}
                onChange={(e) => setReceiveQty(e.target.value)}
              />
              <input
                className="erp-input text-xs bg-white"
                name="reason"
                value={receiveReason}
                onChange={(e) => setReceiveReason(e.target.value)}
                placeholder="ምክንያት (ለምሳሌ፦ ልዩ ገቢ)"
              />
              <button
                type="submit"
                className="erp-btn-emerald w-full py-2 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>በእጅ አስገባ</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: ISSUE CEMENT FOR PRODUCTION (OUTFLOW)
      ========================================================================= */}
      <div className="erp-card p-5 border-t-2 border-t-rose-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center p-1.5 shrink-0">
            <Image
              src="/products/cement-50kg.png"
              alt="Cement"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">ለምርት አውጣ</h3>
            <p className="text-xs text-slate-500">የአሁን የመጋዘን ቀሪ፦ <strong className="font-mono text-slate-900 font-bold">{cementOnHand.toLocaleString()}</strong> ከረጢት</p>
          </div>
        </div>

        <form action={issue} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">ብዛት (ከረጢት)</label>
              <div className="flex items-center gap-1">
                {[10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setIssueQty(String(num))}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 rounded hover:bg-rose-100 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="erp-input font-mono font-bold"
              name="quantity"
              type="number"
              min="1"
              step="1"
              required
              placeholder="0"
              value={issueQty}
              onChange={(e) => setIssueQty(e.target.value)}
              onWheel={(e) => {
                e.currentTarget.blur();
                e.preventDefault();
              }}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1" htmlFor="cement-use-purpose">
              ሲሚንቶው ለምን ምርት ይወጣል?
            </label>
            <select
              id="cement-use-purpose"
              className="erp-input text-xs font-semibold"
              name="reason"
              value={issueReason}
              onChange={(e) => setIssueReason(e.target.value)}
              required
            >
              <option value="Used for 10/10 Block">10/10 ብሎክ</option>
              <option value="Used for 15/15 Block">15/15 ብሎክ</option>
              <option value="Used for 20/20 Block">20/20 ብሎክ</option>
              <option value="Used for Terrace">ቴራሶ</option>
              <option value="Other production use">ሌላ የምርት ስራ</option>
            </select>
          </div>

          <button
            type="submit"
            className="erp-btn-amber w-full py-2.5 text-xs font-bold cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>ሲሚንቶ አውጣ</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function DeliveryCard({ delivery }: { delivery: PendingCementDelivery }) {
  const isPartialFollowUp =
    delivery.delivery_status === 'delivered' &&
    delivery.verified_quantity != null &&
    Number(delivery.verified_quantity) < Number(delivery.quantity);
  const alreadyReceived = isPartialFollowUp ? Number(delivery.verified_quantity) : 0;
  const remainingExpected = Math.max(1, Number(delivery.quantity) - alreadyReceived);

  const [countedQty, setCountedQty] = useState<number>(remainingExpected);
  const diff = (Number.isNaN(countedQty) ? 0 : countedQty) - remainingExpected;

  return (
    <div
      className={`p-3.5 rounded-2xl border space-y-3 ${
        isPartialFollowUp
          ? 'border-amber-300 bg-amber-50/40'
          : 'border-slate-200/90 bg-slate-50/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-xs text-slate-900 truncate">
              የገዛው፦ {delivery.recorded_by_name}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            ቀን፦ {formatEthiopicDate(delivery.expense_date, { withYearSuffix: true })}
            {delivery.notes && ` · ${delivery.notes}`}
          </p>
        </div>

        <div className="text-right shrink-0 space-y-1">
          {isPartialFollowUp ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-mono font-black text-xs">
              ቀሪ የሚጠበቅ፦ {remainingExpected} ከረጢት
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-mono font-black text-xs">
              የታዘዘው፦ {delivery.quantity} ከረጢት
            </span>
          )}
        </div>
      </div>

      {isPartialFollowUp && (
        <div className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-[11px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            ጠቅላላ የተገዛ፦ <strong>{delivery.quantity}</strong> · ቀደም ብሎ የገባ፦{' '}
            <strong className="text-emerald-700">{alreadyReceived}</strong>
          </span>
          <span className="font-bold text-rose-700">
            የጎደለው ({remainingExpected} ከረጢት) ሲመጣ እዚህ ይጨምሩ
          </span>
        </div>
      )}

      {/* Count & Approve Form (NOTE: ZERO PRICE INFORMATION SHOWN) */}
      <form action={approveCementDelivery} className="space-y-2 pt-2 border-t border-slate-200/80">
        <input type="hidden" name="expense_id" value={delivery.id} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              {isPartialFollowUp ? 'አሁን የደረሰው ተጨማሪ ብዛት (ከረጢት)' : 'የተቆጠረ ትክክለኛ ብዛት (ከረጢት)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              className={`erp-input font-mono font-bold text-sm bg-white ${
                diff < 0
                  ? 'border-rose-400 focus:border-rose-500 text-rose-700'
                  : diff > 0
                  ? 'border-blue-400 focus:border-blue-500 text-blue-700'
                  : ''
              }`}
              name="counted_quantity"
              type="number"
              min="1"
              step="1"
              required
              value={Number.isNaN(countedQty) ? '' : countedQty}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCountedQty(val);
              }}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">
              የቆጠራ ማስታወሻ {diff !== 0 && <span className="text-rose-600 font-bold">*ምክንያት ይግለጹ</span>}
            </label>
            <input
              className={`erp-input text-xs bg-white ${diff !== 0 ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}
              name="notes"
              placeholder={
                isPartialFollowUp
                  ? 'ምሳሌ፦ የቀረው ሲሚንቶ ዛሬ ደርሷል'
                  : diff < 0
                  ? `ምሳሌ፦ ${Math.abs(diff)} ከረጢት አልደረሰም/ተሰብሯል`
                  : 'ለምሳሌ፦ ሙሉ ደርሷል'
              }
              required={diff !== 0}
            />
          </div>
        </div>

        {/* Live discrepancy indicator */}
        {diff < 0 && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex flex-wrap items-center justify-between gap-1 animate-in fade-in">
            <span className="font-bold flex items-center gap-1">
              <span>⚠️ የ {Math.abs(diff)} ከረጢት ጉድለት ይቀራል!</span>
            </span>
            <span className="text-rose-600 font-medium text-[10px]">
              ወደ መጋዘን የሚጨመረው {countedQty} ከረጢት ብቻ ነው
            </span>
          </div>
        )}
        {diff > 0 && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex flex-wrap items-center justify-between gap-1 animate-in fade-in">
            <span className="font-bold flex items-center gap-1">
              <span>ℹ️ ከታዘዘው በ +{diff} ከረጢት ይበልጣል</span>
            </span>
            <span className="text-blue-600 font-medium text-[10px]">
              ወደ መጋዘን የሚጨመረው {countedQty} ከረጢት ነው
            </span>
          </div>
        )}

        <button
          type="submit"
          className="erp-btn-emerald w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>
            {isPartialFollowUp
              ? `+${Number.isNaN(countedQty) ? 0 : countedQty} ከረጢት ወደዚሁ መዝገብ ጨምር`
              : `${Number.isNaN(countedQty) ? 0 : countedQty} ከረጢት ቆጥሬ ተቀብያለሁ — ወደ መጋዘን አስገባ`}
          </span>
        </button>
      </form>
    </div>
  );
}
