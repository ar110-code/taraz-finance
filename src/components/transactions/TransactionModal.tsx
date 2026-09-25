'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Category, Account, TransactionType } from '@/types';
import { amountToPersianWords, toEnglishDigits, toPersianDigits, formatToman } from '@/lib/utils';
import { parseBankSMS } from '@/lib/smsParser';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Tag, CreditCard, AlignLeft, Sparkles, MessageSquare, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_BANK_SMS = [
  {
    bank: 'بانک ملت',
    text: 'بانک ملت\nبرداشت مبلغ ۳,۴۵۰,۰۰۰ ریال\nاز حساب: ۱۲۳۴۵۶۷۸۹۰\nموجودی: ۴۵,۰۰۰,۰۰۰ ریال\n۱۴۰۳/۰۶/۲۵-۱۶:۳۰\nخرید از افق کوروش',
  },
  {
    bank: 'بلوبانک',
    text: 'خرید با کارت بلو\nمبلغ: ۴۵۰,۰۰۰ تومان\nاز: اسنپ فود\nمانده: ۳,۲۵۰,۰۰۰ تومان\n۱۴۰۳/۰۶/۲۵',
  },
  {
    bank: 'بانک سامان',
    text: 'بانک سامان\nبرداشت از ۶۲۱۹۸۶******۴۳۲۱\nمبلغ: ۲,۰۰۰,۰۰۰ ریال\nبابت: کافه لمیز\nمانده: ۱۲,۵۰۰,۰۰۰ ریال\n۱۴۰۳/۰۶/۲۵ ۱۸:۴۵',
  },
  {
    bank: 'بانک ملی',
    text: 'بانک ملی ایران\nانتقال به ۶۰۳۷۹۹******۱۲۳۴\nمبلغ: ۱,۲۰۰,۰۰۰ ریال\nبابت: اسنپ\nمانده: ۲۵,۸۰۰,۰۰۰ ریال\n۱۴۰۳/۰۶/۲۵ ۱۵:۲۲',
  },
  {
    bank: 'بانک رسالت',
    text: 'بانک قرض الحسنه رسالت\nواریز به حساب ۱۰.۱۲۳۴۵۶.۱\nمبلغ: ۲۵,۰۰۰,۰۰۰ ریال\nمانده: ۳۱,۰۰۰,۰۰۰ ریال\nبابت: حقوق شهریور\n۱۴۰۳/۰۶/۲۵',
  },
];

export function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Smart SMS Reader State
  const [showSmsReader, setShowSmsReader] = useState(false);
  const [smsInput, setSmsInput] = useState('');
  const [smsFeedback, setSmsFeedback] = useState<{ message: string; isSuccess: boolean } | null>(null);

  // Fetch categories and accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      setErrorMessage('');
      Promise.all([
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ])
        .then(([catRes, accRes]) => {
          if (catRes.success) setCategories(catRes.data);
          if (accRes.success) {
            setAccounts(accRes.data);
            if (accRes.data.length > 0 && !accountId) {
              setAccountId(accRes.data[0].id);
            }
          }
        })
        .finally(() => setLoadingData(false));
    }
  }, [isOpen]);

  // Set default category when type or categories change
  useEffect(() => {
    const filteredCats = categories.filter((c) => c.type === type);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    }
  }, [type, categories]);

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

  const handleParseAndApplySms = (textToParse: string) => {
    setSmsFeedback(null);
    if (!textToParse.trim()) {
      setSmsFeedback({ message: 'لطفاً متن پیامک را وارد کنید', isSuccess: false });
      return;
    }

    const parsed = parseBankSMS(textToParse);
    if (!parsed.success || parsed.amount <= 0) {
      setSmsFeedback({
        message: parsed.error || 'امکان استخراج مبلغ از پیامک وجود نداشت',
        isSuccess: false,
      });
      return;
    }

    // 1. Set Type
    setType(parsed.type);

    // 2. Set Amount (Toman)
    setAmountRaw(parsed.amount.toLocaleString('en-US'));

    // 3. Set Title
    if (parsed.merchantOrParty) {
      setTitle(parsed.type === 'expense' ? `خرید از ${parsed.merchantOrParty}` : `واریز ${parsed.merchantOrParty}`);
    } else if (parsed.bankName) {
      setTitle(parsed.type === 'expense' ? `برداشت ${parsed.bankName}` : `واریز به ${parsed.bankName}`);
    } else {
      setTitle(parsed.type === 'expense' ? 'خرید / برداشت کارت' : 'واریز به حساب');
    }

    // 4. Set Date
    if (parsed.date) {
      setDate(parsed.date);
    }

    // 5. Set Note
    setNote(textToParse.trim());

    // 6. Match Account
    if (parsed.bankName && accounts.length > 0) {
      const matchedAcc = accounts.find(
        (a) => a.bankName.includes(parsed.bankName!) || a.name.includes(parsed.bankName!)
      );
      if (matchedAcc) {
        setAccountId(matchedAcc.id);
      }
    }

    // 7. Match Category
    if (parsed.predictedCategory?.name && categories.length > 0) {
      const typeCats = categories.filter((c) => c.type === parsed.type);
      const matchedCat = typeCats.find(
        (c) =>
          c.name.includes(parsed.predictedCategory!.name) ||
          parsed.predictedCategory!.name.includes(c.name)
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }

    setSmsFeedback({
      message: `✓ شناسایی شد: ${parsed.bankName || 'بانک'} | ${formatToman(parsed.amount)} | دسته: ${parsed.predictedCategory?.name || '-'}`,
      isSuccess: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage('لطفاً مبلغ تراکنش را به درستی وارد کنید');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('لطفاً عنوان تراکنش را وارد کنید');
      return;
    }
    if (!categoryId) {
      setErrorMessage('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }
    if (!accountId) {
      setErrorMessage('لطفاً حساب مبدا را انتخاب کنید');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          title: title.trim(),
          categoryId,
          accountId,
          date,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'خطا در ثبت تراکنش');
      }

      // Celebratory micro-interaction for successful transaction
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      // Reset form
      setAmountRaw('');
      setTitle('');
      setNote('');
      setSmsInput('');
      setSmsFeedback(null);
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت تراکنش جدید"
      description="تراکنش مالی خود را با جزئیات کامل ثبت کنید"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Smart Bank SMS Reader Accordion */}
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/20 p-3 sm:p-3.5 transition-all shadow-xs">
          <button
            type="button"
            onClick={() => setShowSmsReader(!showSmsReader)}
            className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>استخراج خودکار از پیامک بانک</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-normal">
                هوشمند
              </span>
            </div>
            {showSmsReader ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-indigo-500" />}
          </button>

          {showSmsReader && (
            <div className="mt-3 space-y-2.5 pt-2.5 border-t border-indigo-100 dark:border-indigo-900/40 animate-in fade-in slide-in-from-top-2 duration-150">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                متن پیامک کسر یا واریز بانک را اینجا جای‌گذاری کنید یا یکی از نمونه‌ها را انتخاب نمایید:
              </p>

              {/* Sample Bank Chips */}
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_BANK_SMS.map((sample) => (
                  <button
                    key={sample.bank}
                    type="button"
                    onClick={() => {
                      setSmsInput(sample.text);
                      handleParseAndApplySms(sample.text);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {sample.bank}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={smsInput}
                  onChange={(e) => {
                    setSmsInput(e.target.value);
                    if (e.target.value.trim().length > 15) {
                      handleParseAndApplySms(e.target.value);
                    }
                  }}
                  placeholder="متن پیامک بانک را اینجا Paste کنید..."
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                />
              </div>

              {/* Parse Button & Status */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleParseAndApplySms(smsInput)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تحلیل و اعمال در فرم</span>
                </Button>

                {smsFeedback && (
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      smsFeedback.isSuccess
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {smsFeedback.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Type Toggle: Expense / Income */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>هزینه</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>درآمد</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            مبلغ (تومان) *
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

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            عنوان تراکنش *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: خرید روزانه سوپرمارکت"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Category & Account Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              دسته‌بندی *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              حساب بانکی *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.bankName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            تاریخ تراکنش *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Note Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            توضیحات و یادداشت (اختیاری)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="یادداشت تکمیلی در مورد تراکنش..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button
            type="submit"
            variant={type === 'expense' ? 'danger' : 'success'}
            size="sm"
            isLoading={isSubmitting}
          >
            {type === 'expense' ? 'ثبت هزینه' : 'ثبت درآمد'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
