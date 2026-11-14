import Link from 'next/link';
import { HardHat, Boxes, Factory, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white">
            <HardHat className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-wider text-white font-mono">DAMENA ERP</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            ግባ
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
          >
            <span>የስራ ክፍሉን ክፈት</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          የግንባታ ስራዎች እና ክምችት
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          የሲሚንቶ ክምችትን ያስተዳድሩ፣ ዕለታዊ የኮንክሪት ብሎክ ምርትን ይከታተሉ፣ የደንበኛ ሽያጭና አገልግሎትን ይመዝግቡ።
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <span>ዳሽቦርዱን ክፈት</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/app/stock"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            <Boxes className="w-4 h-4 text-sky-400" />
            <span>የሲሚንቶ መጋዘን</span>
          </Link>
        </div>

        {/* Quick modules */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <Boxes className="w-5 h-5 text-sky-400 mb-2" />
            <h3 className="text-sm font-bold text-white">የሲሚንቶ መጋዘን</h3>
            <p className="text-xs text-slate-400 mt-1">የደረሱ ሲሚንቶዎችን ይቀበሉ፣ ለፈረቃዎች ከረጢት ያውጡ።</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <Factory className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-white">ምርት</h3>
            <p className="text-xs text-slate-400 mt-1">የተመረቱ ብሎኮችንና ቴራሶን ይመዝግቡ።</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <ShoppingCart className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-white">ሽያጭ እና አገልግሎቶች</h3>
            <p className="text-xs text-slate-400 mt-1">ደረሰኞችን፣ የባትሪ እና የብየዳ ክፍያዎችን ይመዝግቡ።</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        DAMENA የግንባታ እቃዎች አስተዳደር
      </footer>
    </main>
  );
}
