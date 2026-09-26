'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/components/layout/AppLayout';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetProgressWidget } from '@/components/dashboard/BudgetProgressWidget';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { AnalyticsSummary, Transaction, Budget, Loan } from '@/types';
import { LoanAlarmBanner } from '@/components/loans/LoanAlarmBanner';
import { Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { getAnalytics, getTransactions, getBudgets, getLoans, deleteTransaction } from '@/lib/client-api';

export default function DashboardPage() {
  const { openTransactionModal, openResetModal, refreshKey, triggerRefresh } = useApp();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [analytics, txResult, budgets, loans] = await Promise.all([
        getAnalytics(),
        getTransactions({ limit: 6 }),
        getBudgets(),
        getLoans(),
      ]);
      setAnalytics(analytics);
      setRecentTransactions(txResult.transactions);
      setBudgets(budgets);
      setLoans(loans);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return;

    try {
      await deleteTransaction(id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            داشبورد مدیریت مالی
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            نمای کلی از وضعیت نقدینگی، درآمدها، هزینه‌ها و انضباط بودجه
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openResetModal}
            className="text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/60 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ریست</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openTransactionModal}
            className="shadow-sm shadow-indigo-500/20 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش</span>
          </Button>
        </div>
      </div>

      {/* Loan Due Alarm Banner (high priority alarm for upcoming/overdue installments) */}
      <LoanAlarmBanner loans={loans} onRefresh={fetchDashboardData} />

      {/* Top 3 Overview Sections (All visible simultaneously without swiping/tabs) */}
      {analytics && <OverviewSection analytics={analytics} />}

      {/* Bottom Grid: Recent Transactions (2 cols) & Budget Progress (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={recentTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenModal={openTransactionModal}
          />
        </div>
        <div>
          <BudgetProgressWidget budgets={budgets} />
        </div>
      </div>
    </div>
  );
}
