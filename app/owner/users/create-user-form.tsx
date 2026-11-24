'use client';

import React, { useState } from 'react';
import { createAdmin } from './actions';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function CreateUserForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={createAdmin} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">አዲስ መለያ ፍጠር</h2>
            <p className="text-xs text-slate-400">የመለያውን ሚና በመምረጥ ኢሜይልና ይለፍ ቃል ይመዝግቡ</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* User Role Selection Dropdown */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>የመለያ ዓይነት / ሚና <span className="text-rose-500">*</span></span>
          </label>
          <select
            name="role"
            required
            defaultValue="manager"
            className="erp-input h-12 px-3.5 text-sm font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer focus:bg-white"
          >
            <option value="manager">💼 ስራ አስኪያጅ</option>
            <option value="admin">👷 አስተዳዳሪ</option>
          </select>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>የተጠቃሚው ሙሉ ስም <span className="text-rose-500">*</span></span>
          </label>
          <input
            name="display_name"
            required
            minLength={2}
            maxLength={120}
            className="erp-input h-11 px-3 text-sm font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
            placeholder="ለምሳሌ፦ አበበ ከበደ"
            autoFocus
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>ኢሜይል አድራሻ <span className="text-rose-500">*</span></span>
          </label>
          <input
            name="email"
            type="email"
            required
            className="erp-input h-11 px-3 text-sm font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
            placeholder="user@example.com"
          />
        </div>

        {/* Password with Eye View Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>የይለፍ ቃል <span className="text-rose-500">*</span></span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              autoComplete="new-password"
              required
              className="erp-input h-11 pl-3 pr-10 text-sm font-mono font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
              placeholder="ቢያንስ 8 ፊደላት ወይም ቁጥሮች"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md cursor-pointer"
              title={showPassword ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ'}
              aria-label={showPassword ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Confirm Password with Eye View Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>የይለፍ ቃሉን ደግመው ያረጋግጡ <span className="text-rose-500">*</span></span>
          </label>
          <div className="relative">
            <input
              name="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              minLength={8}
              autoComplete="new-password"
              required
              className="erp-input h-11 pl-3 pr-10 text-sm font-mono font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
              placeholder="የይለፍ ቃሉን ደግመው ያስገቡ"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md cursor-pointer"
              title={showConfirmPassword ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ'}
              aria-label={showConfirmPassword ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <button
          type="submit"
          className="erp-btn-primary px-6 py-2.5 text-sm font-black flex items-center justify-center gap-2 rounded-2xl shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>መለያውን ፍጠር</span>
        </button>
      </div>
    </form>
  );
}
