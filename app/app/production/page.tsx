import Image from 'next/image';
import { db } from '@/lib/supabase/server';
import ProductionForm from './production-form';
import { History } from 'lucide-react';

const imageFor = (name: string) =>
  name === '10/10 Block'
    ? '/products/block-10-10.png'
    : name === '15/15 Block'
    ? '/products/block-15-15.png'
    : name === '20/20 Block'
    ? '/products/block-20-20.png'
    : '/products/terrace.png';

export default async function ProductionPage() {
  const c = await db();

  const [
    { data: outputs, error: outputsError },
    { data: runs, error: runsError },
  ] = await Promise.all([
    c
      .from('products')
      .select('id,name,unit')
      .in('name', ['10/10 Block', '15/15 Block', '20/20 Block', 'Terrace'])
      .eq('is_active', true),
    c
      .from('production_runs')
      .select('id,production_date,output_quantity,output_product_id,created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (outputsError)
    throw new Error(`Unable to read production products: ${outputsError.message}`);
  if (runsError)
    throw new Error(`Unable to read production history: ${runsError.message}`);

  const names = new Map((outputs ?? []).map((x) => [x.id, x.name]));
  const totalUnits = (runs ?? []).reduce(
    (acc, r) => acc + Number(r.output_quantity),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ምርት
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">የተጠናቀቁ ብሎኮች እና ቴራሶ መዝገቦች</p>
        </div>

        <div className="bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl text-xs">
          <span className="text-slate-600">ጠቅላላ ምርት፦ </span>
          <strong className="text-slate-900 font-mono font-bold text-sm">
            {totalUnits.toLocaleString()}
          </strong>{' '}
          <span className="text-slate-500">ክፍሎች</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-7">
          <ProductionForm products={outputs ?? []} />
        </div>

        {/* History */}
        <div className="lg:col-span-5">
          <div className="erp-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-sm text-slate-900">የቅርብ ጊዜ ምርቶች</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">{runs?.length ?? 0} batches</span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {runs?.map((r) => {
              const productName = names.get(r.output_product_id) ?? 'እቃ';
                return (
                  <div key={r.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                        <Image
                          src={imageFor(productName)}
                          alt={productName}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.production_date}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-sm font-bold text-emerald-600">
                      +{Number(r.output_quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}

              {(!runs || runs.length === 0) && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No production runs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
