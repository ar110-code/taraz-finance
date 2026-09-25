'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Plus, Moon, Sun, Calendar, RotateCcw, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from './BrandLogo';
import { formatShamsiDate } from '@/lib/utils';
import { useApp } from './AppLayout';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenTransactionModal: () => void;
  onOpenResetModal: () => void;
}

export function Header({
  onOpenSidebar,
  onOpenTransactionModal,
  onOpenResetModal,
}: HeaderProps) {
  const { isPrivacyMode, togglePrivacyMode, lockApp, openChangePinModal, isDarkMode, toggleDarkMode } = useApp();
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    setTodayDate(formatShamsiDate(new Date().toISOString()));
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Right side: Mobile Menu Button & Logo/Date Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="منو"
          className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo on mobile */}
        <div className="lg:hidden">
          <BrandLogo size="sm" withText={true} />
        </div>

        {todayDate && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>امروز: {todayDate}</span>
          </div>
        )}
      </div>

      {/* Left side: Privacy, Lock, Reset, Theme Toggle & Quick Action CTA */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Privacy / Eye Toggle Button */}
        <button
          onClick={togglePrivacyMode}
          title={isPrivacyMode ? 'نمایش مبالغ (حالت خصوصی فعال است)' : 'مخفی‌سازی مبالغ (حالت خصوصی)'}
          className={`p-2 rounded-xl transition-all duration-150 cursor-pointer min-w-9 min-h-9 flex items-center justify-center border ${
            isPrivacyMode
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60'
          }`}
          aria-label="حالت مخفی‌سازی مبالغ"
        >
          {isPrivacyMode ? (
            <EyeOff className="w-4 h-4 stroke-[2]" />
          ) : (
            <Eye className="w-4 h-4 stroke-[1.8]" />
          )}
        </button>

        {/* Lock Screen Button */}
        <button
          onClick={lockApp}
          title="قفل سریع برنامه"
          className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-zinc-200/60 dark:border-zinc-800/60 transition-colors cursor-pointer min-w-9 min-h-9 flex items-center justify-center"
          aria-label="قفل برنامه"
        >
          <Lock className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Change PIN Button */}
        <button
          onClick={openChangePinModal}
          title="تغییر رمز عبور برنامه (PIN)"
          className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-zinc-200/60 dark:border-zinc-800/60 transition-colors cursor-pointer min-w-9 min-h-9 flex items-center justify-center"
          aria-label="تغییر رمز برنامه"
        >
          <KeyRound className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Reset Data Button */}
        <button
          onClick={onOpenResetModal}
          title="بازنشانی و صفر کردن اطلاعات"
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-zinc-200/60 dark:border-zinc-800/60 transition-colors cursor-pointer min-w-9 min-h-9 flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Dark/Light Theme Toggle — now connected to global AppContext */}
        <button
          onClick={toggleDarkMode}
          aria-label="تغییر حالت تیره/روشن"
          title={isDarkMode ? 'حالت روشن' : 'حالت تیره'}
          className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer min-w-9 min-h-9 flex items-center justify-center ${
            isDarkMode
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200/60'
          }`}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 stroke-[1.8]" />
          )}
        </button>

        {/* Quick Add Transaction CTA */}
        <Button
          onClick={onOpenTransactionModal}
          variant="primary"
          size="sm"
          className="shadow-sm shadow-indigo-500/20 text-xs sm:text-sm px-2.5 sm:px-4"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span className="hidden sm:inline">ثبت تراکنش</span>
          <span className="sm:hidden">ثبت</span>
        </Button>
      </div>
    </header>
  );
}
