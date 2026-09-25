'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Target,
  PieChart,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onOpenTransactionModal: () => void;
}

export function BottomNav({ onOpenTransactionModal }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'داشبورد', href: '/', icon: LayoutDashboard },
    { name: 'تراکنش‌ها', href: '/transactions', icon: ArrowLeftRight },
    { isAction: true },
    { name: 'اقساط', href: '/loans', icon: Landmark },
    { name: 'تحلیل', href: '/analytics', icon: PieChart },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1 shadow-lg select-none">
      <div className="flex items-center justify-around max-w-md mx-auto h-14">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <button
                key="action-add"
                onClick={onOpenTransactionModal}
                aria-label="ثبت تراکنش جدید"
                className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md shadow-indigo-500/30 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon!;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 min-h-[44px]',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.8]'
                )}
              />
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
