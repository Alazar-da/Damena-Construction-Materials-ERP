'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { saveProduction } from './actions';
import { Plus } from 'lucide-react';

interface OutputProduct {
  id: string;
  name: string;
  unit: string;
}

const imageFor = (name: string) =>
  name === '10/10 Block'
    ? '/products/block-10-10.png'
    : name === '15/15 Block'
    ? '/products/block-15-15.png'
    : name === '20/20 Block'
    ? '/products/block-20-20.png'
    : '/products/terrace.png';

export default function ProductionForm({ products }: { products: OutputProduct[] }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('Morning shift');

  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <form action={saveProduction} className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-950">ምርት መዝግብ</h2>
        <p className="mt-1 text-base text-slate-600">የተጠናቀቁ ብሎኮችን ወይም ቴራሶን ወደ መጋዘን ጨምር</p>
      </div>

      {/* Visual Product Selector */}
      <div>
        <label className="text-base font-bold text-slate-900 block mb-3">
          የምርት ዓይነት ይምረጡ
        </label>
        <input type="hidden" name="output" value={selectedId} required />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {products.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(p.id)}
                className={`min-h-[160px] rounded-2xl border p-4 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-white p-2">
                  <Image
                    src={imageFor(p.name)}
                    alt={p.name}
                    width={72}
                    height={64}
                    className="max-h-14 max-w-full object-contain"
                  />
                </div>
                <div className="text-base font-bold text-slate-950">{p.name.replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ').replace(/Terrace/i, 'ቴራሶ')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-base font-bold text-slate-900">
            የተመረተ ብዛት ({selectedProduct?.unit === 'piece' ? 'ክፍል' : selectedProduct?.unit || 'ክፍል'})
          </label>
          <div className="flex items-center gap-1">
            {[50, 100, 200, 500].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity(String(num))}
                className="min-w-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-blue-900 hover:bg-blue-50"
              >
                +{num}
              </button>
            ))}
          </div>
        </div>
        <input
          className="erp-input font-mono font-bold"
          name="output_quantity"
          type="number"
          min="0.001"
          step="0.001"
          required
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-base font-bold text-slate-900 block mb-2">ማስታወሻ (አማራጭ)</label>
        <input
          className="erp-input"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ለምሳሌ፦ የጠዋት ፈረቃ"
        />
      </div>

      <button
        type="submit"
        className="erp-btn-primary min-h-14 w-full rounded-2xl text-lg font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>ምርቱን መዝግብ</span>
      </button>
    </form>
  );
}
