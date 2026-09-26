'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { Budget } from '@/types';
import { Target, Plus, AlertTriangle, CheckCircle2, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { getBudgets, deleteBudget } from '@/lib/client-api';

export default function BudgetsPage() {
  const { refreshKey, triggerRefresh, formatMoney } = useApp();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ categoryId: string; monthlyLimit: number } | undefined>();

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshKey]);

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('آیا از حذف این سقف بودجه اطمینان دارید؟')) return;

    try {
      await deleteBudget(id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget({
      categoryId: budget.categoryId,
      monthlyLimit: budget.monthlyLimit,
    });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingBudget(undefined);
    setIsModalOpen(true);
  };

  // Summary Metrics
  const totalLimit = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            سامانه بودجه‌بندی هوشمند
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            تعیین سقف هزینه برای هر دسته‌بندی و پایش لحظه‌ای انضباط مالی
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenNew}
          className="shadow-sm shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف سقف بودجه جدید</span>
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card hoverEffect className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            مجموع سقف بودجه‌های ماه
          </span>
          <div className="text-base sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight privacy-mask">
            {formatMoney(totalLimit)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            سقف مصوب برای {toPersianDigits(budgets.length)} دسته‌بندی
          </p>
        </Card>

        <Card hoverEffect className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            کل مبالغ مصرف‌شده
          </span>
          <div className="text-base sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight privacy-mask">
            {formatMoney(totalSpent)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {toPersianDigits(overallPct)}٪ از کل سقف بودجه مصرف شده
          </p>
        </Card>

        <Card hoverEffect className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            باقی‌مانده مجاز هزینه
          </span>
          <div className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight privacy-mask">
            {formatMoney(Math.max(0, totalLimit - totalSpent))}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            ظرفیت آزاد برای مخارج تا پایان ماه
          </p>
        </Card>
      </div>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6 text-indigo-500" />}
          title="هنوز هیچ بودجه‌ای تعریف نکرده‌اید"
          description="برای کنترل بهتر مخارج، برای دسته‌هایی مثل خوراک، حمل‌ونقل یا تفریح سقف ماهانه تعیین کنید."
          actionText="تعریف اولین سقف بودجه"
          onAction={handleOpenNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(100, b.percentage || 0);

            let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            let statusText = 'وضعیت ایمن';
            let barColor = 'bg-emerald-500';
            let badgeBg = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';

            if (b.status === 'danger') {
              statusIcon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
              statusText = 'هشدار سرریز بودجه!';
              barColor = 'bg-rose-500';
              badgeBg = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
            } else if (b.status === 'warning') {
              statusIcon = <AlertCircle className="w-4 h-4 text-amber-500" />;
              statusText = 'نزدیک به سقف (احتیاط)';
              barColor = 'bg-amber-500';
              badgeBg = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
            }

            return (
              <Card key={b.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  {/* Top: Icon, Category Name and Actions */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon
                        name={b.category?.icon || 'Tag'}
                        color={b.category?.color || '#6366f1'}
                        size="md"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {b.category?.name}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          سقف: <span className="privacy-mask">{formatMoney(b.monthlyLimit)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        title="ویرایش سقف"
                        aria-label="ویرایش سقف بودجه"
                        className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-8 min-h-8 flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        title="حذف بودجه"
                        aria-label="حذف بودجه"
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-8 min-h-8 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between text-xs mt-4 mb-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50 text-sm privacy-mask">
                      {formatMoney(b.spent || 0)}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${badgeBg}`}>
                      {toPersianDigits(b.percentage || 0)}٪
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer: Status & Remaining */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    {statusIcon}
                    <span className="text-zinc-600 dark:text-zinc-400">{statusText}</span>
                  </div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                    باقی: <span className="privacy-mask">{formatMoney(b.remaining || 0)}</span>
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingBudget={editingBudget}
        onSuccess={() => {
          setIsModalOpen(false);
          triggerRefresh();
        }}
      />
    </div>
  );
}
