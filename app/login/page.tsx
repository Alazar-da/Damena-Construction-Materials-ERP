 'use client';

import { login } from './actions';
import { HardHat, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [mode, setMode] = useState<'login' | 'help' | 'setup'>('login');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup') === 'help') setMode('help');
    if (params.get('error') === 'credentials') setError('ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም።');
    if (params.get('setup') !== '1') return;
    setMode('setup');
    let active = true;
    const verify = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && active) setError('አገናኙ ጊዜው አልፎበታል። አዲስ አገናኝ ይጠይቁ።');
      } else {
        const tokens = new URLSearchParams(window.location.hash.slice(1));
        const access_token = tokens.get('access_token'); const refresh_token = tokens.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError && active) setError('የኢሜይል ማረጋገጫው አልተሳካም።');
          window.history.replaceState({}, document.title, `${window.location.pathname}?setup=1`);
        }
      }
      const { data } = await supabase.auth.getSession();
      if (active) { setReady(Boolean(data.session)); if (!data.session) setError((current) => current || 'አገናኙ ትክክል አይደለም ወይም ጊዜው አልፎበታል።'); }
    };
    void verify();
    return () => { active = false; };
  }, [supabase]);

  const sendReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPending(true); setError(''); setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login?setup=1` });
    setPending(false);
    if (resetError) setError('ኢሜይሉን መላክ አልተቻለም። እባክዎ ያረጋግጡና ይሞክሩ።');
    else setNotice('የይለፍ ቃል ማዘጋጃ አገናኝ ከተላከ ኢሜይልዎን ይመልከቱ።');
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError('የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች መሆን አለበት።'); return; }
    if (password !== confirm) { setError('የይለፍ ቃሎቹ አይዛመዱም።'); return; }
    setPending(true); const { error: updateError } = await supabase.auth.updateUser({ password }); setPending(false);
    if (updateError) { setError('የይለፍ ቃሉን ማስቀመጥ አልተቻለም።'); return; }
    router.replace('/app');
  };
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 mb-3 shadow-md">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-white">DAMENA ERP</h1>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">{mode === 'setup' ? 'የይለፍ ቃል ይፍጠሩ' : mode === 'help' ? 'የይለፍ ቃል ያዘጋጁ' : 'ግባ'}</h2>

          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-rose-900 bg-rose-950/60 px-3 py-2.5 text-xs leading-relaxed text-rose-200">
              ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም። እባክዎ ያረጋግጡና እንደገና ይሞክሩ።
            </p>
          )}

          {mode === 'login' && <form action={login} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">ኢሜይል</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
                  name="email"
                  type="email"
                  placeholder="operator@damena.et"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">የይለፍ ቃል</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              <span>ግባ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>}
          {mode === 'login' && <div className="mt-4 text-center">
            <Link href="/login?setup=help" className="text-xs font-medium text-sky-300 hover:text-sky-200 underline underline-offset-4">
              የይለፍ ቃል ያልዎትም? አዲስ ያዘጋጁ / ይቀይሩ
            </Link>
          </div>}
          {mode === 'help' && <form onSubmit={sendReset} className="space-y-3"><p className="text-xs text-slate-400">ኢሜይልዎን ያስገቡ፤ የይለፍ ቃል ማዘጋጃ አገናኝ እንልክልዎታለን።</p><input className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ኢሜይል አድራሻ" />{notice && <p className="text-xs text-emerald-300">{notice}</p>}<button disabled={pending} className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold">{pending ? 'በመላክ ላይ…' : 'አገናኙን ላክ'}</button><button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full text-xs text-sky-300">ወደ መግቢያ ተመለስ</button></form>}
          {mode === 'setup' && <div>{!ready ? <p className="text-xs text-sky-300">አገናኙን በማረጋገጥ ላይ…</p> : <form onSubmit={savePassword} className="space-y-3"><p className="text-xs text-slate-400">አዲስ የይለፍ ቃል ይምረጡ (ቢያንስ 8 ቁምፊዎች)።</p><input className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="አዲስ የይለፍ ቃል" /><input className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white" type="password" minLength={8} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="ደግመው ያስገቡ" /><button disabled={pending} className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold">{pending ? 'በማስቀመጥ ላይ…' : 'የይለፍ ቃሉን አስቀምጥ'}</button></form>}</div>}
          {mode !== 'login' && <div className="mt-4 text-center"><button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="text-xs text-slate-400 underline">ወደ መግቢያ ተመለስ</button></div>}
        </div>
      </div>
    </main>
  );
}
