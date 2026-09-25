'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Category } from '@/types';
import { amountToPersianWords, toEnglishDigits, toPersianDigits } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingBudget?: { categoryId: string; monthlyLimit: number };
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  existingBudget,
}: BudgetModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      fetch('/api/categories?type=expense')
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setCategories(res.data);
            if (existingBudget) {
              setCategoryId(existingBudget.categoryId);
              setAmountRaw(existingBudget.monthlyLimit.toLocaleString('en-US'));
            } else if (res.data.length > 0) {
              setCategoryId(res.data[0].id);
              setAmountRaw('');
            }
          }
        });
    }
  }, [isOpen, existingBudget]);

  const numAmount = parseInt(toEnglishDigits(amountRaw.replace(/,/g, '')), 10) || 0;
  const wordsPreview = amountToPersianWords(numAmount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value.replace(/[^0-9۰-۹]/g, ''));
    if (!raw) {
      setAmountRaw('');
      return;
    }
    const val = parseInt(raw, 10);
    setAmountRaw(val.toLocaleString('en-US'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage('لطفاً مبلغ سقف بودجه را به درستی وارد کنید');
      return;
    }
    if (!categoryId) {
      setErrorMessage('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          monthlyLimit: numAmount,
          period: currentPeriod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'خطا در ثبت بودجه');
      }

      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      }

      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingBudget ? 'ویرایش سقف بودجه' : 'تعریف بودجه ماهانه جدید'}
      description="برای دسته‌بندی هزینه‌ای مورد نظر خود سقف ماهانه تعیین کنید"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            دسته‌بندی هزینه *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!existingBudget}
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-60"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Limit Amount */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            سقف بودجه ماهانه (تومان) *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw ? toPersianDigits(amountRaw) : ''}
              onChange={handleAmountChange}
              placeholder="۰"
              dir="ltr"
              className="w-full text-left text-lg font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">
              تومان
            </span>
          </div>
          {wordsPreview && (
            <p className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 mt-1.5 pe-1 leading-relaxed">
              معادل: {wordsPreview}
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            ذخیره سقف بودجه
          </Button>
        </div>
      </form>
    </Modal>
  );
}
