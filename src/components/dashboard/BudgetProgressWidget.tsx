import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { Target, ArrowLeft } from 'lucide-react';
import { Budget } from '@/types';

interface BudgetProgressWidgetProps {
  budgets: Budget[];
}

export function BudgetProgressWidget({ budgets }: BudgetProgressWidgetProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between pb-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <CardTitle>وضعیت بودجه‌های ماهانه</CardTitle>
          </div>
          <CardDescription>پایش سقف هزینه‌های تعیین‌شده</CardDescription>
        </div>

        <Link
          href="/budgets"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>مشاهده همه</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div className="space-y-4 pt-2 flex-1">
        {budgets.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            هنوز بودجه‌ای برای این ماه تعیین نشده است.
          </p>
        ) : (
          budgets.slice(0, 4).map((b) => {
            const pct = Math.min(100, b.percentage || 0);

            // Progress bar color based on usage
            let barColor = 'bg-emerald-500';
            let badgeBg = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40';
            if (pct >= 95) {
              barColor = 'bg-rose-500';
              badgeBg = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40';
            } else if (pct >= 70) {
              barColor = 'bg-amber-500';
              badgeBg = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40';
            }

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      name={b.category?.icon || 'Tag'}
                      color={b.category?.color || '#6366f1'}
                      size="sm"
                    />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {b.category?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatToman(b.spent || 0)} / {formatToman(b.monthlyLimit)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}
                    >
                      {toPersianDigits(pct)}٪
                    </span>
                  </div>
                </div>

                {/* Smooth Progress Bar */}
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
