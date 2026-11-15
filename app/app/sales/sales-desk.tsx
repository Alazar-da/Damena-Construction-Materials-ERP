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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ሽያጭ እና አገልግሎቶች
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">የምርት ሽያጭ እና የአገልግሎት ክፍያዎች</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
            <span>የምርት ሽያጭ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>የወርክሾፕ አገልግሎቶች</span>
          </button>
        </div>
      </div>

      {/* Forms */}
      {activeTab === 'products' ? (
        <form
          action={saleAction}
          className="erp-card p-5 border-t-2 border-t-sky-500 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">የምርት ሽያጭ መዝግብ</h2>
          {saleState.error && <p role="alert" aria-live="polite" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">{saleState.error}</p>}

          {/* Product Cards */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              ምርት ይምረጡ
            </label>
            <input type="hidden" name="product_id" value={selectedProductId} required />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductSelect(p)}
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
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {p.stock_on_hand} {p.unit}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qty, saved price, automatic total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">ብዛት</label>
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100, 200].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(String(num))}
                      disabled={tracksStock && num > availableStock}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 rounded hover:bg-sky-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
              <p className={`mt-1 text-[11px] ${noStock || exceedsStock ? 'text-rose-700' : 'text-slate-500'}`}>
                {noStock ? 'ክምችት የለም። መጀመሪያ ምርት ወይም ግብዓት ይመዝግቡ።' : tracksStock ? `${availableStock.toLocaleString()} ${selectedProduct?.unit ?? ''} በክምችት ይገኛል` : 'የዚህ እቃ ክምችት አይከታተልም።'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">የተወሰነ የአንዱ ዋጋ</label>
              <div className="erp-input flex items-center font-mono font-bold text-slate-600">{selectedProduct?.selling_price == null ? 'ባለቤቱ ዋጋ አልወሰነም' : `ብር ${Number(selectedProduct.selling_price).toLocaleString()}`}</div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold text-slate-500">ድምር</span>
              <div className="text-lg font-extrabold text-sky-700 font-mono mt-1">
                ETB {Number(computedTotal).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Customer and payment method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">የደንበኛ ስም</label>
              <input
                className="erp-input mt-1 text-xs"
                name="customer_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">የክፍያ ዘዴ</label>
              <select
                className="erp-input mt-1 text-xs capitalize"
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">ማስታወሻ</label>
            <input className="erp-input text-xs" name="notes" placeholder="አማራጭ ማስታወሻ" />
          </div>

          <button
            type="submit"
            className="erp-btn-primary w-full py-2.5 text-xs font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedProduct || selectedProduct.selling_price == null || noStock || exceedsStock || numQty <= 0 || salePending}
          >
            <Plus className="w-4 h-4" />
            <span>{salePending ? 'በመመዝገብ ላይ…' : 'ሽያጩን መዝግብ'}</span>
          </button>
        </form>
      ) : (
        <form
          action={recordService}
          className="erp-card p-5 border-t-2 border-t-amber-500 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">የአገልግሎት ክፍያ መዝግብ</h2>

          {/* Service Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">አገልግሎት</label>
            <input type="hidden" name="service_type" value={serviceType} required />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {Object.entries(serviceLabels).map(([key, info]) => {
                const isSelected = serviceType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setServiceType(key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xl mb-1">{info.icon}</div>
                    <div className="font-bold text-xs text-slate-900">{info.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">የደንበኛ ስም</label>
              <input
                className="erp-input mt-1 text-xs"
                name="customer_name"
                value={serviceCustomer}
                onChange={(e) => setServiceCustomer(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">መጠን (ብር)</label>
                <div className="flex items-center gap-1">
                  {[100, 200, 300, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setServiceAmount(String(val))}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 rounded hover:bg-amber-100 cursor-pointer"
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
            <label className="text-xs font-semibold text-slate-700">ማስታወሻ</label>
            <input
              className="erp-input mt-1 text-xs"
              name="notes"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="አማራጭ ማስታወሻ"
            />
          </div>

          <button
            type="submit"
            className="erp-btn-amber w-full py-2.5 text-xs font-bold cursor-pointer"
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
            <span className="text-xs text-slate-400 font-mono">{productSales?.length ?? 0} invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">እቃ</th><th className="py-2.5 px-4">ብዛት</th><th className="py-2.5 px-4">ድምር (ብር)</th><th className="py-2.5 px-4">ደንበኛ</th><th className="py-2.5 px-4">ክፍያ</th><th className="py-2.5 px-4">ቀን</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productSales?.map((x) => {
                  const line = x.sale_lines?.[0];
                  return (
                    <tr key={x.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {line?.item_name_snapshot ?? 'Product'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {line?.quantity} {line?.unit_snapshot}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ETB {Number(x.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{x.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 capitalize text-slate-600">{x.payment_method}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{x.sale_date}</td>
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
            <span className="text-xs text-slate-400 font-mono">{servicePayments?.length ?? 0} payments</span>
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
                    <td className="py-3 px-4 text-slate-600">{x.customer_name || 'Walk-in'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      ETB {Number(x.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {new Date(x.created_at).toLocaleString('en-KE', {
                        timeZone: 'Africa/Nairobi',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{x.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!servicePayments || servicePayments.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">
                No service payments recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
