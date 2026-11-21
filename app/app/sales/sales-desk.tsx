'use client';

import React, { useActionState, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { recordProductSale, recordService, type ProductSaleState } from './actions';
import { ShoppingCart, Zap, DollarSign, Check, AlertCircle, History, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [showHistory, setShowHistory] = useState(false);
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

  // History Pagination (Only 10 displayed per page)
  const PAGE_SIZE = 10;
  const [salesPage, setSalesPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const totalSalesPages = Math.ceil((productSales?.length || 0) / PAGE_SIZE) || 1;
  const totalServicesPages = Math.ceil((servicePayments?.length || 0) / PAGE_SIZE) || 1;
  const pagedSales = (productSales || []).slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE);
  const pagedServices = (servicePayments || []).slice((servicesPage - 1) * PAGE_SIZE, servicesPage * PAGE_SIZE);

  // Lock mouse wheel scrolling on number inputs
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const serviceAmountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qEl = quantityInputRef.current;
    const sEl = serviceAmountInputRef.current;
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    if (qEl) qEl.addEventListener('wheel', preventWheel, { passive: false });
    if (sEl) sEl.addEventListener('wheel', preventWheel, { passive: false });
    return () => {
      if (qEl) qEl.removeEventListener('wheel', preventWheel);
      if (sEl) sEl.removeEventListener('wheel', preventWheel);
    };
  }, []);

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
      {/* Sub-Header Breadcrumb & Product/Service Switcher Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>ዳሽቦርድ</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">የሽያጭ ዴስክ (Sales Desk)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {activeTab === 'products' ? 'የምርት ሽያጭ እና ደረሰኝ' : 'የወርክሾፕ እና ባትሪ አገልግሎት'}
          </h1>
        </div>

        {/* Product and Service Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            aria-pressed={activeTab === 'products'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>የምርት ሽያጭ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            aria-pressed={activeTab === 'services'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'services'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>የወርክሾፕ አገልግሎቶች</span>
          </button>
        </div>
      </div>

      {/* POS Two-Column Split Layout */}
      {activeTab === 'products' ? (
        <form action={saleAction} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <input type="hidden" name="product_id" value={selectedProductId} required />

          {/* LEFT: PRODUCT CATALOG CARDS GRID (7 cols on tablet, 8 on desktop) */}
          <div className="md:col-span-7 lg:col-span-8 space-y-4">
            {saleState.error && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{saleState.error}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>ምርቶች ({products.length} items)</span>
              <span>ጠቅ ያድርጉ ምርት ለመምረጥ</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                const pPrice = Number(p.selling_price || 0);
                const pStock = Number(p.stock_on_hand || 0);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductSelect(p)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border p-3.5 text-left transition-all flex flex-col justify-between shadow-2xs relative cursor-pointer group ${isSelected
                      ? 'border-slate-900 bg-slate-50/50 ring-2 ring-slate-900/15 shadow-sm'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>የተመረጠ</span>
                      </span>
                    )}

                    {/* Centered Floating Transparent Product Image */}
                    <div className="h-28 sm:h-32 w-full flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform">
                      <Image
                        src={imageFor(p.name)}
                        alt={p.name}
                        width={110}
                        height={85}
                        className="max-h-24 max-w-full object-contain drop-shadow-md"
                      />
                    </div>

                    {/* Product Meta (Clean Name & Stock - No Descriptor Tags) */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {displayProductName(p.name)}
                      </h3>
                      <div className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                        {pStock.toLocaleString()} {p.unit === 'piece' ? 'ክፍል' : p.unit} in stock
                      </div>
                    </div>

                    {/* Price and Action Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {pStock > 0 ? 'ይገኛል' : 'አልቋል'}
                      </span>
                      <span className="text-sm font-extrabold font-mono text-slate-900">
                        {pPrice > 0 ? `${pPrice.toLocaleString()} ETB` : 'ዋጋ የለውም'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: CHECKOUT ORDER SUMMARY PANEL (5 cols on tablet, 4 on desktop) */}
          <div className="md:col-span-5 lg:col-span-4 sticky top-20 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-slate-900" />
                  <span>Checkout (የሂሳብ ማጠቃለያ)</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Order Invoice</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                #DRAFT-POS
              </span>
            </div>

            {/* Selected Product Banner */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <Image
                    src={imageFor(selectedProduct.name)}
                    alt={selectedProduct.name}
                    width={40}
                    height={40}
                    className="object-contain drop-shadow-2xs"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {displayProductName(selectedProduct.name)}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {numPrice.toLocaleString()} ETB / {selectedProduct.unit === 'piece' ? 'ክፍል' : selectedProduct.unit}
                  </p>
                </div>
              </div>
            )}

            {/* Quantity Stepper (Wheel Scroll Locked, No Chips) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">የሽያጭ ብዛት (Quantity)</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {tracksStock ? `ቀሪ: ${availableStock.toLocaleString()}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(String(Math.max(1, (parseFloat(quantity) || 0) - 10)))}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  −
                </button>
                <input
                  ref={quantityInputRef}
                  name="quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  max={tracksStock ? availableStock : undefined}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onWheel={(e) => {
                    e.currentTarget.blur();
                    e.preventDefault();
                  }}
                  className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 text-center outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 10))}
                  disabled={tracksStock && (parseFloat(quantity) || 0) + 10 > availableStock}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">የደንበኛ ስም (Customer Name)</label>
              <input
                name="customer_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">የክፍያ ዘዴ (Payment Method)</label>
              <input type="hidden" name="payment_method" value={paymentMethod} />
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'cash', label: 'ጥሬ ገንዘብ (Cash)' },
                  { id: 'bank', label: 'ባንክ / ዲጂታል (Bank/Digital)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${paymentMethod === m.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Due & Submit Button */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">ጠቅላላ ክፍያ:</span>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-slate-950">
                    {Number(computedTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">ETB</span>
                </div>
              </div>

              {noStock && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  ይህ እቃ በመጋዘን አልቋል።
                </p>
              )}

              {exceedsStock && (
                <p className="text-xs text-amber-600 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                  የተጠየቀው ብዛት ካለው ክምችት ({availableStock}) ይበልጣል።
                </p>
              )}

              <button
                type="submit"
                disabled={salePending || noStock || exceedsStock}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{salePending ? 'በመመዝገብ ላይ...' : 'ሽያጩን አጠናቅቅ'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* WORKSHOP SERVICES POS VIEW */
        <form action={recordService} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <input type="hidden" name="service_type" value={serviceType} />

          <div className="md:col-span-7 lg:col-span-8 space-y-4">
            <div className="text-xs text-slate-500 font-mono">
              <span>የአገልግሎት ዓይነቶች</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {Object.entries(serviceLabels).map(([key, info]) => {
                const isSelected = serviceType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setServiceType(key)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between shadow-2xs relative cursor-pointer ${isSelected
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                    <div className="text-3xl mb-3">{info.icon}</div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{info.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-1">ፈጣን አገልግሎት</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Checkout Panel (5 cols on tablet, 4 on desktop) */}
          <div className="md:col-span-5 lg:col-span-4 sticky top-20 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>የአገልግሎት ክፍያ ማጠቃለያ</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Service Checkout</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">የደንበኛ ስም (Customer Name)</label>
              <input
                name="customer_name"
                value={serviceCustomer}
                onChange={(e) => setServiceCustomer(e.target.value)}
                placeholder="በቀጥታ የመጣ ደንበኛ"
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">መጠን (ብር / Amount)</label>
              </div>
              <input
                ref={serviceAmountInputRef}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={serviceAmount}
                onChange={(e) => setServiceAmount(e.target.value)}
                onWheel={(e) => {
                  e.currentTarget.blur();
                  e.preventDefault();
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <input
                name="notes"
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="ማስታወሻ (አማራጭ)"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-[11px] text-slate-700 outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">ጠቅላላ ክፍያ:</span>
                <span className="text-xl font-black font-mono text-amber-600">
                  {Number(serviceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>ክፍያውን መዝግብ</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =============================================================== */}
      {/* BOTTOM SALES HISTORY (Button at bottom toggles drawer)          */}
      {/* =============================================================== */}
      <div className="pt-3">
        {!showHistory ? (
          <div className="flex justify-center pt-3 pb-6">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
            >
              <History className="w-4 h-4 text-emerald-600" />
              <span>የሽያጭ ታሪክ አሳይ (Display History)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 pt-5 border-t border-slate-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">የቅርብ ጊዜ ሽያጮች እና ክፍያዎች</h2>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ታሪክ ዝጋ (Close)</span>
              </button>
            </div>

            {/* Product Sales History */}
            <div className="erp-card overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ የምርት ሽያጮች</h3>
                <span className="text-sm font-semibold text-slate-600">{productSales?.length ?? 0} ሽያጮች</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">እቃ</th>
                      <th className="py-2.5 px-4">ብዛት</th>
                      <th className="py-2.5 px-4">ድምር (ብር)</th>
                      <th className="py-2.5 px-4">ደንበኛ</th>
                      <th className="py-2.5 px-4">ክፍያ</th>
                      <th className="py-2.5 px-4">ቀን</th>
                      <th className="py-2.5 px-4">የመዘገበው</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedSales.map((x) => {
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
                          <td className="py-3 px-4 text-slate-700">
                            {x.payment_method === 'cash' ? 'ጥሬ ገንዘብ' : 'ባንክ / ዲጂታል'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-xs">{x.sale_date}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">
                            {(Array.isArray(x.profiles) ? x.profiles[0] : x.profiles)?.display_name || 'ያልታወቀ ተጠቃሚ'}
                          </td>
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

              {/* 10-Item Pagination Controls for Product Sales */}
              {(productSales?.length || 0) > PAGE_SIZE && (
                <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={salesPage <= 1}
                    onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>ቀዳሚ</span>
                  </button>
                  <div className="px-3 py-1 text-slate-700 font-mono font-bold text-xs bg-white rounded-lg border border-slate-200">
                    ገጽ {salesPage} ከ {totalSalesPages}
                  </div>
                  <button
                    type="button"
                    disabled={salesPage >= totalSalesPages}
                    onClick={() => setSalesPage((p) => Math.min(totalSalesPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>ቀጣይ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Service Payments History */}
            <div className="erp-card overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">የቅርብ ጊዜ የአገልግሎት ክፍያዎች</h3>
                <span className="text-sm font-semibold text-slate-600">{servicePayments?.length ?? 0} ክፍያዎች</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">አገልግሎት</th>
                      <th className="py-2.5 px-4">ደንበኛ</th>
                      <th className="py-2.5 px-4">መጠን (ብር)</th>
                      <th className="py-2.5 px-4">ቀን / ሰዓት</th>
                      <th className="py-2.5 px-4">ማስታወሻ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedServices.map((x) => (
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

              {/* 10-Item Pagination Controls for Service Payments */}
              {(servicePayments?.length || 0) > PAGE_SIZE && (
                <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={servicesPage <= 1}
                    onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>ቀዳሚ</span>
                  </button>
                  <div className="px-3 py-1 text-slate-700 font-mono font-bold text-xs bg-white rounded-lg border border-slate-200">
                    ገጽ {servicesPage} ከ {totalServicesPages}
                  </div>
                  <button
                    type="button"
                    disabled={servicesPage >= totalServicesPages}
                    onClick={() => setServicesPage((p) => Math.min(totalServicesPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>ቀጣይ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
