'use client';

import React, { useState, useRef, useEffect } from 'react';
import { addExpense, updateExpense, deleteExpense } from './actions';
import {
  AlertCircle,
  CheckCircle2,
  Receipt,
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Factory,
  Zap,
  Layers,
  Banknote,
  FileText,
} from 'lucide-react';

export type ExpenseCategory = 'production_materials' | 'workshop_services' | 'other';

export interface ExpenseRecord {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  item_name: string;
  amount: number;
  notes: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
}

const CATEGORY_META: Record<
  ExpenseCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    badge: string;
    dot: string;
    presets: string[];
  }
> = {
  production_materials: {
    label: 'ለቴራሶ እና ብሎኬት ምርት',
    shortLabel: 'ለምርት ግብዓት',
    description: 'ሲሚንቶ፣ አሸዋ፣ ኮሚቼ እና የምርት እቃዎች',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    presets: ['ሲሚንቶ', 'አሸዋ', 'ኮሚቼ'],
  },
  workshop_services: {
    label: 'ለወርክሾፕ እና ሌሎች አገልግሎቶች',
    shortLabel: 'ለአገልግሎት',
    description: 'የባትሪ አሲድ፣ የብየዳ ዘንግ እና መሰል ግብዓቶች',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    presets: ['የባትሪ አሲድ', 'የብየዳ ዘንግ'],
  },
  other: {
    label: 'ሌላ ወጪ',
    shortLabel: 'ሌላ',
    description: 'ትራንስፖርት፣ ጥገና፣ መብራት እና ሌሎች ወጪዎች',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    presets: ['ትራንስፖርት / ነዳጅ', 'የማሽን ጥገና', 'መብራት / ውሃ', 'ሌላ'],
  },
};

const formatCurrency = (val: number) =>
  `${Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ብር`;

export default function ExpensesPage({
  expenses,
  returnTo,
  title,
  description,
  searchParams,
  tableMissing = false,
}: {
  expenses: ExpenseRecord[];
  returnTo: '/manager/expenses' | '/owner/expenses';
  title: string;
  description: string;
  searchParams: { error?: string; success?: string };
  tableMissing?: boolean;
}) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
  const thisMonthPrefix = today.substring(0, 7);

  // Create Form State
  const [category, setCategory] = useState<ExpenseCategory>('production_materials');
  const [itemName, setItemName] = useState<string>('ሲሚንቶ');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>('');

  // List & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Edit / Delete Modal State
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ExpenseRecord | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Prevent mouse wheel scroll from altering amount input
  useEffect(() => {
    const el = amountInputRef.current;
    if (!el) return;
    const preventWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', preventWheel, { passive: false });
    return () => el.removeEventListener('wheel', preventWheel);
  }, []);

  const handleCategoryChange = (nextCategory: ExpenseCategory) => {
    setCategory(nextCategory);
    const defaultPreset = CATEGORY_META[nextCategory].presets[0];
    setItemName(defaultPreset === 'ሌላ' ? '' : defaultPreset);
  };

  // Summary Stats
  const todayTotal = expenses
    .filter((e) => e.expense_date === today)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthTotal = expenses
    .filter((e) => e.expense_date.startsWith(thisMonthPrefix))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const productionMonthTotal = expenses
    .filter((e) => e.expense_date.startsWith(thisMonthPrefix) && e.category === 'production_materials')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const otherMonthTotal = expenses
    .filter((e) => e.expense_date.startsWith(thisMonthPrefix) && e.category !== 'production_materials')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Filtered List
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.item_name.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activePresets = CATEGORY_META[category].presets;

  const relation = (val: ExpenseRecord['profiles']) => (Array.isArray(val) ? val[0] : val);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የወጪ እና ግዢ መመዝገቢያ (ስራ አስኪያጅ እና ባለቤት)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-slate-800" />
            <span>{title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Summary KPI Pills */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-2.5">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">የዛሬ ወጪ</span>
            <span className="text-sm sm:text-base font-black font-mono text-rose-950">
              {formatCurrency(todayTotal)}
            </span>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-300 uppercase block">የዚህ ወር ወጪ</span>
            <span className="text-sm sm:text-base font-black font-mono text-white">
              {formatCurrency(monthTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Table Missing Notice */}
      {tableMissing && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 font-semibold">
          የወጪ ዳታቤዝ ሰንጠረዥ (`public.expenses`) ገና አልተፈጠረም። እባክዎ `supabase/expenses_setup.sql` ን በSupabase SQL Editor ውስጥ ያስኪዱ።
        </div>
      )}

      {/* Alerts */}
      {searchParams.success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{searchParams.success}</span>
        </div>
      )}
      {searchParams.error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-900 shadow-2xs"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{searchParams.error}</span>
        </div>
      )}

      {/* Monthly Category Breakdown Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-950 block">ለቴራሶ እና ብሎኬት ምርት (የዚህ ወር)</span>
              <span className="text-[11px] text-blue-700">ሲሚንቶ፣ አሸዋ፣ ኮሚቼ</span>
            </div>
          </div>
          <span className="font-mono font-black text-sm text-blue-950">
            {formatCurrency(productionMonthTotal)}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 block">ለአገልግሎት እና ሌሎች (የዚህ ወር)</span>
              <span className="text-[11px] text-amber-700">የባትሪ አሲድ እና ሌሎች ወጪዎች</span>
            </div>
          </div>
          <span className="font-mono font-black text-sm text-amber-950">
            {formatCurrency(otherMonthTotal)}
          </span>
        </div>
      </div>

      {/* Main Dual-Pane Workstation on Desktop */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-6 items-start space-y-6 xl:space-y-0">
        {/* LEFT: EXPENSE ENTRY FORM (5 cols) */}
        <form
          action={addExpense}
          className="xl:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5"
        >
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="category" value={category} />

          <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">አዲስ ወጪ መዝግብ</h2>
              <p className="text-xs text-slate-400">ምድቡን፣ የተገዛውን እቃ እና የገንዘብ መጠን ያስገቡ</p>
            </div>
          </div>

          {/* Step 1: Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              1. የወጪው ምድብ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(['production_materials', 'workshop_services', 'other'] as ExpenseCategory[]).map((cat) => {
                const meta = CATEGORY_META[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/15 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {cat === 'production_materials' ? (
                        <Factory className="w-4 h-4" />
                      ) : cat === 'workshop_services' ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold block truncate">{meta.label}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {meta.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Quick Item Chips + Item Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              2. የተገዛው እቃ / የወጪው ዓይነት <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {activePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setItemName(preset === 'ሌላ' ? '' : preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    itemName === preset
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              name="item_name"
              required
              minLength={2}
              maxLength={120}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="erp-input h-11 px-3.5 text-sm font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
              placeholder="ለምሳሌ፦ ሲሚንቶ፣ አሸዋ፣ ኮሚቼ፣ የባትሪ አሲድ..."
            />
          </div>

          {/* Step 3: Money Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span>የገንዘብ መጠን (ብር) <span className="text-rose-500">*</span></span>
              </label>
              <input
                ref={amountInputRef}
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => {
                  e.currentTarget.blur();
                  e.preventDefault();
                }}
                className="erp-input h-11 px-3 font-mono font-black text-base text-slate-900 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>ቀን</span>
              </label>
              <input
                name="expense_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="erp-input h-11 px-3 font-mono text-xs font-bold text-slate-900 w-full"
              />
            </div>
          </div>

          {/* Step 4: Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>ማስታወሻ / ብዛት (አማራጭ)</span>
              <span className="text-[10px] text-slate-400 font-normal">አስፈላጊ ከሆነ ብቻ</span>
            </label>
            <input
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="erp-input h-11 px-3 text-xs text-slate-900 w-full placeholder:text-slate-400"
              placeholder="ለምሳሌ፦ 50 ከረጢት ሲሚንቶ ወይም 1 ሲኖ አሸዋ..."
            />
          </div>

          <button
            type="submit"
            disabled={tableMissing}
            className="w-full h-12 rounded-2xl bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400 stroke-[2.5]" />
            <span>ወጪውን መዝግብ</span>
          </button>
        </form>

        {/* RIGHT: EXPENSES HISTORY LEDGER (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>የወጪ መዝገብ ታሪክ</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {filteredExpenses.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">የተመዘገቡ ወጪዎችን ይመልከቱ፣ ያስተካክሉ ወይም ያስወግዱ</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="በእቃ ስም ፈልግ..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'ሁሉም' },
              { id: 'production_materials', label: 'ለምርት ግብዓት' },
              { id: 'workshop_services', label: 'ለአገልግሎት' },
              { id: 'other', label: 'ሌላ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.id as 'all' | ExpenseCategory);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Records List */}
          {filteredExpenses.length > 0 ? (
            <div className="space-y-2.5">
              {pagedExpenses.map((exp) => {
                const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
                const recorder = relation(exp.profiles)?.display_name;

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{exp.item_name}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <span>{meta.shortLabel}</span>
                        </span>
                      </div>

                      {exp.notes && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{exp.notes}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{exp.expense_date}</span>
                        </span>
                        {recorder && <span className="font-sans">በ {recorder}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl">
                        -{formatCurrency(exp.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem(exp)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                          title="አስተካክል"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(exp)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ሰርዝ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ቀዳሚ</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 px-2">
                    ገጽ {page} ከ {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>ቀጣይ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                {searchQuery || categoryFilter !== 'all'
                  ? 'የተፈለገው ወጪ አልተገኘም።'
                  : 'እስካሁን ምንም ወጪ አልተመዘገበም።'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT EXPENSE MODAL */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                <span>የወጪ መረጃ አሻሽል</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={updateExpense} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={editingItem.id} />

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">ምድብ</label>
                <select
                  name="category"
                  defaultValue={editingItem.category}
                  className="erp-input h-11 px-3 text-xs font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="production_materials">ለቴራሶ እና ብሎኬት ምርት</option>
                  <option value="workshop_services">ለወርክሾፕ እና ሌሎች አገልግሎቶች</option>
                  <option value="other">ሌላ ወጪ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">የእቃው / ወጪው ስም</label>
                <input
                  name="item_name"
                  defaultValue={editingItem.item_name}
                  required
                  className="erp-input h-11 px-3 text-sm font-bold text-slate-900 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">የገንዘብ መጠን (ብር)</label>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={editingItem.amount}
                    required
                    className="erp-input h-11 px-3 font-mono font-bold text-sm text-slate-900 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">ቀን</label>
                  <input
                    name="expense_date"
                    type="date"
                    defaultValue={editingItem.expense_date}
                    className="erp-input h-11 px-3 font-mono text-xs font-bold text-slate-900 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">ማስታወሻ (አማራጭ)</label>
                <input
                  name="notes"
                  defaultValue={editingItem.notes || ''}
                  className="erp-input h-10 px-3 text-xs text-slate-900 w-full"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  ለውጦችን አስቀምጥ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EXPENSE MODAL */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">ይህ ወጪ ይሰረዝ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>&quot;{deletingItem.item_name}&quot;</strong> ({formatCurrency(deletingItem.amount)}) ከመዝገብ ላይ ይጠፋል።
              </p>
            </div>
            <form action={deleteExpense} className="flex items-center gap-2 pt-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={deletingItem.id} />
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer"
              >
                ተመለስ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                አዎ፣ ሰርዝ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
