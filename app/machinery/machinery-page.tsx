'use client';

/* eslint-disable @next/next/no-img-element -- signed Supabase URLs are rendered as private runtime images. */
import React, { useState, useRef } from 'react';
import { addMachinery } from './actions';
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
} from 'lucide-react';

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

export default function MachineryPage({
  machinery,
  returnTo,
  title,
  description,
  searchParams,
}: {
  machinery: Machinery[];
  returnTo: '/app/machinery' | '/owner/machinery' | '/manager/machinery';
  title: string;
  description: string;
  searchParams: { error?: string; success?: string };
}) {
  const [quantity, setQuantity] = useState<string>('1');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<{ url: string; name: string } | null>(null);
  const [showMachineryList, setShowMachineryList] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalUnits = machinery.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalPages = Math.max(1, Math.ceil(machinery.length / PAGE_SIZE));
  const pagedMachinery = machinery.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      {/* =========================================================================
          1. HEADER (CLEAN & MINIMAL)
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
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

      {/* =========================================================================
          2. REGISTRATION FORM (ONLY NAME, HOW MUCH & PHOTO)
      ========================================================================= */}
      <form
        action={addMachinery}
        encType="multipart/form-data"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-5"
      >
        <input type="hidden" name="return_to" value={returnTo} />
        <input type="hidden" name="status" value="available" />
        <input type="hidden" name="category" value="other" />

        <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">አዲስ ማሽን መዝግብ</h2>
            <p className="text-xs text-slate-400">ስም፣ ብዛት እና ፎቶ ብቻ ያስገቡ</p>
          </div>
        </div>

        {/* 1. Name & Quantity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Name (8 cols) */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              የማሽኑ ስም (Name) <span className="text-rose-500">*</span>
            </label>
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="erp-input h-12 px-4 text-sm font-bold text-slate-900 w-full placeholder:text-slate-400 placeholder:font-normal"
              placeholder="ለምሳሌ፦ የብሎኬት ማሽን፣ ቪብሬተር፣ ሚክሰር፣ መኪና..."
              autoFocus
            />
          </div>

          {/* How Much / Quantity (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              ብዛት (Quantity) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepQuantity(-1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer"
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
                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-base text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
              <button
                type="button"
                onClick={() => stepQuantity(1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Photo Upload with Live Preview */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span>ፎቶ (Photo)</span>
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
                JPG፣ PNG፣ WebP
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

      {/* =========================================================================
          3. REGISTERED MACHINERY (NAME, HOW MUCH & PHOTO ONLY)
      ========================================================================= */}
      {!showMachineryList ? (
        <div className="flex justify-center pt-2 pb-6">
          <button
            type="button"
            onClick={() => setShowMachineryList(true)}
            className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
          >
            <Cog className="w-4 h-4 text-slate-800" />
            <span>የተመዘገቡ ማሽኖችን አሳይ (Display Machines)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>የተመዘገቡ ማሽኖች</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {machinery.length}
                </span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowMachineryList(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ዝጋ (Close)</span>
            </button>
          </div>

        {machinery.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedMachinery.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-4 flex items-center justify-between gap-3"
                >
                  {/* Photo on left */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {item.photo_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageModal({ url: item.photo_url!, name: item.name })
                        }
                        className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer group"
                      >
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ) : (
                      <div className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                        <Cog className="w-7 h-7 text-slate-400" />
                      </div>
                    )}

                    {/* Name */}
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-slate-900 truncate">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(item.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  {/* How Much (Quantity) */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl block">
                      {Number(item.quantity).toLocaleString('en-US')} ክፍል
                    </span>
                  </div>
                </div>
              ))}
            </div>

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
            <p className="text-xs font-semibold text-slate-700">እስካሁን ምንም ማሽን አልተመዘገበም</p>
          </div>
        )}
      </div>
    )}

      {/* Lightbox Photo Zoom Modal */}
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
