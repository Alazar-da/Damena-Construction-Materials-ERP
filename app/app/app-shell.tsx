'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Factory,
  ShoppingCart,
  WalletCards,
  TrendingUp,
  ChevronLeft,
  Menu,
  X,
  HardHat,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { logout } from '@/app/login/actions';

interface NavItem {
  href: string;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/app', label: 'ዛሬ', mobileLabel: 'ዛሬ', icon: LayoutDashboard },
  { href: '/app/stock', label: 'የሲሚንቶ መጋዘን', mobileLabel: 'ሲሚንቶ', icon: Boxes },
  { href: '/app/production', label: 'ምርት', mobileLabel: 'ምርት', icon: Factory },
  { href: '/app/sales', label: 'ሽያጭ', mobileLabel: 'ሽያጭ', icon: ShoppingCart },
  { href: '/app/payroll', label: 'የደመወዝ ክፍያ', mobileLabel: 'ደመወዝ', icon: WalletCards },
];

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export default function AppShell({
  children,
  userEmail,
  isSuperAdmin = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('damena_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  // When pathname changes, turn off the loading bar immediately
  useEffect(() => {
    setNavigating(false);
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('damena_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const currentNav =
    navItems.find((item) =>
      item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href)
    ) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sleek Top Loading Indicator */}
      {navigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-200 overflow-hidden">
          <div className="w-full h-full bg-slate-900 animate-indeterminate" />
        </div>
      )}

      {/* =========================================================================
          STAFF SIDEBAR (DEDICATED TO DAILY OPERATIONS)
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-60'
        }`}
      >
        {/* Border rail toggle button */}
        <button
          onClick={toggleCollapsed}
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

        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800/60">
          <Link
            href="/app"
            onClick={() => {
              if (pathname !== '/app') setNavigating(true);
            }}
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0">
              <HardHat className="w-4 h-4 text-slate-300" />
            </div>

            {!isCollapsed && (
              <span className="text-sm font-bold tracking-wider text-white font-mono truncate">
                DAMENA
              </span>
            )}
          </Link>
        </div>

        {/* Staff Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) setNavigating(true);
                }}
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

        {/* Footer: Owner Portal Link, Super Admin Status & Sign Out */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {!isCollapsed && userEmail && (
            <div className="px-2.5 py-2 rounded-lg bg-slate-900/70 border border-slate-800">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ዋና አስተዳዳሪ</span>
                </div>
              )}
              <p className="text-[11px] text-slate-300 font-mono truncate mt-0.5" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            {isSuperAdmin ? (
              <Link
                href="/owner"
                className={`flex-1 flex items-center rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 p-2 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : 'gap-2.5'
                }`}
                title="የባለቤት ፖርታል"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && (
                  <span className="font-semibold text-slate-200 truncate">የባለቤት ፖርታል</span>
                )}
              </Link>
            ) : (
              <div
                className={`flex items-center text-xs text-slate-400 transition-all ${
                  isCollapsed ? 'justify-center w-full' : 'px-2 gap-2'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {!isCollapsed && <span className="text-[11px] font-medium text-slate-400">በመስመር ላይ</span>}
              </div>
            )}

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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) setNavigating(true);
                  setIsMobileOpen(false);
                }}
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

        {/* Mobile Drawer Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ዋና አስተዳዳሪ</span>
                </div>
              )}
              <p className="text-xs text-slate-300 font-mono truncate mt-0.5">{userEmail}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {isSuperAdmin && (
              <Link
                href="/owner"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>የባለቤት ፖርታል</span>
              </Link>
            )}

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
          MAIN APPLICATION LAYOUT AREA
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-18' : 'md:pl-60'
        }`}
      >
        {/* Clean Sticky Top Header */}
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

            <span className="font-bold text-slate-900 text-base tracking-tight">
              {currentNav.label}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/app/stock"
              onClick={() => {
                if (pathname !== '/app/stock') setNavigating(true);
              }}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>ሲሚንቶ</span>
            </Link>
            <Link
              href="/app/production"
              onClick={() => {
                if (pathname !== '/app/production') setNavigating(true);
              }}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              <span>ምርት</span>
            </Link>
            <Link
              href="/app/sales"
              onClick={() => {
                if (pathname !== '/app/sales') setNavigating(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-slate-300" />
              <span>ሽያጭ</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR - STAFF OPERATIONS + OPTIONAL OWNER TAB
      ========================================================================= */}
      <nav
        aria-label="የሞባይል አሰሳ"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 md:hidden flex items-center justify-around px-1 py-1.5 shadow-lg shadow-black/5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href) setNavigating(true);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
              <span className="text-xs mt-1 tracking-tight leading-tight">
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}

        {/* Owner Portal switch on mobile (visible for Super Admin) */}
        {isSuperAdmin && (
          <Link
            href="/owner"
            className="flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] mt-0.5 tracking-tight leading-none font-semibold">
              Owner
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}
