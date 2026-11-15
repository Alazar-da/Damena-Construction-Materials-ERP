'use client';

import React, { useState } from 'react';
import { createPayroll } from './actions';
import { Plus } from 'lucide-react';

export default function PayrollForm({ systemDate }: { systemDate: string }) {
  const [workerName, setWorkerName] = useState('');
  const [payType, setPayType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form action={createPayroll} className="erp-card p-5 border-t-2 border-t-sky-500 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">ክፍያ መዝግብ</h2>
        <span className="text-xs text-slate-400 font-mono">Date: {systemDate}</span>
      </div>

      {/* Hidden system-generated date & default payment method */}
      <input type="hidden" name="period_start" value={systemDate} />
      <input type="hidden" name="payment_method" value="cash" />

      {/* Worker Name */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          የሰራተኛ ስም
        </label>
        <input
          className="erp-input text-sm"
          name="worker_name"
          required
          maxLength={120}
          value={workerName}
          onChange={(e) => setWorkerName(e.target.value)}
          placeholder="ለምሳሌ፦ አበበ ከበደ"
        />
      </div>

      {/* Pay Period */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          የክፍያ ጊዜ
        </label>
        <input type="hidden" name="pay_type" value={payType} />
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'daily', label: 'ቀን' },
              { id: 'weekly', label: 'ሳምንት' },
              { id: 'monthly', label: 'ወር' },
            ] as const
          ).map((item) => {
            const isSelected = payType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPayType(item.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          መጠን (ብር)
        </label>
        <input
          className="erp-input font-mono text-base font-bold"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Optional Note */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          ማስታወሻ (አማራጭ)
        </label>
        <input
          className="erp-input text-xs"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ለምሳሌ፦ ትርፍ ሰዓት ወይም የስራ ዝርዝር"
        />
      </div>

      <button
        type="submit"
        className="erp-btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>ክፍያውን መዝግብ</span>
      </button>
    </form>
  );
}
