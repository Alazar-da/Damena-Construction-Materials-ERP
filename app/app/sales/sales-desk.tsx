'use client';

import React, { useActionState, useState } from 'react';
import Image from 'next/image';
import { recordProductSale, recordService, type ProductSaleState } from './actions';
import { ShoppingCart, Zap, Plus, DollarSign } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit: string;
  selling_price: number | null;
  stock_on_hand: number;
  is_stock_tracked: boolean;
  category: string;
}

interface SaleLine {
  product_id: string;
  item_name_snapshot: string;
  unit_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ProductSale {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  created_at: string;
  notes: string | null;
  recorded_by: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  sale_lines?: SaleLine[];
}

interface ServicePayment {
  id: string;
  service_type: string;
  customer_name: string | null;
  amount: number;
  created_at: string;
  notes: string | null;
}

const serviceLabels: Record<string, { label: string; icon: string }> = {
  battery_charging: { label: 'ባትሪ መሙላት', icon: '⚡' },
  battery_acid: { label: 'የባትሪ አሲድ መሙላት', icon: '🧪' },
  welding: { label: 'ብየዳ', icon: '🔥' },
};

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

const formatDate = (value: string) =>
  new Date(value).toLocaleString('am-ET', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function SalesDesk({
  products,
  productSales,
  servicePayments,
}: {
  products: Product[];
  productSales: ProductSale[];
  servicePayments: ServicePayment[];
}) {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [saleState, saleAction, salePending] = useActionState<ProductSaleState, FormData>(recordProductSale, { error: '' });

  // Product Sale State
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // Service State
  const [serviceType, setServiceType] = useState<string>('battery_charging');
  const [serviceCustomer, setServiceCustomer] = useState<string>('');
  const [serviceAmount, setServiceAmount] = useState<string>('250');
  const [serviceNotes, setServiceNotes] = useState<string>('');

  const numQty = parseFloat(quantity) || 0;
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const numPrice = Number(selectedProduct?.selling_price ?? 0);
  const computedTotal = (numQty * numPrice).toFixed(2);
  const tracksStock = selectedProduct?.is_stock_tracked ?? true;
  const availableStock = Number(selectedProduct?.stock_on_hand ?? 0);
  const noStock = Boolean(selectedProduct && tracksStock && availableStock <= 0);
  const exceedsStock = Boolean(selectedProduct && tracksStock && numQty > availableStock);

  const handleProductSelect = (p: Product) => {
    setSelectedProductId(p.id);
    setQuantity('1');
  };

  return (
    <div className="space-y-8 sm:space-y-9">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            ሽያጭ እና አገልግሎቶች
          </h1>
          <p className="mt-2 text-base text-slate-600">የምርት ሽያጭ እና የአገልግሎት ክፍያዎች</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            aria-pressed={activeTab === 'products'}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            <span>የምርት ሽያጭ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            aria-pressed={activeTab === 'services'}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Zap className="h-5 w-5" aria-hidden="true" />
            <span>የወርክሾፕ አገልግሎቶች</span>
          </button>
        </div>
      </div>

      {/* Forms */}
      {activeTab === 'products' ? (
        <form
          action={saleAction}
          className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800"><ShoppingCart className="h-7 w-7" aria-hidden="true" /></span>
            <div><h2 className="text-xl font-bold text-slate-950">የምርት ሽያጭ መዝግብ</h2><p className="mt-1 text-base text-slate-600">ምርት ይምረጡ፤ ዋጋው እና ድምሩ በራስ-ሰር ይሰላሉ</p></div>
          </div>
          {saleState.error && <p role="alert" aria-live="polite" className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-base font-semibold text-rose-900">{saleState.error}</p>}

          {/* Product Cards */}
          <div>
            <label className="text-base font-bold text-slate-900 block mb-3">
              ምርት ይምረጡ
            </label>
            <input type="hidden" name="product_id" value={selectedProductId} required />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleProductSelect(p)}
                    className={`min-h-[190px] rounded-2xl border p-4 text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 flex h-20 w-24 items-center justify-center rounded-2xl bg-white p-2">
                      <Image
                        src={imageFor(p.name)}
                        alt={p.name}
                        width={88}
                        height={72}
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                    <div className="text-base font-bold text-slate-950">{displayProductName(p.name)}</div>
                    <div className="mt-1 text-sm font-medium text-slate-600">
                      {Number(p.stock_on_hand).toLocaleString('en-US')} {p.unit === 'piece' ? 'ክፍል' : p.unit}
                    </div>
                    <div className="mt-2 text-base font-bold text-blue-900">{p.selling_price == null ? 'ዋጋ አልተወሰነም' : `${Number(p.selling_price).toLocaleString('en-US')} ብር`}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qty, saved price, automatic total */}
          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3 sm:p-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-base font-bold text-slate-900">የሽያጭ ብዛት</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(String(num))}
                      disabled={tracksStock && num > availableStock}
                      className="min-w-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-blue-900 hover:bg-blue-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                max={tracksStock ? availableStock : undefined}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <p className={`mt-2 text-sm font-medium ${noStock || exceedsStock ? 'text-rose-800' : 'text-slate-600'}`}>
                {noStock ? 'ክምችት የለም። መጀመሪያ ምርት ወይም ግብዓት ይመዝግቡ።' : tracksStock ? `${availableStock.toLocaleString()} ${selectedProduct?.unit === 'piece' ? 'ክፍል' : selectedProduct?.unit ?? ''} በክምችት ይገኛል` : 'የዚህ እቃ ክምችት አይከታተልም።'}
              </p>
            </div>
            <div>
              <label className="text-base font-bold text-slate-900 block mb-2">የአንዱ ዋጋ</label>
              <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 font-mono text-base font-bold text-slate-800">{selectedProduct?.selling_price == null ? 'ዋጋ አልተወሰነም' : `${Number(selectedProduct.selling_price).toLocaleString('en-US')} ብር`}</div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-blue-900 p-4 text-white">
              <span className="text-base font-semibold text-blue-100">የሚከፈል ጠቅላላ ድምር</span>
              <div className="mt-2 text-3xl font-bold tabular-nums">
                {Number(computedTotal).toLocaleString('en-US')} <span className="text-lg">ብር</span>
              </div>
            </div>
          </div>

          {/* Customer and payment method */}
          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label className="text-base font-bold text-slate-900">የደንበኛ ስም</label>
              <input
                className="erp-input mt-2"
                name="customer_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
              />
            </div>
            <div>
              <label className="text-base font-bold text-slate-900">የክፍያ ዘዴ</label>
              <select
                className="erp-input mt-2"
                name="payment_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">ጥሬ ገንዘብ</option>
                <option value="bank">የባንክ ዝውውር</option>
                <option value="credit">በዱቤ</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-base font-bold text-slate-900 block mb-2">ማስታወሻ <span className="font-normal text-slate-600">(አማራጭ)</span></label>
            <input className="erp-input" name="notes" placeholder="ማስታወሻ ያስገቡ" />
          </div>

          <button
            type="submit"
            className="erp-btn-primary min-h-14 w-full gap-3 rounded-2xl text-lg font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedProduct || selectedProduct.selling_price == null || noStock || exceedsStock || numQty <= 0 || salePending}
          >
            <Plus className="h-5 w-5" />
            <span>{salePending ? 'በመመዝገብ ላይ…' : 'ሽያጩን አረጋግጠው ይመዝግቡ'}</span>
          </button>
        </form>
      ) : (
        <form
          action={recordService}
          className="space-y-7 rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800"><Zap className="h-7 w-7" aria-hidden="true" /></span>
            <div><h2 className="text-xl font-bold text-slate-950">የአገልግሎት ክፍያ መዝግብ</h2><p className="mt-1 text-base text-slate-600">የባትሪ እና የወርክሾፕ አገልግሎትን ይምረጡ</p></div>
          </div>

          {/* Service Picker */}
          <div>
            <label className="text-base font-bold text-slate-900 block mb-3">አገልግሎት ይምረጡ</label>
            <input type="hidden" name="service_type" value={serviceType} required />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.entries(serviceLabels).map(([key, info]) => {
                const isSelected = serviceType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setServiceType(key)}
                    className={`min-h-[104px] rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 text-2xl">{info.icon}</div>
                    <div className="text-base font-bold text-slate-950">{info.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label className="text-base font-bold text-slate-900">የደንበኛ ስም</label>
              <input
                className="erp-input mt-2"
                name="customer_name"
                value={serviceCustomer}
                onChange={(e) => setServiceCustomer(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-base font-bold text-slate-900">መጠን (ብር)</label>
                <div className="flex items-center gap-1">
                  {[100, 200, 300, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setServiceAmount(String(val))}
                  className="min-w-11 rounded-xl border border-amber-200 bg-white px-3 text-sm font-bold text-amber-900 hover:bg-amber-50 cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="erp-input font-mono font-bold text-sm"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={serviceAmount}
                onChange={(e) => setServiceAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-base font-bold text-slate-900">ማስታወሻ (አማራጭ)</label>
            <input
              className="erp-input mt-2"
              name="notes"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="አማራጭ ማስታወሻ"
            />
          </div>

          <button
            type="submit"
            className="erp-btn-amber min-h-14 w-full rounded-2xl text-lg font-bold cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>የአገልግሎት ክፍያውን መዝግብ</span>
          </button>
        </form>
      )}

      {/* Tables */}
      <div className="space-y-6">
        {/* Product Sales History */}
        <div className="erp-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ የምርት ሽያጮች</h2>
            <span className="text-base font-semibold text-slate-600">{productSales?.length ?? 0} ሽያጮች</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">እቃ</th><th className="py-2.5 px-4">ብዛት</th><th className="py-2.5 px-4">ድምር (ብር)</th><th className="py-2.5 px-4">ደንበኛ</th><th className="py-2.5 px-4">ክፍያ</th><th className="py-2.5 px-4">ቀን</th><th className="py-2.5 px-4">የመዘገበው</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productSales?.map((x) => {
                  const line = x.sale_lines?.[0];
                  return (
                    <tr key={x.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {displayProductName(line?.item_name_snapshot ?? 'ምርት')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {line?.quantity} {line?.unit_snapshot}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {Number(x.total_amount).toLocaleString('en-US')} ብር
                      </td>
                      <td className="py-3 px-4 text-slate-700">{x.customer_name || 'በቀጥታ ሽያጭ'}</td>
                      <td className="py-3 px-4 text-slate-700">{x.payment_method === 'cash' ? 'ጥሬ ገንዘብ' : x.payment_method === 'bank' ? 'የባንክ ዝውውር' : 'በዱቤ'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{x.sale_date}</td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{(Array.isArray(x.profiles) ? x.profiles[0] : x.profiles)?.display_name || 'ያልታወቀ ተጠቃሚ'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(!productSales || productSales.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">
              እስካሁን የተመዘገበ የምርት ሽያጭ የለም።
              </div>
            )}
          </div>
        </div>

        {/* Service Payments History */}
        <div className="erp-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ የአገልግሎት ክፍያዎች</h2>
            <span className="text-base font-semibold text-slate-600">{servicePayments?.length ?? 0} ክፍያዎች</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">አገልግሎት</th><th className="py-2.5 px-4">ደንበኛ</th><th className="py-2.5 px-4">መጠን (ብር)</th><th className="py-2.5 px-4">ቀን / ሰዓት</th><th className="py-2.5 px-4">ማስታወሻ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servicePayments?.map((x) => (
                  <tr key={x.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <span className="mr-1.5">{serviceLabels[x.service_type]?.icon || '⚙️'}</span>
                      {serviceLabels[x.service_type]?.label || x.service_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{x.customer_name || 'በቀጥታ የመጣ ደንበኛ'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      {Number(x.amount).toLocaleString('en-US')} ብር
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {formatDate(x.created_at)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{x.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!servicePayments || servicePayments.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">
                እስካሁን የተመዘገበ የአገልግሎት ክፍያ የለም።
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
