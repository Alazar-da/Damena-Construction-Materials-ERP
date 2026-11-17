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
  HardHat,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  ClipboardPenLine,
  Users,
} from 'lucide-react';
import { logout } from '@/app/login/actions';

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
  { href: '/owner/users', label: 'ተጠቃሚዎች', mobileLabel: 'ተጠቃሚዎች', icon: Users },
];

interface OwnerShellProps {
  children: React.ReactNode;
  userEmail?: string;
  displayName?: string;
}

export default function OwnerShell({ children, userEmail }: OwnerShellProps) {
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
          DESKTOP OWNER SIDEBAR - SIMPLE, CLEAN & DEDICATED
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-60'
        }`}
      >
        {/* Border rail toggle button */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          type="button"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-5 top-4 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Brand Header with Owner Badge */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800/60">
          <Link
            href="/owner"
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0">
              <HardHat className="w-4 h-4 text-slate-300" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                  DAMENA
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  የባለቤት ፖርታል
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Owner Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
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
                className={`group relative flex items-center rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                  isCollapsed ? 'h-11 w-11 mx-auto justify-center' : 'min-h-11 px-3 py-2 gap-3'
                } ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold border border-slate-800 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {isActive && !isCollapsed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Super Admin Badge, Staff App Switch & Logout */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {!isCollapsed && userEmail && (
            <div className="px-2.5 py-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ዋና አስተዳዳሪ</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono truncate mt-0.5" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <Link
              href="/app"
              className={`flex-1 flex items-center rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-900/60 p-2 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'gap-2.5'
              }`}
              title="ወደ ሰራተኞች መተግበሪያ ቀይር"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-slate-300 truncate">የሰራተኞች መተግበሪያ</span>
              )}
            </Link>

            {!isCollapsed && (
              <form action={logout}>
                <button
                  type="submit"
                  title="ውጣ"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200">
              <HardHat className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                የባለቤት ፖርታል
              </span>
            </div>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isActive
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

        {/* Drawer Footer with Super Admin identity */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ዋና አስተዳዳሪ</span>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate mt-0.5">{userEmail}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Link
              href="/app"
              className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>የሰራተኞች መተግበሪያ</span>
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>ውጣ</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN APPLICATION AREA
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-18' : 'md:pl-60'
        }`}
      >
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              type="button"
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="የአሰሳ ምናሌን ክፈት"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                {currentNav.label}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                ዋና አስተዳዳሪ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ተመለስ ወደ</span>
              <span>የሰራተኞች መተግበሪያ</span>
            </Link>
          </div>
        </header>

        {/* Main Content (pb-24 ensures bottom nav clearance on mobile) */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBILE OWNER BOTTOM NAVIGATION BAR
      ========================================================================= */}
      <nav
        aria-label="የባለቤት ሞባይል አሰሳ"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 md:hidden flex items-center justify-around px-2 py-1.5 shadow-lg shadow-black/5"
      >
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
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
              <span className="text-xs mt-1 tracking-tight leading-tight font-medium truncate">
                {item.mobileLabel || item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
