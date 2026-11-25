'use client';

import React, { useState, useRef, useEffect } from 'react';
import { addExpense, updateExpense, deleteExpense } from './actions';
import {
  AlertCircle,
  CheckCircle2,
  Receipt,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
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
    dot: string;
    presets: string[];
  }
> = {
  production_materials: {
    label: 'ለቴራሶ እና ብሎክ',
    shortLabel: 'ለምርት',
    dot: 'bg-blue-500',
    presets: ['ሲሚንቶ', 'አሸዋ', 'ኮሚቼ'],
  },
  workshop_services: {
    label: 'ለአገልግሎት',
    shortLabel: 'ለአገልግሎት',
    dot: 'bg-amber-500',
    presets: ['የባትሪ አሲድ', 'ብረት', 'ሌላ ወጪ'],
  },
  other: {
    label: 'ሌላ ወጪ',
    shortLabel: 'ሌላ',
    dot: 'bg-purple-500',
    presets: ['ሌላ ወጪ'],
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

  // Create Form State - 2 Sections only: 'production_materials' & 'workshop_services'
  const [category, setCategory] = useState<'production_materials' | 'workshop_services'>('production_materials');
  const [selectedPreset, setSelectedPreset] = useState<string>('ሲሚንቶ');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>('');

  // List & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'production_materials' | 'workshop_services'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Edit / Delete Modal State
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ExpenseRecord | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = amountInputRef.current;
    if (!el) return;
    const preventWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', preventWheel, { passive: false });
    return () => el.removeEventListener('wheel', preventWheel);
  }, []);

  const handleCategoryChange = (nextCategory: 'production_materials' | 'workshop_services') => {
    setCategory(nextCategory);
    const defaultPreset = CATEGORY_META[nextCategory].presets[0];
    setSelectedPreset(defaultPreset);
    setCustomItemName('');
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'ሌላ ወጪ') {
      setCustomItemName('');
    }
  };

  // Summary Stats
  const todayTotal = expenses
    .filter((e) => e.expense_date === today)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthTotal = expenses
    .filter((e) => e.expense_date.startsWith(thisMonthPrefix))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Filtered List
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'production_materials'
        ? e.category === 'production_materials'
        : e.category === 'workshop_services' || e.category === 'other';
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. MINIMAL HEADER + CLEAN KPI CARDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 block">የዛሬ ወጪ</span>
            <span className="text-base font-black font-mono text-slate-900">
              {formatCurrency(todayTotal)}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 block">የዚህ ወር ወጪ</span>
            <span className="text-base font-black font-mono text-rose-600">
              {formatCurrency(monthTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Table Missing Notice */}
      {tableMissing && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 font-medium">
          የወጪ ዳታቤዝ ሰንጠረዥ (`public.expenses`) ገና አልተፈጠረም። እባክዎ `supabase/expenses_setup.sql` ን በSupabase SQL Editor ውስጥ ያስኪዱ።
        </div>
      )}

      {/* Alerts */}
      {searchParams.success && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{searchParams.success}</span>
        </div>
      )}
      {searchParams.error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-900"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{searchParams.error}</span>
        </div>
      )}

      {/* 2. CLEAN DUAL-PANE WORKSPACE */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-6 items-start space-y-6 xl:space-y-0">
        {/* LEFT: MINIMAL ENTRY CARD (5 cols) */}
        <form
          action={addExpense}
          className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-5"
        >
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="category" value={category} />

          <h2 className="text-sm font-bold text-slate-900">አዲስ ወጪ መዝግብ</h2>

          {/* 2-Pill Category Segmented Control */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100">
            {(['production_materials', 'workshop_services'] as const).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Item Selection (Presets) + Conditional "ሌላ ወጪ" Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 block">የእቃው / ወጪው ዓይነት</label>
              {selectedPreset !== 'ሌላ ወጪ' && (
                <span className="text-[11px] font-medium text-slate-400">
                  የተመረጠ፦ <strong className="text-slate-800 font-bold">{selectedPreset}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {activePresets.map((preset) => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    <span className="truncate">{preset}</span>
                  </button>
                );
              })}
            </div>

            {/* If "ሌላ ወጪ" is chosen, prompt the user for the item name. Otherwise, no visible text input is needed */}
            {selectedPreset === 'ሌላ ወጪ' ? (
              <div className="pt-1.5 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  የወጪው ዓይነት ወይም ስም ምንድን ነው? <span className="text-rose-500">*</span>
                </label>
                <input
                  name="item_name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  autoFocus
                  className="erp-input h-11 px-3.5 text-sm font-semibold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="የወጪውን ዓይነት ወይም ስም እዚህ ያስገቡ..."
                />
              </div>
            ) : (
              <input type="hidden" name="item_name" value={selectedPreset} />
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">መጠን (ብር)</label>
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
                className="erp-input h-11 px-3 font-mono font-bold text-base text-slate-900 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">ቀን</label>
              <input
                name="expense_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="erp-input h-11 px-3 font-mono text-xs font-semibold text-slate-900 w-full"
              />
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              ማስታወሻ <span className="text-slate-400 font-normal">(አማራጭ)</span>
            </label>
            <input
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="erp-input h-10 px-3 text-xs text-slate-900 w-full placeholder:text-slate-400"
              placeholder="ለምሳሌ፦ 50 ከረጢት፣ 1 ሲኖ..."
            />
          </div>

          <button
            type="submit"
            disabled={tableMissing}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ወጪውን መዝግብ</span>
          </button>
        </form>

        {/* RIGHT: CLEAN HISTORY LIST (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">የወጪ ታሪክ</h2>
              <span className="text-xs font-mono font-semibold text-slate-400">
                ({filteredExpenses.length})
              </span>
            </div>

            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="ፈልግ..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Minimal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'ሁሉም' },
              { id: 'production_materials', label: 'ለቴራሶ እና ብሎክ' },
              { id: 'workshop_services', label: 'ለአገልግሎት' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.id as 'all' | 'production_materials' | 'workshop_services');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Clean Rows */}
          {filteredExpenses.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {pagedExpenses.map((exp) => {
                const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;

                return (
                  <div
                    key={exp.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {exp.item_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 pl-4">
                        <span className="font-mono">{exp.expense_date}</span>
                        <span>·</span>
                        <span>{meta.shortLabel}</span>
                        {exp.notes && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[180px] text-slate-500">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        -{formatCurrency(exp.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="አስተካክል"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ሰርዝ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>ቀዳሚ</span>
                  </button>
                  <span className="text-xs font-mono text-slate-500 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <span>ቀጣይ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Receipt className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">ወጪ አስተካክል</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={updateExpense} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={editingItem.id} />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">ምድብ</label>
                <select
                  name="category"
                  defaultValue={editingItem.category === 'other' ? 'workshop_services' : editingItem.category}
                  className="erp-input h-10 px-3 text-xs font-semibold text-slate-900 w-full bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="production_materials">ለቴራሶ እና ብሎክ</option>
                  <option value="workshop_services">ለአገልግሎት</option>
                  {editingItem.category === 'other' && <option value="other">ሌላ ወጪ</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">የእቃው / ወጪው ስም</label>
                <input
                  name="item_name"
                  defaultValue={editingItem.item_name}
                  required
                  className="erp-input h-10 px-3 text-sm font-semibold text-slate-900 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">መጠን (ብር)</label>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={editingItem.amount}
                    required
                    className="erp-input h-10 px-3 font-mono font-bold text-sm text-slate-900 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">ቀን</label>
                  <input
                    name="expense_date"
                    type="date"
                    defaultValue={editingItem.expense_date}
                    className="erp-input h-10 px-3 font-mono text-xs font-semibold text-slate-900 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">ማስታወሻ</label>
                <input
                  name="notes"
                  defaultValue={editingItem.notes || ''}
                  className="erp-input h-10 px-3 text-xs text-slate-900 w-full"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  አስቀምጥ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EXPENSE MODAL */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">ይህ ወጪ ይሰረዝ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>&quot;{deletingItem.item_name}&quot;</strong> ({formatCurrency(deletingItem.amount)}) በቋሚነት ይጠፋል።
              </p>
            </div>
            <form action={deleteExpense} className="flex items-center gap-2 pt-1">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={deletingItem.id} />
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ተመለስ
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
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
