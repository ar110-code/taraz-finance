'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { BellRing, CheckCircle2, ChevronLeft, CreditCard, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/components/layout/AppLayout';

interface LoanAlarmBannerProps {
  loans: Loan[];
  onRefresh: () => void;
}

export function LoanAlarmBanner({ loans, onRefresh }: LoanAlarmBannerProps) {
  const { formatMoney } = useApp();
  const [payingId, setPayingId] = useState<string | null>(null);

  // Filter loans that are active and due within 5 days
  const dueLoans = loans.filter((l) => l.status === 'active' && (l.daysUntilDue ?? 99) <= 5);

  if (dueLoans.length === 0) return null;

  const handlePayInstallment = async (loan: Loan) => {
    setPayingId(loan.id);
    try {
      const res = await fetch(`/api/loans/${loan.id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        onRefresh();
      } else {
        alert(data.error?.message || 'خطا در پرداخت قسط');
      }
    } catch (err) {
      console.error('Error paying installment:', err);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {dueLoans.map((loan) => {
        const isUrgent = (loan.daysUntilDue ?? 99) <= 2;
        const dueText =
          loan.daysUntilDue === 0
            ? 'امروز موعد پرداخت است!'
            : loan.daysUntilDue === 1
            ? 'فردا موعد پرداخت است'
            : `${toPersianDigits(loan.daysUntilDue ?? 0)} روز تا موعد پرداخت`;

        return (
          <div
            key={loan.id}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              isUrgent
                ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUrgent
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <BellRing className="w-5 h-5 animate-bounce stroke-[2]" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    سررسید قسط {loan.title} ({loan.lender})
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isUrgent
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {dueText}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-3">
                  <span>
                    مبلغ قسط: <strong className="text-zinc-800 dark:text-zinc-200 font-bold privacy-mask">{formatMoney(loan.installmentAmount)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    قسط {toPersianDigits(loan.paidInstallments + 1)} از {toPersianDigits(loan.totalInstallments)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto">
              <Button
                size="sm"
                variant={isUrgent ? 'danger' : 'primary'}
                isLoading={payingId === loan.id}
                onClick={() => handlePayInstallment(loan)}
                className="w-full sm:w-auto text-xs font-bold"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>پرداخت سریع این قسط</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
