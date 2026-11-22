'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  Tag,
  ChartNoAxesCombined,
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  HardHat,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  ClipboardPenLine,
  Users,
  UserRound,
  Wrench,
  Bell,
  Crown,
} from 'lucide-react';
import { logout } from '@/app/login/actions';
import { HeaderSlotProvider, useHeaderSlot } from '@/components/header-slot-context';

interface OwnerNavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ownerNavItems: OwnerNavItem[] = [
  { href: '/owner', label: 'አጠቃላይ እይታ', mobileLabel: 'አጠቃላይ', icon: TrendingUp },
  { href: '/owner/prices', label: 'ዋጋዎች', mobileLabel: 'ዋጋ', icon: Tag },
  { href: '/owner/reports', label: 'ሪፖርቶች', mobileLabel: 'ሪፖርት', icon: ChartNoAxesCombined },
  { href: '/owner/records', label: 'መዝገቦችን አስተዳድር', mobileLabel: 'መዝገቦች', icon: ClipboardPenLine },
  { href: '/owner/users', label: 'ስራ አስኪያጅና ተጠቃሚዎች', mobileLabel: 'አስኪያጅ', icon: Users },
  { href: '/owner/machinery', label: 'ማሽነሪ', mobileLabel: 'ማሽነሪ', icon: Wrench },
];

interface OwnerShellProps {
  children: React.ReactNode;
  userEmail?: string;
  displayName?: string;
}

export default function OwnerShell(props: OwnerShellProps) {
  return (
    <HeaderSlotProvider>
      <OwnerShellInner {...props} />
    </HeaderSlotProvider>
  );
}

function OwnerShellInner({ children, userEmail, displayName }: OwnerShellProps) {
  const { headerCenter, headerRight } = useHeaderSlot();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const currentNav =
    ownerNavItems.find((item) =>
      item.href === '/owner' ? pathname === '/owner' : pathname.startsWith(item.href)
    ) || ownerNavItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* =========================================================================
          OWNER SIDEBAR
          - Tablet (md to xl): Fixed narrow w-20 icon-rail
          - PC Desktop (xl+): Original collapsible sidebar (w-60 / w-18) with toggle
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out md:max-xl:w-20 ${
          isCollapsed ? 'xl:w-18' : 'xl:w-60'
        }`}
      >
        {/* PC-ONLY: Border rail toggle button (hidden on tablet) */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          type="button"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden xl:flex absolute -right-5 top-4 z-50 items-center justify-center w-11 h-11 rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Brand Header */}
        <div className="flex items-center h-16 border-b border-slate-800/60 md:max-xl:justify-center xl:px-4">
          <Link
            href="/owner"
            className={`flex items-center gap-2.5 overflow-hidden transition-all md:max-xl:justify-center ${
              isCollapsed ? 'xl:justify-center xl:w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0">
              <HardHat className="w-4 h-4 text-slate-300" />
            </div>

            <div className={`min-w-0 hidden md:max-xl:hidden ${isCollapsed ? 'xl:hidden' : 'xl:block'}`}>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                የባለቤት ፖርታል
              </span>
            </div>
          </Link>
        </div>

        {/* Owner Navigation Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar md:max-xl:px-2 md:max-xl:py-4 md:max-xl:space-y-2 xl:px-2.5 xl:py-4 xl:space-y-1">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`transition-all cursor-pointer ${
                  'md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:py-2.5 md:max-xl:px-1 md:max-xl:rounded-xl'
                } ${
                  'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:relative xl:group'
                } ${
                  isCollapsed ? 'xl:h-11 xl:w-11 xl:mx-auto xl:justify-center' : 'xl:min-h-11 xl:px-3 xl:py-2 xl:gap-3'
                } ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold border border-slate-800 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {isActive && !isCollapsed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 hidden xl:inline" />
                )}

                <Icon
                  className={`shrink-0 transition-colors ${
                    'md:max-xl:w-5 md:max-xl:h-5 xl:w-4 xl:h-4'
                  } ${
                    isActive ? 'text-emerald-400 xl:text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                <span className="text-[10px] mt-1 font-semibold text-center leading-tight truncate max-w-full hidden md:max-xl:inline">
                  {item.mobileLabel || item.label}
                </span>

                {!isCollapsed && (
                  <span className="truncate text-sm hidden xl:inline">{item.label}</span>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 hidden xl:block">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Staff switch, Profile, Logout */}
        <div className="border-t border-slate-800/60 md:max-xl:p-2 md:max-xl:space-y-2 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center xl:p-3 xl:space-y-2">
          <Link
            href="/owner/profile"
            className={`flex items-center rounded-lg text-slate-300 hover:bg-slate-900/60 hover:text-white transition-colors hidden xl:flex ${
              isCollapsed ? 'mx-auto h-11 w-11 justify-center' : 'min-h-11 gap-2.5 px-3'
            }`}
            title="የእኔ መገለጫ"
          >
            <UserRound className="h-4 w-4 text-blue-300" />
            {!isCollapsed && <span className="truncate text-sm font-semibold">መገለጫ</span>}
          </Link>

          <Link
            href="/app"
            title="የሰራተኞች መተግበሪያ"
            className={`transition-colors cursor-pointer ${
              'md:max-xl:w-14 md:max-xl:h-12 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:rounded-xl md:max-xl:text-slate-300 md:max-xl:hover:bg-slate-900/80'
            } ${
              'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:text-slate-300 xl:hover:text-white xl:hover:bg-slate-900/60 xl:p-2'
            } ${
              isCollapsed ? 'xl:justify-center' : 'xl:gap-2.5'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span className="text-[9px] mt-0.5 font-semibold md:max-xl:inline hidden">ሰራተኞች</span>
            {!isCollapsed && (
              <span className="font-semibold text-slate-200 truncate hidden xl:inline">የሰራተኞች መተግበሪያ</span>
            )}
          </Link>

          <form action={logout} className="w-full flex justify-center">
            <button
              type="submit"
              title="ውጣ"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900/60 transition-colors cursor-pointer flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2 text-xs text-slate-400 hidden xl:inline">ውጣ</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER
      ========================================================================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200">
              <HardHat className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-sm font-bold tracking-wider text-white font-mono">
              DAMENA
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${isActive
                  ? 'bg-slate-900 text-white font-semibold border border-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Drawer Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-violet-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>ዋና ባለቤት (Owner)</span>
              </div>
              <p className="text-sm text-slate-200 font-semibold truncate mt-0.5">
                {displayName || userEmail.split('@')[0]}
              </p>
            </div>
          )}

          <Link
            href="/owner/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <UserRound className="h-4 w-4 text-blue-300" />
            <span>መገለጫ</span>
          </Link>

          <Link
            href="/manager"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-amber-400 hover:bg-slate-900 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>የስራ አስኪያጅ ገጽ (/manager)</span>
          </Link>

          <Link
            href="/app"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>የሰራተኞች ገጽ (/app)</span>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ውጣ</span>
            </button>
          </form>
        </div>
      </aside>

      {/* =========================================================================
          MAIN APPLICATION AREA
          - Tablet (md to xl): Fixed padding-left md:max-xl:pl-20
          - PC Desktop (xl+): Collapsible padding-left xl:pl-60 or xl:pl-18
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out md:max-xl:pl-20 ${
          isCollapsed ? 'xl:pl-18' : 'xl:pl-60'
        }`}
      >
        {/* Sticky Top Header:
            - Tablet: Dark Slate theme, profile in header, bell
            - PC Desktop: Clean White Header with title and switch button */}
        <header
          className={`sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-3.5 sm:px-6 transition-colors ${
            'md:max-xl:bg-[#1e293b] md:max-xl:text-white md:max-xl:border-b md:max-xl:border-slate-800'
          } ${
            'xl:bg-white xl:text-slate-900 xl:border-b xl:border-slate-200 bg-white border-b border-slate-200'
          }`}
        >
          {/* Left Area */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              type="button"
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="የአሰሳ ምናሌን ክፈት"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Tablet Brand Display */}
            <div className="hidden md:max-xl:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-sm shadow-inner">
                D
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                {currentNav.label}
              </span>
            </div>

            {/* PC Nav Title */}
            <div className="flex items-center gap-2 md:max-xl:hidden">
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                {currentNav.label}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                ዋና አስተዳዳሪ
              </span>
            </div>
          </div>

          {/* TABLET-ONLY: Center Header Slot */}
          <div className="hidden md:max-xl:flex items-center justify-center flex-1 max-w-md mx-4">
            {headerCenter}
          </div>

          {/* TABLET-ONLY: Right Area with Profile & Bell */}
          <div className="hidden md:max-xl:flex items-center gap-2.5">
            {headerRight}

            <Link
              href="/owner/reports"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#1e293b]" />
            </Link>

            <Link
              href="/owner/profile"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-800 transition-all border border-slate-700 bg-slate-800/80 group"
              title={displayName || userEmail}
            >
              <div className="w-7 h-7 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {(displayName || userEmail || 'O').charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            </Link>
          </div>

          {/* Switch to Manager and Staff App Buttons */}
          <div className="flex items-center gap-2 md:max-xl:hidden">
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>የስራ አስኪያጅ ገጽ</span>
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ወደ </span>
              <span>የሰራተኞች ገጽ</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
