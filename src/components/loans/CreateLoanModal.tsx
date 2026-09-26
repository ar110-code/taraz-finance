'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Account } from '@/types';
import { toEnglishDigits, toPersianDigits, amountToPersianWords } from '@/lib/utils';
import { Landmark, Calendar, DollarSign, Layers } from 'lucide-react';
import { getAccounts, createLoan } from '@/lib/client-api';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLoanModal({ isOpen, onClose, onSuccess }: CreateLoanModalProps) {
  const [title, setTitle] = useState('');
  const [lender, setLender] = useState('');
  const [totalAmountRaw, setTotalAmountRaw] = useState('');
  const [installmentAmountRaw, setInstallmentAmountRaw] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [dueDay, setDueDay] = useState('5');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      getAccounts()
        .then((accs) => {
          if (accs.length > 0) {
            setAccounts(accs);
            if (!accountId) setAccountId(accs[0].id);
          }
        })
        .catch((err) => console.error('Failed to load accounts:', err));
    }
  }, [isOpen]);

  const numTotal = parseInt(toEnglishDigits(totalAmountRaw.replace(/,/g, '')), 10) || 0;
  const numInstallment = parseInt(toEnglishDigits(installmentAmountRaw.replace(/,/g, '')), 10) || 0;

  // Auto calculate installment when total and count are entered
  const handleTotalChange = (val: string) => {
    const raw = toEnglishDigits(val.replace(/[^0-9۰-۹]/g, ''));
    if (!raw) {
      setTotalAmountRaw('');
      return;
    }
    const num = parseInt(raw, 10);
    setTotalAmountRaw(num.toLocaleString('en-US'));

    const count = parseInt(totalInstallments, 10);
    if (count > 0 && !installmentAmountRaw) {
      setInstallmentAmountRaw(Math.round(num / count).toLocaleString('en-US'));
    }
  };

  const handleInstallmentChange = (val: string) => {
    const raw = toEnglishDigits(val.replace(/[^0-9۰-۹]/g, ''));
    if (!raw) {
      setInstallmentAmountRaw('');
      return;
    }
    const num = parseInt(raw, 10);
    setInstallmentAmountRaw(num.toLocaleString('en-US'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lender.trim()) {
      setErrorMsg('لطفاً عنوان وام و نام وام‌دهنده را وارد کنید');
      return;
    }
    if (numTotal <= 0 || numInstallment <= 0) {
      setErrorMsg('مبالغ وام و اقساط باید بزرگتر از صفر باشند');
      return;
    }
    if (!accountId) {
      setErrorMsg('لطفاً حساب بانکی متصل را انتخاب فرمایید');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createLoan({
        title: title.trim(),
        lender: lender.trim(),
        totalAmount: numTotal,
        installmentAmount: numInstallment,
        totalInstallments: parseInt(totalInstallments, 10) || 12,
        paidInstallments: parseInt(paidInstallments, 10) || 0,
        dueDay: parseInt(dueDay, 10) || 5,
        startDate,
        accountId,
      });

      // Reset
      setTitle('');
      setLender('');
      setTotalAmountRaw('');
      setInstallmentAmountRaw('');
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت وام و طرح اقساطی جدید"
      description="مشخصات وام، اقساط ماهانه و روز سررسید را وارد نمایید"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              عنوان وام یا خرید قسطی *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: وام مسکن، خرید قسطی لپ‌تاپ"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              وام‌دهنده یا بانک *
            </label>
            <input
              type="text"
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              placeholder="مثال: بانک ملی، اسنپ‌پی، دیجی‌پی"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              مبلغ کل وام (تومان) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={totalAmountRaw ? toPersianDigits(totalAmountRaw) : ''}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="۰"
              dir="ltr"
              className="w-full text-left font-bold px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {numTotal > 0 && (
              <p className="text-[11px] text-zinc-400 mt-1 truncate">
                {amountToPersianWords(numTotal)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              مبلغ هر قسط ماهانه (تومان) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={installmentAmountRaw ? toPersianDigits(installmentAmountRaw) : ''}
              onChange={(e) => handleInstallmentChange(e.target.value)}
              placeholder="۰"
              dir="ltr"
              className="w-full text-left font-bold px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {numInstallment > 0 && (
              <p className="text-[11px] text-zinc-400 mt-1 truncate">
                {amountToPersianWords(numInstallment)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              تعداد کل اقساط
            </label>
            <input
              type="number"
              min="1"
              max="360"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              اقساط پرداخت‌شده
            </label>
            <input
              type="number"
              min="0"
              max={totalInstallments || '100'}
              value={paidInstallments}
              onChange={(e) => setPaidInstallments(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              روز سررسید ماه
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="مثلاً ۵"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              تاریخ شروع وام
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              حساب بانکی کسر اقساط
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            <Landmark className="w-3.5 h-3.5" />
            <span>ثبت طرح اقساطی</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
