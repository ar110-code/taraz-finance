'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  PieChart,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'داشبورد مالی', href: '/', icon: LayoutDashboard },
    { name: 'تراکنش‌ها', href: '/transactions', icon: ArrowLeftRight },
    { name: 'اقساط و وام‌ها', href: '/loans', icon: Landmark },
    { name: 'بودجه‌بندی', href: '/budgets', icon: Target },
    { name: 'تحلیل و آمار', href: '/analytics', icon: PieChart },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 border-l border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Top Logo & Close Button */}
          <div className="flex items-center justify-between pb-6 mb-4 border-b border-zinc-100 dark:border-zinc-900">
            <Link href="/" onClick={onClose}>
              <BrandLogo />
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-wider block mb-2">
              منوی اصلی
            </span>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 hover:text-zinc-900 dark:hover:text-zinc-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 stroke-[1.8]',
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Bank Accounts summary banner */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  سامانه مدیریت مالی
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                ردیابی زنده، ثبت تراکنش‌های روزانه و هوش محاسباتی تراز
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
