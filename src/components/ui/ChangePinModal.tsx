'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onSuccess: (newPin: string) => void;
}

export function ChangePinModal({
  isOpen,
  onClose,
  currentPin,
  onSuccess,
}: ChangePinModalProps) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = () => {
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOld = toEnglishDigits(oldPin.trim());
    const cleanNew = toEnglishDigits(newPin.trim());
    const cleanConfirm = toEnglishDigits(confirmPin.trim());

    if (cleanOld !== currentPin) {
      setError('رمز عبور فعلی نادرست است (رمز پیش‌فرض: ۱۲۳۴)');
      return;
    }

    if (!/^\d{4}$/.test(cleanNew)) {
      setError('رمز عبور جدید باید دقیقاً ۴ رقم عددی باشد');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('تکرار رمز جدید با رمز جدید همخوانی ندارد');
      return;
    }

    // Success
    setIsSuccess(true);
    if (typeof window !== 'undefined') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }

    setTimeout(() => {
      onSuccess(cleanNew);
      handleClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="تغییر رمز عبور برنامه (PIN)"
      description="برای افزایش امنیت دسترسی به داده‌های مالی، رمز ۴ رقمی جدیدی تعیین کنید"
      maxWidth="sm"
      zIndex="z-[10000]"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            رمز عبور با موفقیت تغییر یافت
          </h3>
          <p className="text-xs text-zinc-500">
            از این پس برای ورود به برنامه از رمز جدید استفاده کنید.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current PIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              رمز عبور فعلی (پیش‌فرض: {toPersianDigits('1234')})
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
              placeholder="••••"
              required
              autoFocus
              className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              رمز عبور جدید (۴ رقم)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••"
              required
              className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              required
              className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1 shadow-sm shadow-indigo-500/20"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ذخیره رمز جدید</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}