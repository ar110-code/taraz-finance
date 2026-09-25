'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatToman, formatShamsiDate } from '@/lib/utils';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { Transaction } from '@/types';
import { useApp } from '@/components/layout/AppLayout';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenModal: () => void;
}

export function RecentTransactions({
  transactions,
  onDeleteTransaction,
  onOpenModal,
}: RecentTransactionsProps) {
  const { formatMoney } = useApp();
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2 mb-2">
        <div>
          <CardTitle>آخرین تراکنش‌ها</CardTitle>
          <CardDescription>فعالیت‌های مالی اخیر حساب‌های شما</CardDescription>
        </div>

        <Link
          href="/transactions"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>مشاهده همه تراکنش‌ها</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 pt-1">
        {transactions.length === 0 ? (
          <EmptyState
            title="هیچ تراکنشی یافت نشد"
            description="برای شروع ثبت حساب‌های خود، اولین تراکنش درآمد یا هزینه را ثبت کنید."
            actionText="ثبت اولین تراکنش"
            onAction={onOpenModal}
            className="my-2 border-0 bg-transparent"
          />
        ) : (
          transactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-2 rounded-xl transition-colors"
              >
                {/* Right side: Icon & Title/Category/Account */}
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    name={tx.category?.icon || 'Tag'}
                    color={tx.category?.color || '#6366f1'}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {tx.title}
                      </span>
                      <Badge variant={isIncome ? 'income' : 'neutral'} size="sm">
                        {tx.category?.name || 'عمومی'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{formatShamsiDate(tx.date)}</span>
                      <span>•</span>
                      <span className="truncate">{tx.account?.name || 'حساب اصلی'}</span>
                    </div>
                  </div>
                </div>

                {/* Left side: Amount & Delete button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <div
                      className="text-sm sm:text-base font-black flex items-center justify-end gap-1"
                      dir="rtl"
                    >
                      <span className={isIncome ? 'text-emerald-500 font-bold select-none' : 'text-rose-500 font-bold select-none'}>
                        {isIncome ? '+' : '−'}
                      </span>
                      <span
                        className={`privacy-mask ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-900 dark:text-zinc-50'
                        }`}
                      >
                        {formatMoney(tx.amount)}
                      </span>
                    </div>
                    {tx.note && (
                      <p className="text-[11px] text-zinc-400 truncate max-w-[140px] text-left">
                        {tx.note}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    title="حذف تراکنش"
                    aria-label="حذف تراکنش"
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 sm:p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer min-w-8 min-h-8 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
