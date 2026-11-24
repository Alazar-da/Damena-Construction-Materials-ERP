import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';
import CreateUserForm from './create-user-form';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Crown,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const client = await db();
  const [{ data: profiles }, { data: { user: currentUser } }] = await Promise.all([
    client.from('profiles').select('id,display_name,role,is_active,created_at').order('created_at'),
    client.auth.getUser(),
  ]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const emailById = new Map<string, string>();
  const roleById = new Map<string, string>();

  if (url && key) {
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((account) => {
      emailById.set(account.id, account.email || '');
      const metaRole = account.app_metadata?.role || account.user_metadata?.role;
      if (metaRole) {
        roleById.set(account.id, metaRole);
      }
    });
  }

  const managerCount = (profiles || []).filter(
    (p) => (roleById.get(p.id) || p.role) === 'manager'
  ).length;
  const adminCount = (profiles || []).filter(
    (p) => (roleById.get(p.id) || p.role) === 'admin'
  ).length;
  const superAdminCount = (profiles || []).filter((p) => p.role === 'super_admin').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የመዳረሻና ሚናዎች ቁጥጥር
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            የተጠቃሚዎች እና ስራ አስኪያጆች መለያ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            የስራ አስኪያጅ ወይም የአስተዳዳሪ መለያዎችን ይፍጠሩ እና ያስተዳድሩ
          </p>
        </div>

        {/* Counts summary badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-3 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <div>
              <div className="text-[10px] font-bold text-amber-800 uppercase">ስራ አስኪያጅ</div>
              <div className="text-sm font-black font-mono text-amber-950">{managerCount}</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl px-3 py-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <div>
              <div className="text-[10px] font-bold text-blue-800 uppercase">አስተዳዳሪ</div>
              <div className="text-sm font-black font-mono text-blue-950">{adminCount}</div>
            </div>
          </div>
          <div className="bg-violet-50 border border-violet-200/80 rounded-2xl px-3 py-2 flex items-center gap-2">
            <Crown className="w-4 h-4 text-violet-700" />
            <div>
              <div className="text-[10px] font-bold text-violet-800 uppercase">ባለቤት</div>
              <div className="text-sm font-black font-mono text-violet-950">{superAdminCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {params.error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-900 shadow-2xs"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{params.error}</span>
        </div>
      )}
      {params.success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{params.success}</span>
        </div>
      )}

      {/* 2. CREATE ACCOUNT FORM WITH ROLE DROPDOWN & PASSWORD VISIBILITY TOGGLE */}
      <CreateUserForm />

      {/* 3. REGISTERED ACCOUNTS LIST */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">የተመዘገቡ መለያዎች ዝርዝር</h2>
            <p className="text-xs text-slate-400">በሲስተሙ ላይ የሚገኙ ባለቤቶች፣ ስራ አስኪያጆች እና አስተዳዳሪዎች</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {profiles?.length || 0} መለያዎች
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {(profiles || []).map((profile) => {
            const isMe = profile.id === currentUser?.id;
            const isSuper = profile.role === 'super_admin';
            const metaRole = roleById.get(profile.id);
            const isManager = !isSuper && metaRole === 'manager';
            const email = emailById.get(profile.id) || 'Email unavailable';

            return (
              <div key={profile.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSuper
                        ? 'bg-violet-100 text-violet-800'
                        : isManager
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isSuper ? (
                      <Crown className="w-5 h-5" />
                    ) : isManager ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Layers className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {profile.display_name || 'ያልተሰየመ'}
                      </p>
                      {isMe && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
                          እርስዎ
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-mono text-slate-500 mt-0.5">{email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold font-mono ${
                      isSuper
                        ? 'bg-violet-100 text-violet-800 border border-violet-200'
                        : isManager
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {isSuper
                      ? 'ዋና ባለቤት'
                      : isManager
                      ? 'ስራ አስኪያጅ'
                      : 'አስተዳዳሪ'}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      profile.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {profile.is_active ? 'ንቁ' : 'ቦዝኗል'}
                  </span>
                </div>
              </div>
            );
          })}
          {!profiles?.length && (
            <p className="p-8 text-center text-sm text-slate-400">ምንም መለያ አልተገኘም።</p>
          )}
        </div>
      </section>
    </div>
  );
}
