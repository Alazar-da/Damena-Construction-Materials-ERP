'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { saveProduction } from './actions';
import { Plus, Minus, Check, History, X, ChevronLeft, ChevronRight, Factory } from 'lucide-react';

interface OutputProduct {
  id: string;
  name: string;
  unit: string;
}

export interface ProductionRunItem {
  id: string;
  production_date: string;
  output_quantity: number | string;
  output_product_id: string;
  created_at: string;
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

export default function ProductionDesk({
  products,
  runs,
}: {
  products: OutputProduct[];
  runs: ProductionRunItem[];
}) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('500');
  const [notes, setNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const PAGE_SIZE = 10;
  const [historyPage, setHistoryPage] = useState(1);
  const totalHistoryPages = Math.ceil(runs.length / PAGE_SIZE) || 1;
  const pagedRuns = runs.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Stop mouse wheel scroll from changing the number value inside the input field
  useEffect(() => {
    const el = quantityInputRef.current;
    if (!el) return;
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    el.addEventListener('wheel', preventWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', preventWheel);
    };
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedId);
  const names = new Map(products.map((x) => [x.id, x.name]));

  const stepQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Factory className="w-6 h-6 text-slate-800" />
            <span>የምርት ክፍል</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">የተጠናቀቁ ብሎኮች እና ቴራሶን ወደ መጋዘን መዝግብ</p>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ጠቅላላ የተመዘገቡ ባቾች፦ <strong className="font-mono text-slate-950 font-bold">{runs.length}</strong></span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Dual-Pane Workstation on Desktop (xl+), Single Column on Mobile */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-6 items-start">
        {/* Left Pane: Batch Entry Form (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-4">
          <form
            action={saveProduction}
            className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">አዲስ ባች መዝግብ</h2>
                <p className="text-[11px] text-slate-500">የተመረተውን ዓይነት እና ብዛት ያስገቡ</p>
              </div>
            </div>

            {/* 1. Visual Product Photo Selector (2x2 on xl desktop, 4 across on 2xl, 2 cols on mobile) */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2.5">
                1. የምርት ዓይነት ይምረጡ
              </label>
              <input type="hidden" name="output" value={selectedId} required />

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-3">
                {products.map((p) => {
                  const isSelected = p.id === selectedId;
                  const productName = displayProductName(p.name);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(p.id)}
                      className={`group rounded-2xl border p-3.5 flex flex-col items-center text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-2 border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/15'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>የተመረጠ</span>
                        </span>
                      )}

                      <div className="w-full h-20 sm:h-24 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                        <Image
                          src={imageFor(p.name)}
                          alt={p.name}
                          width={90}
                          height={80}
                          className="max-h-18 sm:max-h-20 w-auto object-contain drop-shadow-md"
                        />
                      </div>

                      <div
                        className={`mt-2 w-full pt-2 border-t text-center ${
                          isSelected ? 'border-emerald-100' : 'border-slate-100'
                        }`}
                      >
                        <span
                          className={`font-bold text-xs sm:text-sm block truncate ${
                            isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-900'
                          }`}
                        >
                          {productName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quantity & Notes in a Balanced 2-Column Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Quantity with Touch Stepper & Wheel Scroll Lock */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  2. የተመረተ ብዛት ({selectedProduct?.unit === 'piece' ? 'ክፍሎች' : selectedProduct?.unit || 'ክፍሎች'})
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepQuantity(-50)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    ref={quantityInputRef}
                    className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-extrabold text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. Optional Empty Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                  <span>3. ማስታወሻ (አማራጭ)</span>
                  <span className="text-[10px] text-slate-400 font-normal">አስፈላጊ ከሆነ ብቻ ይሙሉ</span>
                </label>
                <input
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ለምሳሌ፦ የፈረቃ ወይም የምርት ሁኔታ... (አማራጭ)"
                />
              </div>
            </div>

            {/* 4. Primary Submit Button */}
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>ምርቱን ወደ መጋዘን መዝግብ</span>
            </button>
          </form>
        </div>

        {/* Right Pane: Sticky Desktop Live History Ledger (hidden on mobile, visible on xl:col-span-5) */}
        <div className="hidden xl:block xl:col-span-5 sticky top-20">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">የምርት ታሪክ</h2>
                <span className="text-[11px] text-slate-500 font-mono font-medium">({runs.length} ባች)</span>
              </div>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                ቀጥታ እይታ
              </span>
            </div>

            {/* Batches List for Desktop */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {pagedRuns.map((r) => {
                const productName = names.get(r.output_product_id) ?? 'እቃ';
                return (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-slate-100/70 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                        <Image
                          src={imageFor(productName)}
                          alt={productName}
                          width={36}
                          height={32}
                          className="max-h-8 w-auto object-contain drop-shadow-2xs"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {displayProductName(productName)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.production_date}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 shadow-2xs">
                      +{Number(r.output_quantity).toLocaleString()} pcs
                    </div>
                  </div>
                );
              })}

              {runs.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  ምንም የተመዘገበ ታሪክ የለም።
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {runs.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ቀዳሚ</span>
                </button>
                <div className="px-2.5 py-1 text-slate-600 font-mono text-[11px] bg-slate-50 rounded-lg border border-slate-200">
                  ገጽ {historyPage} ከ {totalHistoryPages}
                </div>
                <button
                  type="button"
                  disabled={historyPage >= totalHistoryPages}
                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>ቀጣይ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* MOBILE/TABLET ONLY: Collapsible Bottom History Drawer (< xl)   */}
      {/* =============================================================== */}
      <div className="xl:hidden pt-2">
        {!showHistory ? (
          <div className="flex justify-center pt-2 pb-6">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
            >
              <History className="w-4 h-4 text-emerald-600" />
              <span>የምርት ታሪክ አሳይ</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-emerald-600/30 bg-white p-5 shadow-xs space-y-3.5 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">የምርት ታሪክ</h2>
                <span className="text-[11px] text-slate-400 font-mono">({runs.length} ባች)</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ዝጋ</span>
              </button>
            </div>

            {/* Batches List (Only 10 displayed per page with pagination controls) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pagedRuns.map((r) => {
                const productName = names.get(r.output_product_id) ?? 'እቃ';
                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0">
                        <Image
                          src={imageFor(productName)}
                          alt={productName}
                          width={36}
                          height={32}
                          className="max-h-8 w-auto object-contain drop-shadow-2xs"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {displayProductName(productName)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.production_date}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      +{Number(r.output_quantity).toLocaleString()} pcs
                    </div>
                  </div>
                );
              })}

              {runs.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  ምንም የተመዘገበ ታሪክ የለም።
                </div>
              )}
            </div>

            {/* 10-Item Pagination Controls */}
            {runs.length > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ቀዳሚ</span>
                </button>
                <div className="px-3 py-1 text-slate-700 font-mono font-bold text-xs bg-slate-50 rounded-lg border border-slate-200">
                  ገጽ {historyPage} ከ {totalHistoryPages}
                </div>
                <button
                  type="button"
                  disabled={historyPage >= totalHistoryPages}
                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>ቀጣይ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">የተጠናቀቁ ባቾች ዝርዝር</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
