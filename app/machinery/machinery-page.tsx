'use client';

/* eslint-disable @next/next/no-img-element -- signed Supabase URLs are rendered as private runtime images. */
import React, { useState, useRef } from 'react';
import { addMachinery, updateMachinery, deleteMachinery } from './actions';
import {
  AlertCircle,
  CheckCircle2,
  Cog,
  Plus,
  Minus,
  Camera,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Search,
  MapPin,
  FileText,
} from 'lucide-react';

export type Machinery = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  location: string | null;
  notes: string | null;
  photo_url: string | null;
  photo_path?: string | null;
  created_at: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('am-ET', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
};

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  available: {
    label: 'በስራ ላይ ዝግጁ',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  in_use: {
    label: 'በስራ ላይ ያለ',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  maintenance: {
    label: 'በጥገና ላይ',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  out_of_service: {
    label: 'ከስራ ውጪ',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  production: 'የምርት ማሽን',
  tool: 'የእጅ መሳሪያ',
  vehicle: 'ተሽከርካሪ',
  other: 'ሌላ',
};

export default function MachineryPage({
  machinery,
  returnTo,
  title,
  description,
  searchParams,
}: {
  machinery: Machinery[];
  returnTo: '/owner/machinery' | '/manager/machinery';
  title: string;
  description: string;
  searchParams: { error?: string; success?: string };
}) {
  const [quantity, setQuantity] = useState<string>('1');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<{ url: string; name: string } | null>(null);
  const [showMachineryList, setShowMachineryList] = useState(true);
  const [editingItem, setEditingItem] = useState<Machinery | null>(null);
  const [deletingItem, setDeletingItem] = useState<Machinery | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalUnits = machinery.reduce((sum, item) => sum + Number(item.quantity), 0);

  // Filtered machinery list based on search and status
  const filteredMachinery = machinery.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMachinery.length / PAGE_SIZE));
  const pagedMachinery = filteredMachinery.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stepQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
              የማሽነሪና መሳሪያዎች ቁጥጥር
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Count Badge */}
        <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Cog className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">ጠቅላላ ማሽኖች</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              {machinery.length}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">
                ({totalUnits.toLocaleString('en-US')} ክፍሎች)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {searchParams.success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs animate-in fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{searchParams.success}</span>
        </div>
      )}
      {searchParams.error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-900 shadow-2xs animate-in fade-in"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{searchParams.error}</span>
        </div>
      )}

      {/* 2. REGISTRATION FORM (CREATE) */}
      <form
        action={addMachinery}
        encType="multipart/form-data"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-5"
      >
        <input type="hidden" name="return_to" value={returnTo} />

        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">አዲስ ማሽን መዝግብ</h2>
              <p className="text-xs text-slate-400">የማሽኑን ስም፣ ብዛት እና ዝርዝር ሁኔታ ያስገቡ</p>
            </div>
          </div>
        </div>

        {/* 1. Name & Quantity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Name (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              የማሽኑ ስም <span className="text-rose-500">*</span>
            </label>
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="erp-input h-12 px-4 text-sm font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
              placeholder="ለምሳሌ፦ የብሎኬት ማሽን፣ ቪብሬተር፣ ሚክሰር፣ ፎርክሊፍት..."
              autoFocus
            />
          </div>

          {/* Category (2 cols) */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              ዓይነት
            </label>
            <select
              name="category"
              defaultValue="production"
              className="erp-input h-12 px-3 text-xs font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
            >
              <option value="production">የምርት ማሽን</option>
              <option value="tool">የእጅ መሳሪያ</option>
              <option value="vehicle">ተሽከርካሪ</option>
              <option value="other">ሌላ</option>
            </select>
          </div>

          {/* Quantity Stepper (3 cols) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              ብዛት <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => stepQuantity(-1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onWheel={(e) => {
                  e.currentTarget.blur();
                  e.preventDefault();
                }}
                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-base text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
              <button
                type="button"
                onClick={() => stepQuantity(1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Status & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              የማሽኑ የስራ ሁኔታ
            </label>
            <select
              name="status"
              defaultValue="available"
              className="erp-input h-11 px-3 text-xs font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
            >
              <option value="available">🟢 በስራ ላይ ዝግጁ</option>
              <option value="in_use">🔵 በስራ ላይ ያለ</option>
              <option value="maintenance">🟡 በጥገና ላይ</option>
              <option value="out_of_service">🔴 ከስራ ውጪ</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              የሚገኝበት ቦታ / ሰራተኛ (አማራጭ)
            </label>
            <input
              name="location"
              className="erp-input h-11 px-3 text-xs text-slate-900 w-full placeholder:text-slate-400"
              placeholder="ለምሳሌ፦ የምርት ክፍል 1፣ ወርክሾፕ፣ ጋራዥ..."
            />
          </div>
        </div>

        {/* 3. Photo Upload with Live Preview */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span>የማሽኑ ፎቶ</span>
            <span className="text-[10px] text-slate-400 font-normal lowercase">(አማራጭ)</span>
          </label>

          {photoPreview ? (
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden bg-white shrink-0">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">ፎቶ ተመርጧል</span>
                  <span className="text-[10px] text-slate-400 font-mono">ለመቀየር አዲስ ፎቶ ይምረጡ</span>
                </div>
              </div>
              <button
                type="button"
                onClick={removePhoto}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                ፎቶ አስወግድ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <input
                ref={fileInputRef}
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                JPG፣ PNG፣ WebP (ከ5MB በታች)
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ማሽኑን መዝግብ</span>
          </button>
        </div>
      </form>

      {/* 3. REGISTERED MACHINERY SECTION (READ, UPDATE, DELETE) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>የተመዘገቡ ማሽኖች ዝርዝር</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {filteredMachinery.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">ማሽኖችን ይመልከቱ፣ መረጃቸውን ያሻሽሉ ወይም ያስወግዱ</p>
          </div>

          {/* Toggle List Visibility Button */}
          <button
            type="button"
            onClick={() => setShowMachineryList(!showMachineryList)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
          >
            {showMachineryList ? 'ዝርዝር ደብቅ' : 'ዝርዝር አሳይ'}
          </button>
        </div>

        {showMachineryList && (
          <div className="space-y-4">
            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ማሽን በስም ወይም በቦታ ፈልግ..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {[
                  { id: 'all', label: 'ሁሉም' },
                  { id: 'available', label: 'ዝግጁ' },
                  { id: 'in_use', label: 'በስራ ላይ' },
                  { id: 'maintenance', label: 'ጥገና' },
                  { id: 'out_of_service', label: 'ከስራ ውጪ' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Machinery Cards Grid */}
            {filteredMachinery.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedMachinery.map((item) => {
                    const statusInfo = STATUS_META[item.status] || STATUS_META.available;
                    const categoryLabel = CATEGORY_LABELS[item.category] || 'ማሽን';

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all p-4 flex flex-col justify-between gap-3 group"
                      >
                        {/* Top: Photo & Info */}
                        <div className="flex items-start gap-3">
                          {/* Photo */}
                          {item.photo_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedImageModal({ url: item.photo_url!, name: item.name })
                              }
                              className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer group-hover:scale-102 transition-transform shadow-2xs"
                              title="ፎቶውን አጉልተህ እይ"
                            >
                              <img
                                src={item.photo_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                              <Cog className="w-7 h-7 text-slate-400" />
                            </div>
                          )}

                          {/* Meta */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                                {categoryLabel}
                              </span>
                              <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                {Number(item.quantity).toLocaleString()} ክፍል
                              </span>
                            </div>

                            <h3 className="font-black text-sm text-slate-900 truncate" title={item.name}>
                              {item.name}
                            </h3>

                            {/* Status Pill */}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Location / Notes Details */}
                        {(item.location || item.notes) && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                            {item.location && (
                              <div className="flex items-center gap-1 truncate text-slate-700 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="flex items-center gap-1 truncate text-slate-500">
                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.notes}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bottom: Date & CRUD Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(item.created_at)}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="የማሽኑን መረጃ አሻሽል"
                            >
                              <Pencil className="w-3 h-3 text-sky-600" />
                              <span>አስተካክል</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                              title="ማሽኑን ሰርዝ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200/80">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>ቀዳሚ</span>
                    </button>
                    <span className="text-xs font-semibold font-mono text-slate-700 px-2">
                      ገጽ {page} ከ {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <span>ቀጣይ</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <Cog className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  {searchQuery || statusFilter !== 'all' ? 'የተፈለገው ማሽን አልተገኘም' : 'እስካሁን ምንም ማሽን አልተመዘገበም'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          EDIT MACHINERY MODAL (UPDATE)
      ========================================================================= */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                <h3 className="font-black text-base text-slate-900">የማሽን መረጃ አሻሽል</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={updateMachinery} encType="multipart/form-data" className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={editingItem.id} />
              <input type="hidden" name="existing_photo_path" value={editingItem.photo_path || ''} />

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  የማሽኑ ስም <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  className="erp-input h-11 px-3 text-sm font-bold text-slate-900 w-full"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    ዓይነት
                  </label>
                  <select
                    name="category"
                    defaultValue={editingItem.category || 'other'}
                    className="erp-input h-11 px-2.5 text-xs font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="production">የምርት ማሽን</option>
                    <option value="tool">የእጅ መሳሪያ</option>
                    <option value="vehicle">ተሽከርካሪ</option>
                    <option value="other">ሌላ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    የስራ ሁኔታ
                  </label>
                  <select
                    name="status"
                    defaultValue={editingItem.status || 'available'}
                    className="erp-input h-11 px-2.5 text-xs font-bold text-slate-900 w-full bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="available">🟢 በስራ ላይ ዝግጁ</option>
                    <option value="in_use">🔵 በስራ ላይ ያለ</option>
                    <option value="maintenance">🟡 በጥገና ላይ</option>
                    <option value="out_of_service">🔴 ከስራ ውጪ</option>
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  ብዛት <span className="text-rose-500">*</span>
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={editingItem.quantity}
                  required
                  className="erp-input h-11 px-3 font-mono font-bold text-sm text-slate-900 w-full"
                />
              </div>

              {/* Location & Notes */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  የሚገኝበት ቦታ (አማራጭ)
                </label>
                <input
                  name="location"
                  defaultValue={editingItem.location || ''}
                  className="erp-input h-10 px-3 text-xs text-slate-900 w-full"
                  placeholder="ለምሳሌ፦ የምርት ክፍል 1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  ማስታወሻ (አማራጭ)
                </label>
                <input
                  name="notes"
                  defaultValue={editingItem.notes || ''}
                  className="erp-input h-10 px-3 text-xs text-slate-900 w-full"
                  placeholder="ተጨማሪ መግለጫ..."
                />
              </div>

              {/* Photo Change Option */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  ፎቶ ቀይር (አማራጭ)
                </label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  ለውጦችን መዝግብ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL (DELETE)
      ========================================================================= */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-base text-slate-900">ይህ ማሽን ይሰረዝ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>&quot;{deletingItem.name}&quot;</strong> ከመዝገብ ላይ በቋሚነት ይጠፋል። ይህ እርምጃ ሊመለስ አይችልም።
              </p>
            </div>

            <form action={deleteMachinery} className="flex items-center justify-center gap-2 pt-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={deletingItem.id} />
              <input type="hidden" name="photo_path" value={deletingItem.photo_path || ''} />

              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ተመለስ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                አዎ፣ ሰርዝ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX PHOTO MODAL
      ========================================================================= */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-3 space-y-2 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {selectedImageModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedImageModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedImageModal.url}
                alt={selectedImageModal.name}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
