'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { login } from '@/app/login/actions';
import {
  HardHat,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Layers,
  Crown,
} from 'lucide-react';

type PortalRole = 'admin' | 'manager' | 'owner';

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.SUPABASE_URL ||
          'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          'placeholder-anon-key'
      ),
    []
  );

  const [mode, setMode] = useState<'login' | 'forgot' | 'setup'>('login');
  const [portal, setPortal] = useState<PortalRole>('admin');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      if (err === 'credentials' || err.toLowerCase().includes('invalid login credentials')) {
        setError('የተሳሳተ ኢሜይል ወይም የይለፍ ቃል።');
      } else if (err === 'missing_env') {
        setError('የሲስተም ችግር፡ በ Vercel ላይ Supabase Environment Variables አልተዋቀሩም። እባክዎ በ Vercel Settings > Environment Variables ላይ NEXT_PUBLIC_SUPABASE_URL እና NEXT_PUBLIC_SUPABASE_ANON_KEY ያስገቡ።');
      } else if (err === 'connection') {
        setError('ከ Supabase ዳታቤዝ ጋር መገናኘት አልተቻለም። እባክዎ የ Vercel Environment Variables በትክክል መሞላታቸውን ያረጋግጡ።');
      } else {
        setError(`የመግባት ስህተት: ${decodeURIComponent(err)}`);
      }
    }
    const p = params.get('portal')?.toLowerCase();
    if (p === 'manager' || p === 'owner' || p === 'admin') {
      setPortal(p);
    }
    if (params.get('setup') === 'help') {
      setMode('forgot');
    }
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
        const access_token = tokens.get('access_token');
        const refresh_token = tokens.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError && active) setError('የኢሜይል ማረጋገጫው አልተሳካም።');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      const { data } = await supabase.auth.getSession();
      if (active) {
        setReady(Boolean(data.session));
        if (!data.session) {
          setError((curr) => curr || 'አገናኙ ትክክል አይደለም ወይም ጊዜው አልፎበታል።');
        }
      }
    };

    void verify();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError('');
    setNotice('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/?setup=1`,
      });

      if (resetError) {
        setError('ኢሜይሉን መላክ አልተቻለም። እባክዎ ያረጋግጡ።');
      } else {
        setNotice('የይለፍ ቃል ማዘጋጃ አገናኝ ወደ ኢሜይልዎ ተልኳል።');
      }
    } catch {
      setError('ያልተጠበቀ ስህተት አጋጥሟል።');
    } finally {
      setPending(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች መሆን አለበት።');
      return;
    }
    if (password !== confirmPassword) {
      setError('የይለፍ ቃሎቹ አይዛመዱም።');
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError('የይለፍ ቃሉን ማስቀመጥ አልተቻለም።');
      return;
    }

    router.replace('/app');
  };

  const handlePortalChange = (nextPortal: PortalRole) => {
    setPortal(nextPortal);
    setError('');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', nextPortal);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] blur-[140px] rounded-full pointer-events-none transition-colors duration-500 ${
          portal === 'admin'
            ? 'bg-sky-500/10'
            : portal === 'manager'
            ? 'bg-amber-500/10'
            : 'bg-violet-500/10'
        }`}
      />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-amber-500 shadow-xl shadow-sky-950/60 ring-4 ring-slate-900">
            <HardHat className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">
            DAMENA ERP
          </h1>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-900/80 bg-rose-950/60 p-3 text-xs text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-900/80 bg-emerald-950/60 p-3 text-xs text-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* =========================================================================
              LOGIN MODE
          ========================================================================= */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Segmented 3-Way Portal Selector */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handlePortalChange('admin')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      portal === 'admin'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">አስተዳዳሪ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePortalChange('manager')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      portal === 'manager'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-950/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ስራ አስኪያጅ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePortalChange('owner')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      portal === 'owner'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-950/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ባለቤት</span>
                  </button>
                </div>

                {/* Portal Destination Hint Box */}
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    portal === 'admin'
                      ? 'border-sky-900/60 bg-sky-950/30 text-sky-200'
                      : portal === 'manager'
                      ? 'border-amber-900/60 bg-amber-950/30 text-amber-200'
                      : 'border-violet-900/60 bg-violet-950/30 text-violet-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-sans">
                      {portal === 'admin'
                        ? 'የአስተዳዳሪ መግቢያ (Admin Portal)'
                        : portal === 'manager'
                        ? 'የስራ አስኪያጅ መግቢያ (Manager Portal)'
                        : 'የባለቤት መግቢያ (Super Admin / Owner)'}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60">
                      {portal === 'admin' ? '/app' : portal === 'manager' ? '/manager' : '/owner'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {portal === 'admin'
                      ? 'የእለት ተእለት ምርት፣ የሲሚንቶ መጋዘን፣ ሽያጭ እና ደመወዝ'
                      : portal === 'manager'
                      ? 'የፋብሪካው አጠቃላይ እይታ፣ የሽያጭ ዋጋዎች፣ ሪፖርቶች እና ማሽነሪ'
                      : 'ሙሉ የፋብሪካው የቁጥጥርና የፋይናንስ አስተዳደር ዳሽቦርድ'}
                  </p>
                </div>
              </div>

              <form action={login} className="space-y-4">
                <input type="hidden" name="portal" value={portal} />

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    ኢሜይል
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@damena.et"
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      የይለፍ ቃል
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                        setNotice('');
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                    >
                      የይለፍ ቃል ረሱ?
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button with role-based styling */}
                <button
                  type="submit"
                  className={`w-full h-11 mt-1 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                    portal === 'admin'
                      ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/60'
                      : portal === 'manager'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/60'
                      : 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/60'
                  }`}
                >
                  <span>
                    {portal === 'admin'
                      ? 'ወደ አስተዳዳሪ ፖርታል ግባ'
                      : portal === 'manager'
                      ? 'ወደ ስራ አስኪያጅ ፖርታል ግባ'
                      : 'ወደ ባለቤት ፖርታል ግባ'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              FORGOT PASSWORD MODE
          ========================================================================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">የይለፍ ቃል ማደሻ</h2>
                <p className="text-xs text-slate-400">
                  የተመዘገቡበትን ኢሜይል ያስገቡ።
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  ኢሜይል
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@damena.et"
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                <span>{pending ? 'በመላክ ላይ…' : 'አገናኝ ላክ'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setNotice('');
                }}
                className="w-full py-1.5 inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ወደ መግቢያ ተመለስ</span>
              </button>
            </form>
          )}

          {/* =========================================================================
              SETUP NEW PASSWORD MODE
          ========================================================================= */}
          {mode === 'setup' && (
            <div>
              {!ready ? (
                <div className="text-center py-4 space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-sky-300">በማረጋገጥ ላይ…</p>
                </div>
              ) : (
                <form onSubmit={handleSetupPassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-white">አዲስ የይለፍ ቃል</h2>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">አዲስ የይለፍ ቃል</label>
                    <input
                      type="password"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="አዲስ የይለፍ ቃል"
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">ደግመው ያስገቡ</label>
                    <input
                      type="password"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="ደግመው ያስገቡ"
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    <span>{pending ? 'በማስቀመጥ ላይ…' : 'አስቀምጥ'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-slate-600 font-mono">
          © {new Date().getFullYear()} DAMENA ERP
        </p>
      </div>
    </main>
  );
}
