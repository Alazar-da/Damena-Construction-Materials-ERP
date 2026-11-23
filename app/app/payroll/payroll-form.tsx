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
    <form action={createPayroll} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-slate-200 pb-5">
        <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><Plus className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-xl font-bold text-slate-950">አዲስ ክፍያ ይመዝግቡ</h2>
        <p className="mt-1 text-sm text-slate-600">የሰራተኛ ስም፣ የክፍያ ጊዜ እና መጠን ያስገቡ</p>
      </div>

      {/* Hidden system-generated date & default payment method */}
      <input type="hidden" name="period_start" value={systemDate} />
      <input type="hidden" name="payment_method" value="cash" />

      {/* Worker Name */}
      <div>
        <label className="text-sm font-bold text-slate-800 block mb-2">
          የሰራተኛ ስም
        </label>
        <input
          className="erp-input text-base"
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
        <label className="text-sm font-bold text-slate-800 block mb-2">
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
                aria-pressed={isSelected}
                className={`min-h-12 rounded-xl border px-3 text-sm font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-800 bg-blue-800 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
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
        <label className="text-sm font-bold text-slate-800 block mb-2">
          መጠን (ብር)
        </label>
        <input
          className="erp-input font-mono text-lg font-bold"
          name="amount"
          type="number"
          min="1"
          step="any"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onWheel={(e) => {
            e.currentTarget.blur();
            e.preventDefault();
          }}
        />
      </div>

      {/* Optional Note */}
      <div>
        <label className="text-sm font-bold text-slate-800 block mb-2">
          ማስታወሻ (አማራጭ)
        </label>
        <input
          className="erp-input text-base"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ለምሳሌ፦ ትርፍ ሰዓት ወይም የስራ ዝርዝር"
        />
      </div>

      <button
        type="submit"
        className="erp-btn-primary min-h-14 w-full rounded-2xl text-base font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>ክፍያውን መዝግብ</span>
      </button>
    </form>
  );
}
