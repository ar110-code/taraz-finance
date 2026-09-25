'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { CategoryDonut } from '@/components/dashboard/CategoryDonut';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { AnalyticsSummary, Account } from '@/types';
import {
  PieChart,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Wallet,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { refreshKey, formatMoney } = useApp();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/analytics').then((r) => r.json()),
      fetch('/api/accounts').then((r) => r.json()),
    ])
      .then(([anRes, accRes]) => {
        if (anRes.success) setAnalytics(anRes.data);
        if (accRes.success) setAccounts(accRes.data);
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  // Financial Health Evaluation
  const savingsRate = analytics.savingsRate;
  let healthTitle = 'انضباط مالی مطلوب و پایدار';
  let healthDesc =
    'نرخ پس‌انداز و ذخیره نقدینگی شما بالاتر از شاخص استاندارد ۲۰٪ است. پیشنهاد می‌شود مازاد نقدینگی را در صندوق‌های با بازدهی مناسب سرمایه‌گذاری کنید.';
  let healthIcon = <ShieldCheck className="w-6 h-6 text-emerald-500" />;
  let healthCardBorder = 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20';

  if (analytics.netSavings < 0) {
    healthTitle = 'هشدار: کسری نقدینگی در این دوره';
    healthDesc =
      'هزینه‌های ثبت‌شده شما در این ماه از مجموع درآمدها بیشتر بوده است. بازبینی هزینه‌های متفرقه و بودجه‌های فعال توصیه می‌شود.';
    healthIcon = <AlertTriangle className="w-6 h-6 text-rose-500" />;
    healthCardBorder = 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/20';
  } else if (savingsRate < 15) {
    healthTitle = 'فرصت ارتقای نرخ پس‌انداز';
    healthDesc =
      'درآمد و مخارج شما سر به سر هستند، اما ظرفیت پس‌انداز کمتر از ۱۵٪ است. با بهینه‌سازی دسته‌های غیرضروری می‌توانید به نرخ طلایی ۲۰٪ برسید.';
    healthIcon = <Lightbulb className="w-6 h-6 text-amber-500" />;
    healthCardBorder = 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20';
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          گزارش و تحلیل‌های عمیق مالی
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          ارزیابی سلامت مالی، سهم حساب‌ها، روند نقدینگی و توزیع هزینه‌ها
        </p>
      </div>

      {/* Financial Health Banner */}
      <Card className={`p-5 sm:p-6 ${healthCardBorder}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs shrink-0">
            {healthIcon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{healthTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
              {healthDesc}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart data={analytics.monthlyCashflow} />
        </div>
        <div>
          <CategoryDonut categories={analytics.categoryBreakdown} />
        </div>
      </div>

      {/* Accounts & Asset Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <CardTitle>پراکندگی دارایی در حساب‌های بانکی</CardTitle>
            </div>
            <CardDescription>موجودی و سهم هر حساب از کل دارایی‌های نقد</CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-1">
            {accounts.map((acc) => {
              const sharePct =
                analytics.totalBalance > 0
                  ? Math.round((acc.balance / analytics.totalBalance) * 100)
                  : 0;

              return (
                <div
                  key={acc.id}
                  className="p-2.5 sm:p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-[11px] sm:text-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.bankName.slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {acc.name}
                      </h4>
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate block">
                        {acc.accountNumber || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-50 privacy-mask">
                      {formatMoney(acc.balance)}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400">
                      {toPersianDigits(sharePct)}٪ از کل
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Highest Expense Ranking */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <CardTitle>بزرگ‌ترین سرفصل‌های هزینه‌ای</CardTitle>
            </div>
            <CardDescription>دسته‌بندی‌های با بیشترین جذب نقدینگی در این ماه</CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-1">
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                هنوز تراکنش هزینه‌ای در این ماه ثبت نشده است.
              </p>
            ) : (
              analytics.categoryBreakdown.map((cat, idx) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 font-bold text-zinc-400 text-center">
                        #{toPersianDigits(idx + 1)}
                      </span>
                      <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {cat.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 privacy-mask">
                        {formatMoney(cat.totalAmount)}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400 min-w-8 text-left">
                        {toPersianDigits(cat.percentage)}٪
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
