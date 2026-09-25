import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { Wallet, ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';
import { AnalyticsSummary } from '@/types';

interface StatCardsProps {
  analytics: AnalyticsSummary;
}

export function StatCards({ analytics }: StatCardsProps) {
  const cards = [
    {
      title: 'موجودی کل حساب‌ها',
      value: formatToman(analytics.totalBalance),
      subtext: 'مجموع کلیه حساب‌ها',
      icon: Wallet,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'درآمد این ماه',
      value: formatToman(analytics.monthIncome),
      subtext: 'واریزی‌های ثبت‌شده',
      icon: ArrowUpRight,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'مخارج این ماه',
      value: formatToman(analytics.monthExpense),
      subtext:
        analytics.expenseChangePercentage !== 0
          ? `${analytics.expenseChangePercentage > 0 ? '+' : ''}${toPersianDigits(
              analytics.expenseChangePercentage
            )}٪ نسبت به ماه قبل`
          : 'برابر میانگین ماهانه',
      icon: ArrowDownRight,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/50',
      isDanger: analytics.expenseChangePercentage > 15,
    },
    {
      title: 'نرخ پس‌انداز',
      value: `${toPersianDigits(analytics.savingsRate)}٪`,
      subtext: `مازاد: ${formatToman(analytics.netSavings)}`,
      icon: PiggyBank,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            hoverEffect
            className="p-3.5 sm:p-5 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-1.5 sm:gap-3 mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <div className="text-sm sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                {card.value}
              </div>
              <p
                className={`text-[10px] sm:text-[11px] font-medium truncate ${
                  card.isDanger
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {card.subtext}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
