'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  ChartNoAxesCombined,
  Wrench,
  ChevronLeft,
  ChevronDown,
  HardHat,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  UserRound,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { logout } from '@/app/login/actions';
import { HeaderSlotProvider, useHeaderSlot } from '@/components/header-slot-context';

interface NavItem {
  href: string;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const managerNavItems: NavItem[] = [
  { href: '/manager', label: 'አጠቃላይ እይታ', mobileLabel: 'አጠቃላይ', icon: LayoutDashboard },
  { href: '/manager/prices', label: 'ዋጋዎች', mobileLabel: 'ዋጋ', icon: Tag },
  { href: '/manager/reports', label: 'ሪፖርቶች', mobileLabel: 'ሪፖርት', icon: ChartNoAxesCombined },
  { href: '/manager/machinery', label: 'ማሽነሪ', mobileLabel: 'ማሽነሪ', icon: Wrench },
];

interface ManagerShellProps {
  children: React.ReactNode;
  userEmail?: string;
  displayName?: string;
  isSuperAdmin?: boolean;
}

export default function ManagerShell(props: ManagerShellProps) {
  return (
    <HeaderSlotProvider>
      <ManagerShellInner {...props} />
    </HeaderSlotProvider>
  );
}

function ManagerShellInner({
  children,
  userEmail,
  displayName,
  isSuperAdmin = false,
}: ManagerShellProps) {
  const { headerCenter, headerRight } = useHeaderSlot();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('damena_manager_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('damena_manager_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const currentNav =
    managerNavItems.find((item) =>
      item.href === '/manager' ? pathname === '/manager' : pathname.startsWith(item.href)
    ) || managerNavItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* =========================================================================
          DESKTOP & TABLET SIDEBAR
          - Tablet (md to xl): Fixed narrow w-20 icon-rail
          - PC Desktop (xl+): Collapsible sidebar (w-60 / w-18)
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out md:max-xl:w-20 ${
          isCollapsed ? 'xl:w-18' : 'xl:w-60'
        }`}
      >
        {/* PC Toggle */}
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
            href="/manager"
            className={`flex items-center gap-2.5 overflow-hidden transition-all md:max-xl:justify-center ${
              isCollapsed ? 'xl:justify-center xl:w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0">
              <HardHat className="w-4 h-4 text-amber-400" />
            </div>

            <div className={`min-w-0 hidden md:max-xl:hidden ${isCollapsed ? 'xl:hidden' : 'xl:block'}`}>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider block mt-0.5">
                ስራ አስኪያጅ (Manager)
              </span>
            </div>
          </Link>
        </div>

        {/* Manager Navigation Items (ONLY 4 Items) */}
        <nav className="flex-1 overflow-y-auto no-scrollbar md:max-xl:px-2 md:max-xl:py-4 md:max-xl:space-y-2 xl:px-2.5 xl:py-4 xl:space-y-1">
          {managerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/manager'
                ? pathname === '/manager'
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
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 hidden xl:inline" />
                )}

                <Icon
                  className={`shrink-0 transition-colors ${
                    'md:max-xl:w-5 md:max-xl:h-5 xl:w-4 xl:h-4'
                  } ${
                    isActive ? 'text-amber-400 xl:text-white' : 'text-slate-400 group-hover:text-slate-200'
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

        {/* Footer: Profile, Staff App Switcher, Logout */}
        <div className="border-t border-slate-800/60 md:max-xl:p-2 md:max-xl:space-y-2 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center xl:p-3 xl:space-y-2">
          <Link
            href="/manager/profile"
            className={`flex items-center rounded-lg text-slate-300 hover:bg-slate-900/60 hover:text-white transition-colors hidden xl:flex ${
              isCollapsed ? 'mx-auto h-11 w-11 justify-center' : 'min-h-11 gap-2.5 px-3'
            }`}
            title="የእኔ መገለጫ"
          >
            <UserRound className="h-4 w-4 text-blue-300" />
            {!isCollapsed && <span className="truncate text-sm font-semibold">መገለጫ</span>}
          </Link>

          {/* Switch to Staff Operations Desk */}
          <Link
            href="/app"
            title="የሰራተኞች የስራ ጠረጴዛ"
            className={`transition-colors cursor-pointer ${
              'md:max-xl:w-14 md:max-xl:h-12 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:rounded-xl md:max-xl:text-slate-300 md:max-xl:hover:bg-slate-900/80'
            } ${
              'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:text-slate-300 xl:hover:text-white xl:hover:bg-slate-900/60 xl:p-2'
            } ${
              isCollapsed ? 'xl:justify-center' : 'xl:gap-2.5'
            }`}
          >
            <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && (
              <span className="truncate text-xs font-semibold hidden xl:inline">
                የሰራተኞች ገጽ
              </span>
            )}
          </Link>

          {/* Super Admin Switch to Owner Portal */}
          {isSuperAdmin && (
            <Link
              href="/owner"
              title="የባለቤት ፖርታል"
              className={`transition-colors cursor-pointer text-emerald-400 ${
                'md:max-xl:w-14 md:max-xl:h-12 md:max-xl:flex md:max-xl:flex-col md:max-xl:items-center md:max-xl:justify-center md:max-xl:rounded-xl md:max-xl:hover:bg-slate-900/80'
              } ${
                'xl:flex xl:items-center xl:rounded-lg xl:text-xs xl:hover:bg-slate-900/60 xl:p-2'
              } ${
                isCollapsed ? 'xl:justify-center' : 'xl:gap-2.5'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="truncate text-xs font-semibold hidden xl:inline">
                  የባለቤት ፖርታል
                </span>
              )}
            </Link>
          )}

          <form action={logout} className="w-full">
            <button
              type="submit"
              title="ውጣ (Sign out)"
              className={`w-full flex items-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900/60 transition-colors cursor-pointer ${
                'md:max-xl:h-10 md:max-xl:justify-center'
              } ${
                isCollapsed ? 'xl:h-11 xl:justify-center' : 'xl:min-h-11 xl:px-3 xl:gap-2.5'
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate text-xs font-semibold hidden xl:inline">ውጣ</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (ONLY TRIGGERED BY TOP HAMBURGER MENU)
      ========================================================================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white flex flex-col md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200">
              <HardHat className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-white font-mono block leading-none">
                DAMENA
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider block mt-0.5">
                ስራ አስኪያጅ (Manager)
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

        {/* Manager 4 Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {managerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/manager'
                ? pathname === '/manager'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold border border-slate-800 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ስራ አስኪያጅ</span>
              </div>
              <p className="text-sm text-slate-200 font-semibold truncate mt-0.5">
                {displayName || userEmail.split('@')[0]}
              </p>
            </div>
          )}

          <Link
            href="/manager/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <UserRound className="h-4 w-4 text-blue-300" />
            <span>መገለጫ</span>
          </Link>

          <Link
            href="/app"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-amber-400 hover:bg-slate-900 transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-amber-400" />
            <span>የሰራተኞች ገጽ (Staff App)</span>
          </Link>

          {isSuperAdmin && (
            <Link
              href="/owner"
              onClick={() => setIsMobileOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-emerald-400 hover:bg-slate-900 transition-colors"
            >
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>የባለቤት ፖርታል (Owner)</span>
            </Link>
          )}

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
          MAIN CONTENT AREA
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out md:max-xl:ml-20 ${
          isCollapsed ? 'xl:ml-18' : 'xl:ml-60'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="የአሰሳ ምናሌን ክፈት"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Title / Current Desk */}
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                {currentNav.label}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/60 hidden sm:inline-block">
                ስራ አስኪያጅ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {headerCenter}
            {headerRight}

            {/* Profile Avatar */}
            <Link
              href="/manager/profile"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200 bg-white group"
              title={displayName || userEmail}
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {(displayName || userEmail || 'M').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate hidden sm:inline">
                {displayName || userEmail?.split('@')[0] || 'Manager'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:inline" />
            </Link>
          </div>
        </header>

        {/* Page Content: Mobile-optimized padding, zero bottom navigation clutter */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
