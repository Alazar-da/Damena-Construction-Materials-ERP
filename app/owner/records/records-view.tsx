'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Search,
  Receipt,
  BriefcaseBusiness,
  WalletCards,
  Factory,
  Boxes,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import {
  updateOwnerMovement,
  updateOwnerPayroll,
  updateOwnerProduction,
  updateOwnerSale,
  updateOwnerService,
} from '../record-actions';

type SaleLine = {
  id: string;
  quantity: number;
  unit_price: number;
  product_id: string | null;
  item_name_snapshot: string;
  unit_snapshot: string;
};

type Sale = {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  total_amount: number;
  paid_amount: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  recorded_by: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  sale_lines: SaleLine[];
};

type Service = {
  id: string;
  service_type: string;
  customer_name: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
};

type Payroll = {
  id: string;
  worker_name: string | null;
  pay_type: string;
  period_start: string;
  amount: number;
  rate_snapshot: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

type Production = {
  id: string;
  production_date: string;
  output_product_id: string;
  output_quantity: number;
  notes: string | null;
  created_at: string;
  products: { name: string; unit: string } | { name: string; unit: string }[] | null;
};

type Movement = {
  id: string;
  product_id: string;
  quantity_delta: number;
  movement_type: string;
  reason: string;
  created_at: string;
  products: { name: string; unit: string } | { name: string; unit: string }[] | null;
};

type Category = 'sales' | 'services' | 'payroll' | 'production' | 'stock';

const money = (value: number) =>
  `ብር ${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

const relation = (value: Production['products']) =>
  Array.isArray(value) ? value[0] : value;

const recordedBy = (value: Sale['profiles']) => {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.display_name || 'ያልታወቀ ተጠቃሚ';
};

const categories: [Category, string, React.ComponentType<{ className?: string }>][] = [
  ['sales', 'ሽያጭ', Receipt],
  ['services', 'አገልግሎቶች', BriefcaseBusiness],
  ['payroll', 'ደመወዝ', WalletCards],
  ['production', 'ምርት', Factory],
  ['stock', 'ክምችት', Boxes],
];

const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900';
const numInputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 space-y-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SaveButton() {
  return (
    <button
      type="submit"
      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
    >
      <Check className="w-3.5 h-3.5 text-white" />
      <span>ለውጦችን አስቀምጥ</span>
    </button>
  );
}

function RecordCard({
  type,
  title,
  subtitle,
  amount,
  statusBadge,
  children,
}: {
  type: string;
  title: string;
  subtitle: string;
  amount?: string;
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div data-record-type={type} className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-colors">
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-slate-900 truncate">{title}</span>
            {statusBadge}
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {amount && (
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">
              {amount}
            </span>
          )}
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 transition-all ${
              open ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 sm:p-5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function OwnerRecords({
  sales,
  services,
  payroll,
  production,
  movements,
}: {
  sales: Sale[];
  services: Service[];
  payroll: Payroll[];
  production: Production[];
  movements: Movement[];
}) {
  const [active, setActive] = useState<Category>('sales');
  const [query, setQuery] = useState('');

  const counts: Record<Category, number> = {
    sales: sales.length,
    services: services.length,
    payroll: payroll.length,
    production: production.length,
    stock: movements.length,
  };

  const matches = useCallback(
    (row: unknown) => JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()),
    [query]
  );

  const visibleSales = useMemo(() => sales.filter(matches), [sales, matches]);
  const visibleServices = useMemo(() => services.filter(matches), [services, matches]);
  const visiblePayroll = useMemo(() => payroll.filter(matches), [payroll, matches]);
  const visibleProduction = useMemo(() => production.filter(matches), [production, matches]);
  const visibleMovements = useMemo(() => movements.filter(matches), [movements, matches]);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const shown =
    active === 'sales'
      ? visibleSales.length
      : active === 'services'
      ? visibleServices.length
      : active === 'payroll'
      ? visiblePayroll.length
      : active === 'production'
      ? visibleProduction.length
      : visibleMovements.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            መዝገቦችን አስተዳድር
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            ጠቅላላ መዝገቦች፦ {total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Category Pills (Mobile horizontal scrollable carousel) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(([key, label, Icon]) => {
          const isActive = active === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActive(key);
                setQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clean Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
          placeholder={`${categories.find(([k]) => k === active)?.[1]} ፈልግ...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Entry List */}
      <div className="space-y-2.5">
        {/* SALES */}
        {active === 'sales' &&
          visibleSales.map((s) => {
            const line = s.sale_lines?.[0];
            const itemName = line?.item_name_snapshot || 'የምርት ሽያጭ';
            const itemQty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '';
            const due = Math.max(0, Number(s.total_amount) - Number(s.paid_amount));
            const isPaid = due === 0;

            return (
              <RecordCard
                key={s.id}
                type="ሽያጭ"
                title={itemName}
                subtitle={`${itemQty ? `${itemQty} · ` : ''}${s.sale_date} · ${s.customer_name || 'በቀጥታ ሽያጭ'} · በ${recordedBy(s.profiles)} ተመዝግቧል`}
                amount={money(Number(s.total_amount))}
                statusBadge={
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold font-mono ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isPaid ? 'ተከፍሏል' : `ያልተከፈለ፦ ${money(due)}`}
                  </span>
                }
              >
                <form action={updateOwnerSale} className="space-y-3.5">
                  <input type="hidden" name="id" value={s.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <FieldLabel label="የሽያጭ ቀን">
                      <input
                        className={inputClass}
                        name="sale_date"
                        type="date"
                        defaultValue={s.sale_date}
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="ደንበኛ">
                      <input
                        className={inputClass}
                        name="customer_name"
                        defaultValue={s.customer_name ?? ''}
                        placeholder="የደንበኛ ስም"
                      />
                    </FieldLabel>

                    <FieldLabel label={`Quantity${line ? ` (${line.unit_snapshot})` : ''}`}>
                      <input
                        className={numInputClass}
                        name="quantity"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        defaultValue={line?.quantity ?? 1}
                        required
                        disabled={!line}
                      />
                    </FieldLabel>

                    <FieldLabel label="የአንዱ ዋጋ (ብር)">
                      <input
                        className={numInputClass}
                        name="unit_price"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        defaultValue={line?.unit_price ?? 0}
                        required
                        disabled={!line}
                      />
                    </FieldLabel>

                    <FieldLabel label="የተከፈለ መጠን (ብር)">
                      <input
                        className={numInputClass}
                        name="paid_amount"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        defaultValue={s.paid_amount}
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="የክፍያ ዘዴ">
                      <select
                        className={inputClass}
                        name="payment_method"
                        defaultValue={s.payment_method || 'cash'}
                      >
                        <option value="cash">ጥሬ ገንዘብ</option><option value="bank">ባንክ</option><option value="credit">ዱቤ</option>
                      </select>
                    </FieldLabel>

                    <div className="sm:col-span-2">
                      <FieldLabel label="ማስታወሻ">
                        <input
                          className={inputClass}
                          name="notes"
                          defaultValue={s.notes ?? ''}
                          placeholder="ማስታወሻ"
                        />
                      </FieldLabel>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    {line ? (
                      <SaveButton />
                    ) : (
                      <p className="text-xs text-amber-700">ከአንድ በላይ እቃ ያለበት ሽያጭ እዚህ ማርትዕ አይቻልም።</p>
                    )}
                  </div>
                </form>
              </RecordCard>
            );
          })}

        {/* SERVICES */}
        {active === 'services' &&
          visibleServices.map((s) => (
            <RecordCard
              key={s.id}
              type="አገልግሎት"
              title={s.service_type.replaceAll('_', ' ')}
              subtitle={`${new Date(s.created_at).toLocaleDateString('en-KE')} · ${
                s.customer_name || 'Walk-in'
              }`}
              amount={money(Number(s.amount))}
            >
              <form action={updateOwnerService} className="space-y-3.5">
                <input type="hidden" name="id" value={s.id} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FieldLabel label="የአገልግሎት ዓይነት">
                    <select
                      className={inputClass}
                      name="service_type"
                      defaultValue={s.service_type}
                    >
                      <option value="battery_charging">ባትሪ መሙላት</option><option value="battery_acid">የባትሪ አሲድ መሙላት</option><option value="welding">ብየዳ</option>
                    </select>
                  </FieldLabel>

                    <FieldLabel label="ደንበኛ">
                    <input
                      className={inputClass}
                      name="customer_name"
                      defaultValue={s.customer_name ?? ''}
                        placeholder="የደንበኛ ስም"
                    />
                  </FieldLabel>

                  <FieldLabel label="መጠን (ብር)">
                    <input
                      className={numInputClass}
                      name="amount"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      defaultValue={s.amount}
                      required
                    />
                  </FieldLabel>

                  <FieldLabel label="ማስታወሻ">
                    <input
                      className={inputClass}
                      name="notes"
                      defaultValue={s.notes ?? ''}
                    placeholder="ማስታወሻ"
                    />
                  </FieldLabel>
                </div>

                <div className="pt-2 flex justify-end">
                  <SaveButton />
                </div>
              </form>
            </RecordCard>
          ))}

        {/* PAYROLL */}
        {active === 'payroll' &&
          visiblePayroll.map((p) => (
            <RecordCard
              key={p.id}
              type="Payroll"
              title={p.worker_name || 'Worker'}
              subtitle={`${p.period_start} · ${p.pay_type}`}
              amount={money(Number(p.amount))}
            >
              <form action={updateOwnerPayroll} className="space-y-3.5">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FieldLabel label="Worker Name">
                    <input
                      className={inputClass}
                      name="worker_name"
                      defaultValue={p.worker_name ?? ''}
                      required
                    />
                  </FieldLabel>

                  <FieldLabel label="Pay Period">
                    <select className={inputClass} name="pay_type" defaultValue={p.pay_type}>
                      <option value="daily">ዕለታዊ</option><option value="weekly">ሳምንታዊ</option><option value="monthly">ወርሃዊ</option>
                    </select>
                  </FieldLabel>

                  <FieldLabel label="Date">
                    <input
                      className={inputClass}
                      name="period_start"
                      type="date"
                      defaultValue={p.period_start}
                      required
                    />
                  </FieldLabel>

                  <FieldLabel label="Amount Paid (ETB)">
                    <input
                      className={numInputClass}
                      name="amount"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      defaultValue={p.amount}
                      required
                    />
                  </FieldLabel>

                  <FieldLabel label="Payment Method">
                    <select
                      className={inputClass}
                      name="payment_method"
                      defaultValue={p.payment_method || 'cash'}
                    >
                      <option value="cash">ጥሬ ገንዘብ</option><option value="bank">ባንክ</option><option value="mobile">ሞባይል</option>
                    </select>
                  </FieldLabel>

                  <div className="sm:col-span-2">
                    <FieldLabel label="Notes">
                      <input
                        className={inputClass}
                        name="notes"
                        defaultValue={p.notes ?? ''}
                        placeholder="ማስታወሻ"
                      />
                    </FieldLabel>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <SaveButton />
                </div>
              </form>
            </RecordCard>
          ))}

        {/* PRODUCTION */}
        {active === 'production' &&
          visibleProduction.map((r) => {
            const product = relation(r.products);
            return (
              <RecordCard
                key={r.id}
                type="Production"
                title={product?.name || 'Production Output'}
                subtitle={`${r.production_date}`}
                amount={`+${Number(r.output_quantity).toLocaleString()} ${
                  product?.unit || 'units'
                }`}
              >
                <form action={updateOwnerProduction} className="space-y-3.5">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FieldLabel label="Production Date">
                      <input
                        className={inputClass}
                        name="production_date"
                        type="date"
                        defaultValue={r.production_date}
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="Output Quantity">
                      <input
                        className={numInputClass}
                        name="output_quantity"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        defaultValue={r.output_quantity}
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="Notes">
                      <input
                        className={inputClass}
                        name="notes"
                        defaultValue={r.notes ?? ''}
                        placeholder="ማስታወሻ"
                      />
                    </FieldLabel>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <SaveButton />
                  </div>
                </form>
              </RecordCard>
            );
          })}

        {/* STOCK */}
        {active === 'stock' &&
          visibleMovements.map((m) => {
            const product = relation(m.products);
            const isReceipt = m.movement_type === 'receipt';
            return (
              <RecordCard
                key={m.id}
                type={isReceipt ? 'Receipt' : 'Stock Issue'}
                title={product?.name || 'Stock item'}
                subtitle={`${new Date(m.created_at).toLocaleDateString('en-KE')} · ${m.reason}`}
                amount={`${isReceipt ? '+' : '−'}${Math.abs(
                  Number(m.quantity_delta)
                ).toLocaleString()} ${product?.unit || ''}`}
              >
                <form action={updateOwnerMovement} className="space-y-3.5">
                  <input type="hidden" name="id" value={m.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldLabel label="Quantity">
                      <input
                        className={numInputClass}
                        name="quantity"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        defaultValue={Math.abs(Number(m.quantity_delta))}
                        required
                      />
                    </FieldLabel>

                    <FieldLabel label="Reason">
                      <input
                        className={inputClass}
                        name="reason"
                        defaultValue={m.reason}
                        placeholder="ምክንያት"
                      />
                    </FieldLabel>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <SaveButton />
                  </div>
                </form>
              </RecordCard>
            );
          })}

        {/* Empty State */}
        {shown === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">ምንም መዝገብ አልተገኘም</p>
            <p className="text-xs text-slate-400 mt-1">ሌላ ምድብ ይምረጡ ወይም ፍለጋውን ያጽዱ</p>
          </div>
        )}
      </div>
    </div>
  );
}
