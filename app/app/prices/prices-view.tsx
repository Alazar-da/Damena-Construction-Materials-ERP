'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  Check,
  X,
  Edit2,
} from 'lucide-react';
import { updateProductPrice, updateProductThreshold } from './actions';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  selling_price: number | null;
  stock_on_hand: number;
  low_stock_threshold: number;
  is_active: boolean;
}

const money = (val: number) =>
  `ETB ${Number(val || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export default function PricesView({ initialProducts }: { initialProducts: Product[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Cement is a raw material consumed in production and not sold, so it does not have a selling price.
  const sellableProducts = useMemo(
    () =>
      initialProducts.filter(
        (p) =>
          p.category !== 'cement' &&
          !p.name.toLowerCase().includes('cement') &&
          !p.name.includes('ሲሚንቶ')
      ),
    [initialProducts]
  );

  const filtered = sellableProducts;

  const totalYardValuation = useMemo(
    () =>
      sellableProducts.reduce(
        (sum, p) => sum + Number(p.stock_on_hand) * Number(p.selling_price || 0),
        0
      ),
    [sellableProducts]
  );

  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(String(product.selling_price ?? ''));
    setEditThreshold(String(product.low_stock_threshold ?? ''));
  };

  const handleSave = (productId: string) => {
    startTransition(async () => {
      const priceNum = Number(editPrice);
      const threshNum = Number(editThreshold);

      if (!isNaN(priceNum) && priceNum >= 0) {
        const fdPrice = new FormData();
        fdPrice.append('product_id', productId);
        fdPrice.append('selling_price', String(priceNum));
        await updateProductPrice(fdPrice);
      }

      if (!isNaN(threshNum) && threshNum >= 0) {
        const fdThresh = new FormData();
        fdThresh.append('product_id', productId);
        fdThresh.append('low_stock_threshold', String(threshNum));
        await updateProductThreshold(fdThresh);
      }

      setEditingId(null);
    });
  };

  const adjustPrice = (delta: number) => {
    const current = Number(editPrice) || 0;
    const next = Math.max(0, current + delta);
    setEditPrice(String(next));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            የምርት መሸጫ ዋጋዎች
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5">
            {initialProducts.length} እቃዎች በካታሎግ ውስጥ
          </p>
        </div>

        <div className="erp-card px-3.5 py-2.5 flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-slate-500 font-semibold">ጠቅላላ የክምችት ዋጋ፦</span>
          <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
            {money(totalYardValuation)}
          </span>
        </div>
      </div>

      {/* =====================================================================
          MOBILE CARD VIEW (block sm:hidden)
      ===================================================================== */}
      <div className="space-y-3 sm:hidden">
        {filtered.map((p) => {
          const isEditing = editingId === p.id;
          const stockVal = Number(p.stock_on_hand) * Number(p.selling_price || 0);
          const isLow = Number(p.stock_on_hand) <= Number(p.low_stock_threshold);

          return (
            <div key={p.id} className="erp-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{p.name}</h2>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    {p.category} · በ{p.unit}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                    {Number(p.stock_on_hand).toLocaleString()} {p.unit}
                  </span>
                  {isLow && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      ክምችት አናሳ ነው!
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">የሽያጭ ዋጋ</span>
                  <span className="font-bold text-slate-900 text-base">
                    {p.selling_price ? money(p.selling_price) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">የንብረት ዋጋ</span>
                  <span className="font-semibold text-slate-700 text-base">
                    {money(stockVal)}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-600 font-semibold">
                        የአንዱ ዋጋ (ብር)
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => adjustPrice(1)}
                          className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustPrice(5)}
                          className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustPrice(-5)}
                          className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          -5
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="erp-input py-2 px-3 text-sm font-mono font-bold w-full"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      የማስጠንቀቂያ ዝቅተኛ መጠን ({p.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="erp-input py-2 px-3 text-sm font-mono font-bold w-full"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSave(p.id)}
                      disabled={isPending}
                      className="erp-btn-primary flex-1 py-2 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ለውጦችን አስቀምጥ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="erp-btn-secondary py-2 px-3 text-xs cursor-pointer"
                    >
                      ሰርዝ
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartEdit(p)}
                  className="erp-btn-secondary w-full py-2 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>ዋጋውን / መጠኑን አዘምን</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          DESKTOP TABLE VIEW (hidden sm:block)
      ===================================================================== */}
      <div className="hidden sm:block erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">ምርት</th>
                <th className="py-2.5 px-4">ያለ ክምችት</th>
                <th className="py-2.5 px-4">የአንዱ ዋጋ</th>
                <th className="py-2.5 px-4">የማስጠንቀቂያ መጠን</th>
                <th className="py-2.5 px-4">የንብረት ዋጋ</th>
                <th className="py-2.5 px-4 text-right">ድርጊት</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isEditing = editingId === p.id;
                const stockVal = Number(p.stock_on_hand) * Number(p.selling_price || 0);
                const isLow = Number(p.stock_on_hand) <= Number(p.low_stock_threshold);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <span>{Number(p.stock_on_hand).toLocaleString()} {p.unit}</span>
                      {isLow && (
                        <span className="ml-2 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          አናሳ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="erp-input py-1 px-2 text-xs font-mono w-24"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span>{p.selling_price ? money(p.selling_price) : '—'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="erp-input py-1 px-2 text-xs font-mono w-20"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                        />
                      ) : (
                        <span>{Number(p.low_stock_threshold || 0).toLocaleString()} {p.unit}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {money(stockVal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSave(p.id)}
                            disabled={isPending}
                            className="erp-btn-primary py-1 px-2.5 text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>አስቀምጥ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="erp-btn-secondary py-1 px-2 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="erp-btn-secondary py-1 px-2.5 text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>አርትዕ</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
