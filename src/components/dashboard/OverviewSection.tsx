'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { CashFlowChart } from './CashFlowChart';
import { CategoryDonut } from './CategoryDonut';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { AnalyticsSummary } from '@/types';
import { Wallet, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { useApp } from '@/components/layout/AppLayout';

interface OverviewSectionProps {
  analytics: AnalyticsSummary;
}

export function OverviewSection({ analytics }: OverviewSectionProps) {
  const { isPrivacyMode } = useApp();

  const isBalanceNegative = analytics.totalBalance < 0;
  const absBalance = Math.abs(analytics.totalBalance);
  const formattedBalance = toPersianDigits(absBalance.toLocaleString('en-US'));

  const formattedIncome = toPersianDigits(analytics.monthIncome.toLocaleString('en-US'));
  const formattedExpense = toPersianDigits(analytics.monthExpense.toLocaleString('en-US'));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Master KPI Card (Unified Financial Balance & Metrics) */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900/90 dark:to-zinc-950 border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
        {/* Top: Net Balance */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                موجودی کل حساب‌ها
              </span>
              <div className="flex items-center gap-1.5 text-xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight" dir="rtl">
                {isBalanceNegative && (
                  <span className="text-rose-500 font-bold select-none text-2xl sm:text-4xl leading-none">
                    −
                  </span>
                )}
                <span className="privacy-mask">
                  {isPrivacyMode ? '••••••••' : `${formattedBalance} تومان`}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-left">
            <span className="text-xs text-zinc-400">مجموع دارایی ۴ حساب بانکی</span>
          </div>
        </div>

        {/* Bottom Row: 3 Quick Metric Pills */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3">
          {/* Income Pill */}
          <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>درآمد ماه</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-lg font-black tracking-tight truncate mt-1" dir="rtl">
              <span className="text-emerald-500 font-bold select-none text-sm sm:text-lg leading-none">
                +
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 privacy-mask">
                {isPrivacyMode ? '••••••••' : `${formattedIncome} تومان`}
              </span>
            </div>
          </div>

          {/* Expense Pill */}
          <div className="p-2 sm:p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>مخارج ماه</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-lg font-black tracking-tight truncate mt-1" dir="rtl">
              <span className="text-rose-500 font-bold select-none text-sm sm:text-lg leading-none">
                −
              </span>
              <span className="text-zinc-900 dark:text-zinc-100 privacy-mask">
                {isPrivacyMode ? '••••••••' : `${formattedExpense} تومان`}
              </span>
            </div>
          </div>

          {/* Savings Rate Pill */}
          <div className="p-2 sm:p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>نرخ پس‌انداز</span>
            </div>
            <div className="text-xs sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate mt-1">
              {toPersianDigits(analytics.savingsRate)}٪
            </div>
          </div>
        </div>
      </Card>

      {/* 2 & 3. Charts: Cash Flow Chart (Right) + Category Donut (Left) - Always Side-by-Side */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-stretch">
        {/* Right in RTL: Cash Flow Chart (نمودار ستونی) */}
        <div className="col-span-7 flex flex-col">
          <CashFlowChart data={analytics.monthlyCashflow} compact />
        </div>

        {/* Left in RTL: Category Breakdown (نمودار دایره‌ای) */}
        <div className="col-span-5 flex flex-col">
          <CategoryDonut categories={analytics.categoryBreakdown} compact />
        </div>
      </div>
    </div>
  );
}
