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
    <form action={saveProduction} className="erp-card p-5 border-t-2 border-t-sky-500 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">ምርት መዝግብ</h2>
        <p className="text-xs text-slate-500">የተጠናቀቁ ብሎኮችን ወይም ቴራሶን ወደ መጋዘን ጨምር</p>
      </div>

      {/* Visual Product Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Product
        </label>
        <input type="hidden" name="output" value={selectedId} required />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {products.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-400'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center mb-1">
                  <Image
                    src={imageFor(p.name)}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="max-h-10 max-w-full object-contain"
                  />
                </div>
                <div className="font-bold text-xs text-slate-900">{p.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Quantity ({selectedProduct?.unit || 'pcs'})
          </label>
          <div className="flex items-center gap-1">
            {[50, 100, 200, 500].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity(String(num))}
                className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 rounded hover:bg-sky-100"
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
        <label className="text-xs font-semibold text-slate-700 block mb-1">ማስታወሻ</label>
        <input
          className="erp-input text-xs"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ለምሳሌ፦ የጠዋት ፈረቃ"
        />
      </div>

      <button
        type="submit"
        className="erp-btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>ምርቱን መዝግብ</span>
      </button>
    </form>
  );
}
