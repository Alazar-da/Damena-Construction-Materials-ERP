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
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  HardHat,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Crown,
  LogOut,
  UserRound,
  Wrench,
  Bell,
} from 'lucide-react';
import { logout } from '@/app/login/actions';
import { HeaderSlotProvider, useHeaderSlot } from '@/components/header-slot-context';
import { t } from '@/lib/i18n';

interface NavItem {
  href: string;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/app', label: t.overview.today, mobileLabel: t.overview.today, icon: LayoutDashboard },
  { href: '/app/stock', label: t.stock.title, mobileLabel: t.nav.stockMobile, icon: Boxes },
  { href: '/app/production', label: t.production.title, mobileLabel: t.nav.productionMobile, icon: Factory },
  { href: '/app/sales', label: t.sales.title, mobileLabel: t.nav.salesMobile, icon: ShoppingCart },
  { href: '/app/payroll', label: t.payroll.title, mobileLabel: t.nav.payrollMobile, icon: WalletCards },
  { href: '/app/machinery', label: t.machinery.title, mobileLabel: t.nav.machineryMobile, icon: Wrench },
];

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
  displayName?: string;
  isSuperAdmin?: boolean;
}

export default function AppShell(props: AppShellProps) {
  return (
    <HeaderSlotProvider>
      <AppShellInner {...props} />
    </HeaderSlotProvider>
  );
}

function AppShellInner({
  children,
  userEmail,
  displayName,
  isSuperAdmin = false,
}: AppShellProps) {
  const { headerCenter, headerRight } = useHeaderSlot();
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Hydrate PC collapsed state from localStorage
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
          SIDEBAR: RESPONSIVE SPLIT
          - Tablet (md to xl): Fixed narrow w-20 icon-rail (no complex toggles)
          - PC Desktop (xl+): Original collapsible sidebar (w-60 / w-18) with toggle
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out md:max-xl:w-20 ${
          isCollapsed ? 'xl:w-18' : 'xl:w-60'
        }`}
      >
        {/* PC-ONLY: Border rail toggle button (hidden on tablet to prevent layout complexity) */}
        <button
          onClick={toggleCollapsed}
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
            href="/app"
            onClick={() => {
              if (pathname !== '/app') setNavigating(true);
            }}
            className={`flex items-center gap-2.5 overflow-hidden transition-all md:max-xl:justify-center ${
              isCollapsed ? 'xl:justify-center xl:w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0">
              <HardHat className="w-4 h-4 text-sky-400" />
            </div>

            {/* Title visible on PC when not collapsed */}
            <div className={`min-w-0 hidden md:max-xl:hidden ${isCollapsed ? 'xl:hidden' : 'xl:block'}`}>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mt-0.5">
                አስተዳዳሪ
              </span>
            </div>
          </Link>
        </div>

        {/* Staff Navigation Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar md:max-xl:px-2 md:max-xl:py-4 md:max-xl:space-y-2 xl:px-2.5 xl:py-4 xl:space-y-1">
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
                title={item.label}
                className={`transition-all cursor-pointer ${
                  /* Tablet View: Icon on top, label underneath in compact rounded box */
                  'md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:py-2.5 md:max-xl:px-1 md:max-xl:rounded-xl'
                } ${
                  /* PC Desktop View: Horizontal row with label or collapsed icon */
                  'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:relative xl:group'
                } ${
                  isCollapsed ? 'xl:h-11 xl:w-11 xl:mx-auto xl:justify-center' : 'xl:min-h-11 xl:px-3 xl:py-2 xl:gap-3'
                } ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold border border-slate-800 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {/* Active indicator dot on PC */}
                {isActive && !isCollapsed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 hidden xl:inline" />
                )}

                <Icon
                  className={`shrink-0 transition-colors ${
                    /* Tablet icon size vs PC icon size */
                    'md:max-xl:w-5 md:max-xl:h-5 xl:w-4 xl:h-4'
                  } ${
                    isActive ? 'text-emerald-400 xl:text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {/* Tablet Label: Centered underneath icon */}
                <span className="text-[10px] mt-1 font-semibold text-center leading-tight truncate max-w-full hidden md:max-xl:inline">
                  {item.mobileLabel || item.label}
                </span>

                {/* PC Label: To the right of icon */}
                {!isCollapsed && (
                  <span className="truncate text-sm hidden xl:inline">{item.label}</span>
                )}

                {/* PC Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 hidden xl:block">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Details, Owner Portal, Logout */}
        <div className="border-t border-slate-800/60 md:max-xl:p-2 md:max-xl:space-y-2 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center xl:p-3 xl:space-y-2">
          {/* PC Super Admin & Name Box */}
          {!isCollapsed && userEmail && (
            <div className="px-2.5 py-2 rounded-lg bg-slate-900/70 border border-slate-800 hidden xl:block">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ዋና አስተዳዳሪ</span>
                </div>
              )}
              <p className="text-sm text-slate-200 font-semibold truncate mt-0.5" title={displayName || userEmail}>
                {displayName || userEmail?.split('@')[0]}
              </p>
            </div>
          )}

          {/* Profile Link on PC Sidebar (On Tablet it moves up to Header!) */}
          <Link
            href="/app/profile"
            className={`flex items-center rounded-lg text-slate-300 hover:bg-slate-900/60 hover:text-white transition-colors hidden xl:flex ${
              isCollapsed ? 'mx-auto h-11 w-11 justify-center' : 'min-h-11 gap-2.5 px-3'
            }`}
            title="የእኔ መገለጫ"
          >
            <UserRound className="h-4 w-4 text-blue-300" />
            {!isCollapsed && <span className="truncate text-sm font-semibold">መገለጫ</span>}
          </Link>

          {/* Owner Portal Link */}
          {isSuperAdmin && (
            <Link
              href="/owner"
              title="ወደ ዋና ባለቤት ገጽ"
              className={`transition-colors cursor-pointer ${
                'md:max-xl:w-14 md:max-xl:h-12 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:rounded-xl md:max-xl:text-emerald-400 md:max-xl:hover:bg-slate-900/80'
              } ${
                'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:text-slate-300 xl:hover:text-white xl:hover:bg-slate-900/60 xl:p-2'
              } ${
                isCollapsed ? 'xl:justify-center' : 'xl:gap-2.5'
              }`}
            >
              <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[9px] mt-0.5 font-semibold md:max-xl:inline hidden">ባለቤት</span>
              {!isCollapsed && (
                <span className="font-semibold text-slate-200 truncate hidden xl:inline">ወደ ዋና ባለቤት ገጽ</span>
              )}
            </Link>
          )}

          {/* Logout button */}
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
              <HardHat className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mt-0.5">
                አስተዳዳሪ
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
            <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ዋና አስተዳዳሪ</span>
                </div>
              )}
              <p className="text-sm text-slate-200 font-semibold truncate mt-0.5">{displayName || userEmail?.split('@')[0]}</p>
            </div>
          )}

          <Link href="/app/profile" onClick={() => setIsMobileOpen(false)} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors">
            <UserRound className="h-4 w-4 text-blue-300" /><span>መገለጫ</span>
          </Link>

          <div className="flex items-center justify-between gap-2">
            {isSuperAdmin && (
              <Link
                href="/owner"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ወደ ዋና ባለቤት ገጽ</span>
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
          - Tablet (md to xl): Fixed padding-left md:max-xl:pl-20
          - PC Desktop (xl+): Collapsible padding-left xl:pl-60 or xl:pl-18
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out md:max-xl:pl-20 ${
          isCollapsed ? 'xl:pl-18' : 'xl:pl-60'
        }`}
      >
        {/* Sticky Top Header:
            - Tablet: Dark Slate theme, centered headerSlot (Sales choices), Profile moved up to Header
            - PC Desktop: Original Clean White Header with title and quick actions */}
        <header
          className={`sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-3.5 sm:px-6 transition-colors ${
            /* Tablet theme vs PC theme */
            'md:max-xl:bg-[#1e293b] md:max-xl:text-white md:max-xl:border-b md:max-xl:border-slate-800'
          } ${
            /* PC theme */
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
                Damena ERP
              </span>
            </div>

            {/* PC Brand / Nav Title */}
            <div className="flex items-center gap-2 md:max-xl:hidden">
              <span className="font-black text-slate-900 text-base tracking-tight">
                {currentNav.label}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200/60 hidden sm:inline-block">
                አስተዳዳሪ
              </span>
            </div>
          </div>

          {/* TABLET-ONLY: Center Header Slot (Moves Sales Product vs Service choices to the Header!) */}
          <div className="hidden md:max-xl:flex items-center justify-center flex-1 max-w-md mx-4">
            {headerCenter}
          </div>

          {/* TABLET-ONLY: Right Area with Profile moved up to header & Bell */}
          <div className="hidden md:max-xl:flex items-center gap-2.5">
            {headerRight}

            {/* Tablet Super Admin Return to Owner Portal */}
            {isSuperAdmin && (
              <Link
                href="/owner"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold transition-colors"
                title="ወደ ዋና ባለቤት ገጽ"
              >
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline text-[11px]">ዋና ባለቤት</span>
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              href={isSuperAdmin ? '/owner/reports' : '/app'}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="ማሳወቂያዎች"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#1e293b]" />
            </Link>

            {/* Profile Avatar Button MOVED UP TO HEADER on Tablet View */}
            <Link
              href="/app/profile"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-800 transition-all border border-slate-700 bg-slate-800/80 group"
              title={displayName || userEmail}
            >
              <div className="w-7 h-7 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {(displayName || userEmail || 'K').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {displayName || userEmail?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            </Link>
          </div>

          {/* PC-ONLY: Quick Header Actions (ሲሚንቶ, ምርት, ሽያጭ) */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:max-xl:hidden">
            {isSuperAdmin && (
              <Link
                href="/owner"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors mr-1"
                title="ወደ ዋና ባለቤት ገጽ"
              >
                <Crown className="w-3.5 h-3.5 text-emerald-700" />
                <span>ወደ ዋና ባለቤት ገጽ</span>
              </Link>
            )}
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
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
