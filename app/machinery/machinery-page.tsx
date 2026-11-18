/* eslint-disable @next/next/no-img-element -- signed Supabase URLs are rendered as private runtime images. */
import { addMachinery } from './actions';
import { AlertCircle, CheckCircle2, Cog, ImageIcon, MapPin, Plus, Wrench } from 'lucide-react';

type Machinery = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  location: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

const categoryLabels: Record<string, string> = {
  production: 'የምርት ማሽን',
  tool: 'መሳሪያ',
  vehicle: 'ተሽከርካሪ',
  other: 'ሌላ',
};

const statusLabels: Record<string, string> = {
  available: 'ዝግጁ',
  in_use: 'በስራ ላይ',
  maintenance: 'ጥገና ላይ',
  out_of_service: 'ከስራ ውጭ',
};

const statusStyles: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  in_use: 'bg-blue-50 text-blue-800 border-blue-200',
  maintenance: 'bg-amber-50 text-amber-900 border-amber-200',
  out_of_service: 'bg-rose-50 text-rose-800 border-rose-200',
};

const creatorName = (value: Machinery['profiles']) => {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.display_name || 'ያልታወቀ ተጠቃሚ';
};

export default function MachineryPage({
  machinery,
  returnTo,
  title,
  description,
  searchParams,
}: {
  machinery: Machinery[];
  returnTo: '/app/machinery' | '/owner/machinery';
  title: string;
  description: string;
  searchParams: { error?: string; success?: string };
}) {
  const totalUnits = machinery.reduce((sum, item) => sum + Number(item.quantity), 0);
  const working = machinery.filter((item) => item.status === 'available' || item.status === 'in_use').length;
  const attention = machinery.filter((item) => item.status === 'maintenance' || item.status === 'out_of_service').length;

  return (
    <div className="space-y-7 sm:space-y-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900"><Cog className="h-4 w-4" aria-hidden="true" /> የማሽነሪ ክምችት</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-base text-slate-600">{description}</p>
        </div>
      </header>

      {searchParams.success && <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{searchParams.success}</div>}
      {searchParams.error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base font-semibold text-rose-900"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />{searchParams.error}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-600">የተመዘገቡ ማሽኖች</p><p className="mt-2 text-3xl font-bold text-slate-950">{machinery.length}</p></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-sm font-semibold text-emerald-900">ዝግጁ / በስራ ላይ</p><p className="mt-2 text-3xl font-bold text-emerald-950">{working}</p></div>
        <div className={`rounded-2xl border p-5 shadow-sm ${attention ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}><p className="text-sm font-semibold text-slate-700">ትኩረት የሚፈልጉ</p><p className="mt-2 text-3xl font-bold text-slate-950">{attention}</p><p className="mt-1 text-sm text-slate-600">ጠቅላላ ክፍሎች፦ {totalUnits.toLocaleString('en-US')}</p></div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.5fr)]">
        <form action={addMachinery} encType="multipart/form-data" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="border-b border-slate-200 pb-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><Plus className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">አዲስ ማሽን ይመዝግቡ</h2><p className="mt-1 text-sm text-slate-600">የማሽኑን መረጃ በቀላሉ ያስገቡ።</p></div>
          <label className="block text-sm font-bold text-slate-800">የማሽኑ ስም<input name="name" required minLength={2} maxLength={120} className="erp-input mt-2 text-base" placeholder="ለምሳሌ፦ የሲሚንቶ ማደባለቂያ" /></label>
          <label className="block text-sm font-bold text-slate-800">የማሽኑ ፎቶ (አማራጭ)<input name="photo" type="file" accept="image/*" className="mt-2 block min-h-12 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-bold file:text-blue-900" /><span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG ወይም WebP · ከፍተኛ 5MB</span></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-800">ዓይነት<select name="category" defaultValue="production" className="erp-input mt-2 text-base"><option value="production">የምርት ማሽን</option><option value="tool">መሳሪያ</option><option value="vehicle">ተሽከርካሪ</option><option value="other">ሌላ</option></select></label><label className="block text-sm font-bold text-slate-800">ብዛት<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required className="erp-input mt-2 text-base" /></label></div>
          <label className="block text-sm font-bold text-slate-800">ሁኔታ<select name="status" defaultValue="available" className="erp-input mt-2 text-base"><option value="available">ዝግጁ</option><option value="in_use">በስራ ላይ</option><option value="maintenance">ጥገና ላይ</option><option value="out_of_service">ከስራ ውጭ</option></select></label>
          <label className="block text-sm font-bold text-slate-800">የሚገኝበት ቦታ (አማራጭ)<input name="location" maxLength={120} className="erp-input mt-2 text-base" placeholder="ለምሳሌ፦ ዋና የስራ ቦታ" /></label>
          <label className="block text-sm font-bold text-slate-800">ማስታወሻ (አማራጭ)<textarea name="notes" maxLength={500} rows={3} className="erp-input mt-2 text-base" placeholder="ተጨማሪ መረጃ" /></label>
          <button type="submit" className="erp-btn-primary min-h-14 w-full rounded-2xl text-base font-bold"><Plus className="h-5 w-5" aria-hidden="true" />ማሽኑን መዝግብ</button>
        </form>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6"><div><h2 className="text-xl font-bold text-slate-950">ያሉ ማሽኖች</h2><p className="mt-1 text-sm text-slate-600">የድርጅቱ የማሽነሪ ዝርዝር</p></div><Wrench className="h-6 w-6 text-blue-800" aria-hidden="true" /></div>
          <div className="divide-y divide-slate-100">
            {machinery.map((item) => <article key={item.id} className="p-5 transition-colors hover:bg-blue-50/40 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3">{item.photo_url ? <img src={item.photo_url} alt={item.name} className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><ImageIcon className="h-6 w-6" aria-hidden="true" /></span>}<div className="min-w-0"><h3 className="truncate text-lg font-bold text-slate-950">{item.name}</h3><p className="mt-1 text-sm text-slate-600">{categoryLabels[item.category] || item.category} · {Number(item.quantity).toLocaleString('en-US')} ክፍል</p></div></div><span className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold ${statusStyles[item.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{statusLabels[item.status] || item.status}</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{item.location || 'ቦታ አልተገለጸም'}</span><span>በ{creatorName(item.profiles)} ተመዝግቧል</span></div>{item.notes && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.notes}</p>}</article>)}
            {machinery.length === 0 && <div className="px-6 py-14 text-center"><Cog className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" /><p className="mt-3 text-base font-semibold text-slate-800">እስካሁን ማሽን አልተመዘገበም</p><p className="mt-1 text-sm text-slate-600">የመጀመሪያውን ማሽን በግራ በኩል ያስገቡ።</p></div>}
          </div>
        </section>
      </div>
    </div>
  );
}
