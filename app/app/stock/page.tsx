import Image from 'next/image';
import { db } from '@/lib/supabase/server';
import StockActionsPanel from './stock-actions-panel';
import StockActivityHistory from './stock-activity-history';
import { Warehouse } from 'lucide-react';

const storeNames = [
  'Cement 50kg',
  '10/10 Block',
  '15/15 Block',
  '20/20 Block',
  'Terrace',
];

const imageFor = (name: string) =>
  name === 'Cement 50kg'
    ? '/products/cement-50kg.png'
    : name === '10/10 Block'
    ? '/products/block-10-10.png'
    : name === '15/15 Block'
    ? '/products/block-15-15.png'
    : name === '20/20 Block'
    ? '/products/block-20-20.png'
    : '/products/terrace.png';

export default async function StockPage() {
  const c = await db();

  const [
    { data: items, error: itemsError },
    { data: movements, error: movementsError },
  ] = await Promise.all([
    c
      .from('products')
      .select('id,name,category,unit,stock_on_hand')
      .in('name', storeNames)
      .eq('is_active', true)
      .order('name'),
    c
      .from('inventory_movements')
      .select('id,product_id,quantity_delta,movement_type,reason,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (itemsError) throw new Error(`Unable to read products: ${itemsError.message}`);
  if (movementsError)
    throw new Error(`Unable to read movements: ${movementsError.message}`);

  const cement = items?.find((i) => i.name === 'Cement 50kg');
  const cementQty = Number(cement?.stock_on_hand ?? 0);
  const names = new Map((items ?? []).map((i) => [i.id, i.name]));
  const itemNames = Object.fromEntries((items ?? []).map((i) => [i.id, i.name]));
  const visibleMovements = (movements ?? []).filter((m) =>
    names.has(m.product_id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            የሲሚንቶ መጋዘን
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">የመጋዘን ቀሪ ሂሳብ እና የክምችት እንቅስቃሴዎች</p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
          <Warehouse className="w-4 h-4 text-amber-600" />
          <div className="text-xs">
            <span className="text-slate-600">የሲሚንቶ ቀሪ ሂሳብ፦ </span>
            <strong className="text-slate-900 font-mono font-bold text-sm">
              {cementQty.toLocaleString()}
            </strong>{' '}
            <span className="text-slate-500">ከረጢት</span>
          </div>
        </div>
      </div>

      {/* Stock Cards (5 Items) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {items?.map((item) => {
          const qty = Number(item.stock_on_hand);
          const isOutOfStock = qty <= 0;
          const isLow = qty > 0 && qty <= 50;

          return (
            <div key={item.id} className="erp-card p-3.5 flex flex-col justify-between">
              <div>
                <div className="h-24 w-full flex items-center justify-center p-1.5 mb-2 bg-slate-50 rounded-lg">
                  <Image
                    src={imageFor(item.name)}
                    alt={item.name}
                    width={72}
                    height={72}
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-xs text-slate-900 truncate">{item.name}</h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <div className="font-mono text-base font-bold text-slate-900">
                  {qty.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isOutOfStock
                      ? 'bg-rose-50 text-rose-700'
                      : isLow
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isOutOfStock ? 'ባዶ' : isLow ? 'ዝቅተኛ' : 'ጥሩ'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <StockActionsPanel cementOnHand={cementQty} />

      {/* Stock Balance Table */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">የክምችት ቀሪ ሂሳብ</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">እቃ</th><th className="py-2.5 px-4">ምድብ</th><th className="py-2.5 px-4">መለኪያ</th><th className="py-2.5 px-4">ያለ ክምችት</th><th className="py-2.5 px-4">ሁኔታ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items?.map((item) => {
                const qty = Number(item.stock_on_hand);
                const isOutOfStock = qty <= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.unit}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {qty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'ባዶ' : 'በክምችት አለ'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Activity History Table (Paginated 8 items at a time) */}
      <StockActivityHistory movements={visibleMovements} itemNames={itemNames} />
    </div>
  );
}
