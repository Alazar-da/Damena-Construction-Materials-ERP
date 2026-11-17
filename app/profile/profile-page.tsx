import Link from 'next/link';
import { CheckCircle2, KeyRound, Mail, UserRound } from 'lucide-react';
import { updateDisplayName, updatePassword } from './actions';

type ProfilePageProps = {
  backHref: '/app' | '/owner';
  profilePath: '/app/profile' | '/owner/profile';
  user: { email?: string; user_metadata?: { display_name?: string } };
  profile: { display_name: string | null } | null;
  searchParams: { error?: string; success?: string };
};

const fallbackName = (email: string, metadataName?: string) =>
  metadataName?.trim() || email.split('@')[0] || 'ተጠቃሚ';

export default function ProfilePage({ backHref, profilePath, user, profile, searchParams }: ProfilePageProps) {
  const storedName = profile?.display_name?.trim();
  const name = storedName && storedName !== user.email ? storedName : fallbackName(user.email || '', user.user_metadata?.display_name);

  return (
    <div className="mx-auto max-w-4xl space-y-7 sm:space-y-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900"><UserRound className="h-4 w-4" aria-hidden="true" /> የግል መለያ</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">የእኔ መገለጫ</h1>
          <p className="mt-2 text-base text-slate-600">ስምዎን እና የመግቢያ ይለፍ ቃልዎን ያስተዳድሩ</p>
        </div>
        <Link href={backHref} className="erp-btn-secondary min-h-12 px-5 text-base">ወደ ዋና ገጽ ተመለስ</Link>
      </header>
      {searchParams.success && <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />{searchParams.success}</div>}
      {searchParams.error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base font-semibold text-rose-900">{searchParams.error}</div>}
      <section className="rounded-[2rem] bg-[#111827] p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-400/15 text-2xl font-bold text-blue-100 ring-1 ring-blue-200/20">{name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-2xl font-bold">{name}</p><p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-300"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{user.email}</p></div></div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateDisplayName} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><input type="hidden" name="return_to" value={profilePath} /><div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><UserRound className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">ስም ቀይር</h2><p className="mt-1 text-sm text-slate-600">ይህ ስም በመተግበሪያው ላይ ይታያል።</p></div><label className="block text-sm font-bold text-slate-800">የሚታይ ስም<input name="display_name" defaultValue={name} required minLength={2} maxLength={120} className="erp-input mt-2 text-base" /></label><button type="submit" className="erp-btn-primary min-h-12 w-full rounded-xl text-base font-bold">ስሙን አስቀምጥ</button></form>
        <form action={updatePassword} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><input type="hidden" name="return_to" value={profilePath} /><div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-800"><KeyRound className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">የይለፍ ቃል ቀይር</h2><p className="mt-1 text-sm text-slate-600">ለደህንነት መጀመሪያ የአሁኑን ይለፍ ቃል ያስገቡ።</p></div><label className="block text-sm font-bold text-slate-800">የአሁኑ የይለፍ ቃል<input name="current_password" type="password" required autoComplete="current-password" className="erp-input mt-2 text-base" /></label><label className="block text-sm font-bold text-slate-800">አዲስ የይለፍ ቃል<input name="password" type="password" required minLength={8} autoComplete="new-password" className="erp-input mt-2 text-base" /></label><label className="block text-sm font-bold text-slate-800">ደግመው ያስገቡ<input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className="erp-input mt-2 text-base" /></label><button type="submit" className="erp-btn-primary min-h-12 w-full rounded-xl text-base font-bold">የይለፍ ቃሉን አስቀምጥ</button></form>
      </div>
    </div>
  );
}
