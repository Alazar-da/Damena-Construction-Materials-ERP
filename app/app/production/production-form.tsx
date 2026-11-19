'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { saveProduction } from './actions';
import { Plus, Check, Minus } from 'lucide-react';

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

const displayProductName = (name: string) =>
  name.replace(/(\d+\s*\/\s*\d+)\s*Block/i, '$1 ብሎክ').replace(/Terrace/i, 'ቴራሶ');

export default function ProductionForm({ products }: { products: OutputProduct[] }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('500');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedId);

  const stepQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  return (
    <form action={saveProduction} className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">አዲስ ባች መዝግብ</h2>
          <p className="text-[11px] text-slate-500">የተመረተውን ዓይነት እና ብዛት ያስገቡ</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
          Batch Entry
        </span>
      </div>

      {/* 1. Visual Product Photo Selector */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-2">
          1. የምርት ዓይነት ይምረጡ (Select Product)
        </label>
        <input type="hidden" name="output" value={selectedId} required />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {products.map((p) => {
            const isSelected = p.id === selectedId;
            const productName = displayProductName(p.name);

            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(p.id)}
                className={`group rounded-xl border p-2 flex flex-col items-center text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-2 border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/15'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>የተመረጠ</span>
                  </span>
                )}

                <div className="w-full h-18 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                  <Image
                    src={imageFor(p.name)}
                    alt={p.name}
                    width={80}
                    height={70}
                    className="max-h-16 w-auto object-contain drop-shadow-md"
                  />
                </div>

                <div className={`mt-1 w-full pt-1.5 border-t text-center ${isSelected ? 'border-emerald-100' : 'border-slate-100'}`}>
                  <span className={`font-bold text-xs truncate block ${isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-900'}`}>
                    {productName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Quantity Stepper */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-800">
            2. የተመረተ ብዛት ({selectedProduct?.unit === 'piece' ? 'ክፍሎች' : selectedProduct?.unit || 'ክፍሎች'})
          </label>
        </div>

        {/* Touch Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => stepQuantity(-50)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-extrabold text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            name="output_quantity"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onWheel={(e) => {
              e.currentTarget.blur();
              e.preventDefault();
            }}
          />
          <button
            type="button"
            onClick={() => stepQuantity(50)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Optional Empty Notes */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between mb-1">
          <span>3. ማስታወሻ (አማራጭ)</span>
          <span className="text-[9px] text-slate-400 font-normal">አስፈላጊ ከሆነ ብቻ ይሙሉ</span>
        </label>
        <input
          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ለምሳሌ፦ የፈረቃ ወይም የምርት ሁኔታ... (አማራጭ)"
        />
      </div>

      {/* 4. Primary Submit Button */}
      <button
        type="submit"
        className="w-full h-11 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md cursor-pointer"
      >
        <Plus className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
        <span>ምርቱን ወደ መጋዘን መዝግብ</span>
      </button>
    </form>
  );
}
