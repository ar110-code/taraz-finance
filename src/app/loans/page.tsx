'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoanAlarmBanner } from '@/components/loans/LoanAlarmBanner';
import { CreateLoanModal } from '@/components/loans/CreateLoanModal';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { Loan } from '@/types';
import {
  Landmark,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/components/layout/AppLayout';

export default function LoansPage() {
  const { formatMoney } = useApp();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/loans');
      const data = await res.json();
      if (data.success) {
        setLoans(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handlePayInstallment = async (id: string) => {
    setPayingId(id);
    try {
      const res = await fetch(`/api/loans/${id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
        fetchLoans();
      } else {
        alert(data.error?.message || 'خطا در پرداخت قسط');
      }
    } catch (err) {
      console.error('Error paying installment:', err);
    } finally {
      setPayingId(null);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('آیا از حذف این وام اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchLoans();
      }
    } catch (err) {
      console.error('Error deleting loan:', err);
    }
  };

  const activeLoans = loans.filter((l) => l.status === 'active');
  const completedLoans = loans.filter((l) => l.status === 'completed');

  const totalRemainingDebt = activeLoans.reduce((sum, l) => sum + (l.remainingAmount ?? 0), 0);
  const totalMonthlyCommitment = activeLoans.reduce((sum, l) => sum + l.installmentAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            مدیریت وام‌ها و اقساط ماهانه
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            پایش سررسید قسط‌ها، مبلغ بدهی‌های باقی‌مانده و ثبت پرداخت اقساط
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="shadow-sm shadow-indigo-500/20 w-full sm:w-auto text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت وام یا خرید قسطی</span>
        </Button>
      </div>

      {/* Due Alarm Banner */}
      <LoanAlarmBanner loans={loans} onRefresh={fetchLoans} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Landmark className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                مجموع بدهی باقی‌مانده
              </span>
              <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 privacy-mask">
                {formatMoney(totalRemainingDebt)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                مجموع اقساط ماهانه
              </span>
              <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 privacy-mask">
                {formatMoney(totalMonthlyCommitment)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                تعداد وام‌های فعال
              </span>
              <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                {toPersianDigits(activeLoans.length)} طرح فعال
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Loans List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          title="هنوز وام یا طرح اقساطی ثبت نکرده‌اید"
          description="با ثبت اولین وام، قسط ماهانه، سررسید و بدهی باقی‌مانده را به‌طور هوشمند رصد کنید"
          actionText="ثبت اولین وام"
          onAction={() => setModalOpen(true)}
          icon={<Landmark className="w-6 h-6 stroke-[1.8] text-indigo-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => {
            const isCompleted = loan.status === 'completed';
            const progress = loan.progressPercentage ?? 0;

            return (
              <Card
                key={loan.id}
                className={`p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                  isCompleted
                    ? 'opacity-70 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                    : 'hover:shadow-md border-zinc-200 dark:border-zinc-800/90'
                }`}
              >
                <div>
                  {/* Top: Title & Status */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {loan.title}
                        </h3>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                          وام‌دهنده: {loan.lender}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          تسویه شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          سررسید: {toPersianDigits(loan.dueDay)}ام هر ماه
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="حذف وام"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[11px]">مبلغ هر قسط:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm privacy-mask">
                        {formatMoney(loan.installmentAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[11px]">مانده بدهی کل:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm privacy-mask">
                        {formatMoney(loan.remainingAmount ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {toPersianDigits(loan.paidInstallments)} از {toPersianDigits(loan.totalInstallments)} قسط پرداخت شده
                      </span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {toPersianDigits(progress)}٪
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                {!isCompleted && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/70 mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 truncate">
                      {loan.daysUntilDue !== undefined && loan.daysUntilDue <= 3
                        ? `⚠️ فقط ${toPersianDigits(loan.daysUntilDue)} روز تا سررسید!`
                        : `موعد پرداخت: ${toPersianDigits(loan.dueDay)}ام ماه`}
                    </span>

                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={payingId === loan.id}
                      onClick={() => handlePayInstallment(loan.id)}
                      className="text-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>پرداخت این قسط</span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for creating a new loan */}
      <CreateLoanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchLoans();
        }}
      />
    </div>
  );
}
