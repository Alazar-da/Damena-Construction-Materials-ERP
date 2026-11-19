'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { receive, issue } from './actions';
import { Plus, ArrowRight } from 'lucide-react';

export default function StockActionsPanel({ cementOnHand }: { cementOnHand: number }) {
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveReason, setReceiveReason] = useState('Supplier delivery');
  const [issueQty, setIssueQty] = useState('');
  const [issueReason, setIssueReason] = useState('Used for 10/10 Block');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Receive Cement */}
      <div className="erp-card p-5 border-t-2 border-t-emerald-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1.5 shrink-0">
            <Image
              src="/products/cement-50kg.png"
              alt="Cement"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">ሲሚንቶ ተቀበል</h3>
            <p className="text-xs text-slate-500">ወደ መጋዘን ከረጢቶችን ጨምር</p>
          </div>
        </div>

        <form action={receive} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">ብዛት (ከረጢት)</label>
              <div className="flex items-center gap-1">
                {[50, 100, 200, 500].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReceiveQty(String(num))}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="erp-input font-mono font-bold"
              name="quantity"
              type="number"
              min="0.001"
              step="0.001"
              required
              placeholder="0"
              value={receiveQty}
              onChange={(e) => setReceiveQty(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">ምክንያት</label>
            <input
              className="erp-input text-xs"
              name="reason"
              value={receiveReason}
              onChange={(e) => setReceiveReason(e.target.value)}
              placeholder="ለምሳሌ፦ ከአቅራቢ የደረሰ"
            />
          </div>

          <button
            type="submit"
            className="erp-btn-emerald w-full py-2.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ሲሚንቶ ተቀበል</span>
          </button>
        </form>
      </div>

      {/* Issue Cement */}
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
            <p className="text-xs text-slate-500">Current balance: {cementOnHand} bags</p>
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
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 rounded hover:bg-rose-100"
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
              min="0.001"
              step="0.001"
              required
              placeholder="0"
              value={issueQty}
              onChange={(e) => setIssueQty(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 block mb-2" htmlFor="cement-use-purpose">ሲሚንቶው ለምን ይወጣል?</label>
            <select
              id="cement-use-purpose"
              className="erp-input text-base font-semibold"
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
