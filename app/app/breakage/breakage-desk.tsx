'use client';

import React, { useState, useRef, useEffect, useActionState } from 'react';
import Image from 'next/image';
import {
  PackageMinus,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { recordBreakage, type BreakageState } from './actions';

export interface BreakageProduct {
  id: string;
  name: string;
  unit: string;
  stock_on_hand: number;
  selling_price?: number | null;
  category: string;
}

export interface BreakageMovement {
  id: string;
  product_id: string;
  quantity_delta: number;
  movement_type: string;
  reason: string;
  created_at: string;
  products?: {
    name: string;
    unit: string;
    selling_price?: number | null;
  } | {
    name: string;
    unit: string;
    selling_price?: number | null;
  }[] | null;
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

const PRESET_REASONS = [
  'በትራንስፖርት ወቅት የተሰበረ',
  'በመጫን / በማውረድ ወቅት',
  'በመጋዘን አያያዝ ወቅት',
  'ከደንበኛ የተመለሰ ስብርባሪ',
];

const STEP_PRESETS = [1, 5, 10, 25, 50, 100];

export default function BreakageDesk({
  products,
  records,
}: {
  products: BreakageProduct[];
  records: BreakageMovement[];
}) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('10');
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const quantityInputRef = useRef<HTMLInputElement>(null);

  const [, formAction, isPending] = useActionState<BreakageState, FormData>(
    async (prev, formData) => {
      const res = await recordBreakage(prev, formData);
      if (res.success) {
        setNotification({
          type: 'success',
          message: 'ስብርባሪው በተሳካ ሁኔታ ተመዝግቧል።',
        });
        setQuantity('10');
        setCustomNote('');
      } else if (res.error) {
        setNotification({ type: 'error', message: res.error });
      }
      return res;
    },
    {}
  );

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Prevent mouse wheel from unintentionally changing the number
  useEffect(() => {
    const el = quantityInputRef.current;
    if (!el) return;
    const preventWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', preventWheel, { passive: false });
    return () => el.removeEventListener('wheel', preventWheel);
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedId) || products[0];
  const currentStock = Number(selectedProduct?.stock_on_hand || 0);
  const enteredQty = Number(quantity) || 0;
  const remainingStock = Math.max(0, currentStock - enteredQty);

  const stepQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  // Quick statistics
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
  const thisMonthPrefix = today.substring(0, 7);

  const todayBrokenCount = records
    .filter((r) => r.created_at.startsWith(today))
    .reduce((acc, r) => acc + Math.abs(Number(r.quantity_delta)), 0);

  const monthBrokenCount = records
    .filter((r) => r.created_at.startsWith(thisMonthPrefix))
    .reduce((acc, r) => acc + Math.abs(Number(r.quantity_delta)), 0);

  // Pagination
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pagedRecords = records.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const relation = (value: BreakageMovement['products']) =>
    Array.isArray(value) ? value[0] : value;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የስብርባሪ እና ብክነት ምዝገባ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
            የተሰበሩ እቃዎች ምዝገባ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            በትራንስፖርት ወይም በሽያጭ ወቅት የተሰበሩ ብሎኮች እና ቴራሶን ይመዝግቡ
          </p>
        </div>

        {/* Quick stat chips */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80">
            <span className="text-[10px] text-amber-800 font-semibold block">የዛሬ ስብርባሪ</span>
            <span className="text-sm font-black font-mono text-amber-900">
              {todayBrokenCount.toLocaleString()} ፍሬ
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block">የዚህ ወር ስብርባሪ</span>
            <span className="text-sm font-black font-mono text-slate-800">
              {monthBrokenCount.toLocaleString()} ፍሬ
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Main Entry Card */}
      <form
        action={formAction}
        className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs"
      >
        <input type="hidden" name="product_id" value={selectedId} />
        <input
          type="hidden"
          name="reason"
          value={customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason}
        />

        {/* 1. Visual Product Photo Selector (4 across on tablet & desktop, 2x2 on mobile) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-slate-800">
              1. የተሰበረውን የምርት ዓይነት ይምረጡ
            </label>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              አሁን በክምችት ያለው፦ <span className="text-slate-900">{currentStock.toLocaleString()} ፍሬ</span>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {products.map((product) => {
              const isSelected = product.id === selectedId;
              const stock = Number(product.stock_on_hand || 0);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="w-full h-24 sm:h-28 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5">
                    <Image
                      src={imageFor(product.name)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain p-2 hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Name and Stock */}
                  <div>
                    <span className="block font-black text-xs sm:text-sm text-slate-900 leading-tight">
                      {displayProductName(product.name)}
                    </span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        stock <= 0
                          ? 'bg-rose-100 text-rose-800'
                          : stock < 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {stock.toLocaleString()} ፍሬ በክምችት
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Broken Quantity Entry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              2. የተሰበረው ብዛት
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              ከስብርባሪ በኋላ የሚቀረው፦{' '}
              <span
                className={`font-bold ${
                  remainingStock === 0 && enteredQty > 0
                    ? 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {remainingStock.toLocaleString()} ፍሬ
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepQuantity(-5)}
              className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer shrink-0"
              title="-5 ፍሬ"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              ref={quantityInputRef}
              type="number"
              name="quantity"
              min="1"
              max={currentStock || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-center text-xl sm:text-2xl font-black font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-amber-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              required
            />

            <button
              type="button"
              onClick={() => stepQuantity(5)}
              className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer shrink-0"
              title="+5 ፍሬ"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">ፈጣን ምረጡ፦</span>
            {STEP_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuantity(String(p))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  quantity === String(p)
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +{p}
              </button>
            ))}
          </div>

          {enteredQty > currentStock && currentStock > 0 && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>የተሰበረው ብዛት በመጋዘን ካለው ክምችት ({currentStock.toLocaleString()} ፍሬ) ሊበልጥ አይችልም።</span>
            </p>
          )}
        </div>

        {/* 3. Reason for Damage */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            3. የስብራት ወይም የብልሽት ምክንያት
          </label>

          {/* Preset reason tags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* Optional detail note */}
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="ተጨማሪ ማስታወሻ ካለ (የመኪና ታርጋ፣ ሹፌር፣ ቦታ...)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        {/* 4. Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || enteredQty <= 0 || (currentStock > 0 && enteredQty > currentStock)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <PackageMinus className="w-4 h-4" />
            <span>
              {isPending
                ? 'በመመዝገብ ላይ...'
                : `ስብርባሪ መዝግብ (${enteredQty} ፍሬ)`}
            </span>
          </button>
        </div>
      </form>

      {/* Breakage History List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              የቅርብ ጊዜ የተሰበሩ እቃዎች ታሪክ ({records.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            ገጽ {historyPage} ከ {totalPages}
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="space-y-2.5 sm:hidden">
          {pagedRecords.map((item) => {
            const product = relation(item.products);
            const dateStr = new Date(item.created_at).toLocaleDateString('en-KE', {
              timeZone: 'Africa/Nairobi',
            });
            const timeStr = new Date(item.created_at).toLocaleTimeString('en-KE', {
              timeZone: 'Africa/Nairobi',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                      <Image
                        src={imageFor(product?.name || '')}
                        alt={product?.name || ''}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-900">
                      {displayProductName(product?.name || 'ምርት')}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black font-mono">
                    {item.quantity_delta} ፍሬ
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[200px]">{item.reason}</span>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {dateStr} {timeStr}
                  </span>
                </div>
              </div>
            );
          })}

          {records.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              ምንም የተመዘገበ ስብርባሪ የለም።
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ቀንና ሰዓት</th>
                <th className="py-3 px-4">ምርት</th>
                <th className="py-3 px-4 text-center">የተሰበረው ብዛት</th>
                <th className="py-3 px-4">ምክንያት / ማስታወሻ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {pagedRecords.map((item) => {
                const product = relation(item.products);
                const dateStr = new Date(item.created_at).toLocaleDateString('en-KE', {
                  timeZone: 'Africa/Nairobi',
                });
                const timeStr = new Date(item.created_at).toLocaleTimeString('en-KE', {
                  timeZone: 'Africa/Nairobi',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {dateStr} · {timeStr}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                          <Image
                            src={imageFor(product?.name || '')}
                            alt={product?.name || ''}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <span className="font-bold text-slate-900">
                          {displayProductName(product?.name || 'ምርት')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs">
                        {item.quantity_delta} {product?.unit || 'ፍሬ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {item.reason}
                    </td>
                  </tr>
                );
              })}

              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    ምንም የተመዘገበ ስብርባሪ የለም።
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <button
              type="button"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ቀዳሚ</span>
            </button>
            <span className="text-xs font-semibold font-mono text-slate-700 px-2">
              ገጽ {historyPage} ከ {totalPages}
            </span>
            <button
              type="button"
              disabled={historyPage >= totalPages}
              onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>ቀጣይ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
