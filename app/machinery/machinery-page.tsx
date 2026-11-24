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
} from 'lucide-react';

export type Machinery = {
  id: string;
  name: string;
  quantity: number;
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
  const [editingItem, setEditingItem] = useState<Machinery | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [deletingItem, setDeletingItem] = useState<Machinery | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalUnits = machinery.reduce((sum, item) => sum + Number(item.quantity), 0);

  const filteredMachinery = machinery.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredMachinery.length / PAGE_SIZE));
  const pagedMachinery = filteredMachinery.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stepQuantity = (delta: number) => {
    const current = Number(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const stepEditQuantity = (delta: number) => {
    const current = Number(editQuantity) || 0;
    const next = Math.max(1, current + delta);
    setEditQuantity(String(next));
  };

  const openEditModal = (item: Machinery) => {
    setEditingItem(item);
    setEditQuantity(String(item.quantity));
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
              የማሽነሪና መሳሪያዎች ክምችት
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

      {/* 2. REGISTRATION FORM (CREATE: ONLY NAME, QUANTITY & OPTIONAL PHOTO) */}
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
              <p className="text-xs text-slate-400">የማሽኑን ስም እና ብዛት ብቻ ያስገቡ</p>
            </div>
          </div>
        </div>

        {/* Name & Quantity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Name (8 cols) */}
          <div className="md:col-span-8 space-y-1.5">
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

          {/* Quantity Stepper (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              ብዛት <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
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

        {/* Photo Upload with Live Preview */}
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

      {/* 3. REGISTERED MACHINERY LIST */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>የተመዘገቡ ማሽኖች</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {filteredMachinery.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">ማሽኖችን በስም ወይም በብዛት ያሻሽሉ ወይም ያስወግዱ</p>
          </div>

          {/* Search by Name */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="ማሽን በስም ፈልግ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {filteredMachinery.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedMachinery.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all p-4 flex flex-col justify-between gap-3"
                >
                  {/* Top: Photo & Info */}
                  <div className="flex items-center gap-3">
                    {/* Photo */}
                    {item.photo_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageModal({ url: item.photo_url!, name: item.name })
                        }
                        className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:scale-105 transition-transform"
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

                    {/* Name & Quantity */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <div className="mt-1">
                        <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                          {Number(item.quantity).toLocaleString()} ክፍል
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Date & Actions (EDIT NAME/NUMBER & REMOVE ONLY) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(item.created_at)}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="ስም ወይም ብዛት አስተካክል"
                      >
                        <Pencil className="w-3 h-3 text-sky-600" />
                        <span>አስተካክል</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ማሽኑን አስወግድ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              {searchQuery ? 'የተፈለገው ማሽን አልተገኘም' : 'እስካሁን ምንም ማሽን አልተመዘገበም'}
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          EDIT MODAL: ONLY NAME & NUMBER/QUANTITY
      ========================================================================= */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                <h3 className="font-black text-base text-slate-900">የማሽን ስም እና ብዛት ቀይር</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={updateMachinery} className="space-y-4">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={editingItem.id} />

              {/* 1. Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  የማሽኑ ስም <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  minLength={2}
                  maxLength={120}
                  className="erp-input h-11 px-3 text-sm font-bold text-slate-900 w-full"
                />
              </div>

              {/* 2. Number / Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  ብዛት (ቁጥር) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepEditQuantity(-1)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                    className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-base text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => stepEditQuantity(1)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
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
          DELETE MODAL: REMOVE CONFIRMATION
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
              <h3 className="font-black text-base text-slate-900">ይህ ማሽን ይወገድ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>&quot;{deletingItem.name}&quot;</strong> ከመዝገብ ላይ በቋሚነት ይጠፋል።
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
                አዎ፣ አስወግድ
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
