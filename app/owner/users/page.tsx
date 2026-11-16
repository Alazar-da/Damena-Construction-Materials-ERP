import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';
import { createAdmin } from './actions';

export default async function OwnerUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const client = await db();
  const [{ data: profiles }, { data: { user: currentUser } }] = await Promise.all([
    client.from('profiles').select('id,display_name,role,is_active,created_at').order('created_at'),
    client.auth.getUser(),
  ]);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const emailById = new Map<string, string>();
  if (url && key) {
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((account) => emailById.set(account.id, account.email || ''));
  }

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-sky-700">የመዳረሻ ቁጥጥር</p><h1 className="mt-1 text-2xl font-bold text-slate-900">ተጠቃሚዎች እና ሚናዎች</h1><p className="mt-1 text-sm text-slate-500">የሰራተኛ መለያ ከይለፍ ቃል ጋር ይፍጠሩ እና የስርዓቱን መዳረሻ ይቆጣጠሩ።</p></div>
    {params.error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{params.error}</div>}
    {params.success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.success}</div>}
    <form action={createAdmin} className="erp-card max-w-2xl space-y-4 p-5">
      <div><h2 className="font-semibold text-slate-900">የሰራተኛ መለያ ፍጠር</h2><p className="mt-1 text-xs text-slate-500">ኢሜይልና ይለፍ ቃል አስገብተው መለያውን ወዲያውኑ ይፍጠሩ። ይለፍ ቃሉን ለሰራተኛው በደህና ያስተላልፉ።</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-700">የሚታይ ስም<input name="display_name" className="erp-input mt-1" placeholder="የሰራተኛ ስም" /></label><label className="text-xs font-medium text-slate-700">ኢሜይል አድራሻ<input name="email" type="email" required className="erp-input mt-1" placeholder="name@example.com" /></label><label className="text-xs font-medium text-slate-700">የይለፍ ቃል (ቢያንስ 8 ቁምፊ)<input name="password" type="password" minLength={8} autoComplete="new-password" required className="erp-input mt-1" /></label><label className="text-xs font-medium text-slate-700">የይለፍ ቃሉን ደግመው ያስገቡ<input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required className="erp-input mt-1" /></label></div>
      <div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">ሚና፦ <strong className="text-slate-700">አስተዳዳሪ</strong></span><button className="erp-btn-primary px-4 py-2 text-xs font-semibold" type="submit">መለያ ፍጠር</button></div>
    </form>
    <section className="erp-card overflow-hidden"><div className="border-b border-slate-200 p-4"><h2 className="text-sm font-semibold text-slate-900">የተመዘገቡ መለያዎች</h2></div><div className="divide-y divide-slate-100">
      {(profiles || []).map((profile) => <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{profile.display_name || 'Unnamed user'}{profile.id === currentUser?.id ? ' (you)' : ''}</p><p className="truncate text-xs text-slate-500">{emailById.get(profile.id) || 'Email unavailable'}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${profile.role === 'super_admin' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>{profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span><span className={`text-xs ${profile.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>{profile.is_active ? 'Active' : 'Inactive'}</span></div></div>)}
      {!profiles?.length && <p className="p-5 text-sm text-slate-500">ምንም መለያ አልተገኘም።</p>}
    </div></section>
  </div>;
}
