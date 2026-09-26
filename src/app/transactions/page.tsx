'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatToman, formatShamsiDate, toPersianDigits } from '@/lib/utils';
import { Transaction, Category, Account, TransactionType } from '@/types';
import {
  Search,
  Download,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { getCategories, getAccounts, getTransactions, deleteTransaction, exportToCSV } from '@/lib/client-api';

export default function TransactionsPage() {
  const { openTransactionModal, refreshKey, triggerRefresh, formatMoney } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Fetch Categories & Accounts
  useEffect(() => {
    Promise.all([
      getCategories(),
      getAccounts(),
    ]).then(([cats, accs]) => {
      setCategories(cats);
      setAccounts(accs);
    });
  }, []);

  // Fetch Transactions with Filters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTransactions({
        query: searchQuery || undefined,
        type: (selectedType as TransactionType) || undefined,
        categoryId: selectedCategory || undefined,
        accountId: selectedAccount || undefined,
        limit: 100,
      });
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedCategory, selectedAccount]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟ این مبلغ مجدداً در موجودی حساب شما اعمال می‌شود.')) {
      return;
    }

    try {
      await deleteTransaction(id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedAccount('');
  };

  const handleExportCSV = async () => {
    const csv = await exportToCSV(selectedType || undefined);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'taraz-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    Boolean(searchQuery) || Boolean(selectedType) || Boolean(selectedCategory) || Boolean(selectedAccount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            دفتر کل تراکنش‌ها
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            ثبت، جستجو، تفکیک و خروجی گزارش کلیه درآمدها و هزینه‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={openTransactionModal}
            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs sm:text-sm shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثبت با پیامک</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-zinc-700 dark:text-zinc-300 flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openTransactionModal}
            className="shadow-sm shadow-indigo-500/20 flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar Card */}
      <Card className="p-3 sm:p-4 space-y-2.5">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان یا یادداشت تراکنش..."
            className="w-full pe-10 ps-3.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Type Toggle: All / Expense / Income (full width on mobile) */}
          <div className="grid grid-cols-3 w-full lg:w-auto p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
            <button
              onClick={() => setSelectedType('')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                selectedType === ''
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              همه ({toPersianDigits(total)})
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                selectedType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              هزینه‌ها
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                selectedType === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              درآمدها
            </button>
          </div>

          {/* Category & Account in 2-col grid on mobile */}
          <div className="grid grid-cols-2 gap-2 w-full lg:w-auto flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">همه حساب‌ها</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 shrink-0 self-center"
            >
              پاک‌سازی فیلترها
            </Button>
          )}
        </div>
      </Card>

      {/* Transactions Container */}
      <Card className="overflow-hidden p-0 border-zinc-200/80 dark:border-zinc-800/80">
        {isLoading ? (
          <div className="p-4 sm:p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="هیچ تراکنشی یافت نشد"
            description={
              hasActiveFilters
                ? 'با فیلترهای انتخابی موردی ثبت نشده است. می‌توانید فیلترها را تغییر داده یا پاک کنید.'
                : 'هنوز هیچ تراکنشی ثبت نکرده‌اید. با دکمه ثبت تراکنش جدید آغاز کنید.'
            }
            actionText={hasActiveFilters ? 'پاک کردن فیلترها' : 'ثبت اولین تراکنش'}
            onAction={hasActiveFilters ? resetFilters : openTransactionModal}
            className="m-4 sm:m-6 border-0 bg-transparent"
          />
        ) : (
          <>
            {/* Mobile View: Clean Card List (< md screens) */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 md:hidden">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <CategoryIcon
                        name={tx.category?.icon || 'Tag'}
                        color={tx.category?.color || '#6366f1'}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {tx.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span>{tx.category?.name || 'عمومی'}</span>
                          <span>•</span>
                          <span>{formatShamsiDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-left">
                        <div
                          className="text-xs font-black flex items-center justify-end gap-1"
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
                        <span className="text-[10px] text-zinc-400 block text-left">
                          {tx.account?.name || 'حساب'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(tx.id)}
                        title="حذف"
                        aria-label="حذف تراکنش"
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer min-w-8 min-h-8 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table (md+ screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">عنوان و دسته‌بندی</th>
                    <th className="py-3.5 px-4">حساب بانکی</th>
                    <th className="py-3.5 px-4">تاریخ</th>
                    <th className="py-3.5 px-4 text-left">مبلغ</th>
                    <th className="py-3.5 px-4 w-12 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors group"
                      >
                        {/* Title & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <CategoryIcon
                              name={tx.category?.icon || 'Tag'}
                              color={tx.category?.color || '#6366f1'}
                              size="md"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                                {tx.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {tx.category?.name || 'دسته‌بندی نشده'}
                                </span>
                                {tx.note && (
                                  <>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                                      {tx.note}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Account */}
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                          <Badge variant="neutral" size="sm">
                            {tx.account?.name || 'حساب پیش‌فرض'}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                          {formatShamsiDate(tx.date)}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-left">
                          <div
                            className="inline-flex items-center gap-1 font-black"
                            dir="rtl"
                          >
                            <span className={isIncome ? 'text-emerald-500 font-bold select-none' : 'text-rose-500 font-bold select-none'}>
                              {isIncome ? '+' : '−'}
                            </span>
                            <span
                              className={`privacy-mask ${
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                              }`}
                            >
                              {formatMoney(tx.amount)}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="حذف تراکنش"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
