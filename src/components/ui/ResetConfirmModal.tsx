'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'zero' | 'seed') => void;
  isLoading: boolean;
}

export function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: ResetConfirmModalProps) {
  const [mode, setMode] = React.useState<'zero' | 'seed'>('zero');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="بازنشانی اطلاعات برنامه"
      description="نوع عملیات بازنشانی را انتخاب فرمایید"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Reset Mode Options */}
        <div className="space-y-2">
          {/* Zero Option */}
          <label
            onClick={() => setMode('zero')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              mode === 'zero'
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <input
              type="radio"
              name="resetMode"
              checked={mode === 'zero'}
              onChange={() => setMode('zero')}
              className="mt-1 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                صفر کردن کامل اطلاعات (شروع از صفر)
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-relaxed">
                تمام تراکنش‌ها، بودجه‌ها و اقساط پاک شده و موجودی کلیه حساب‌ها دقیقا برابر ۰ تومان می‌شود.
              </span>
            </div>
          </label>

          {/* Seed Option */}
          <label
            onClick={() => setMode('seed')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              mode === 'seed'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <input
              type="radio"
              name="resetMode"
              checked={mode === 'seed'}
              onChange={() => setMode('seed')}
              className="mt-1 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                بازنشانی به داده‌های آزمایشی و نمونه
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-relaxed">
                بارگذاری مجدد تراکنش‌های ۶ ماه اخیر و حساب‌های نمونه با موجودی آزمایشی.
              </span>
            </div>
          </label>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            این عملیات غیرقابل بازگشت است. لطفاً پیش از تأیید، از انتخاب خود اطمینان حاصل فرمایید.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant={mode === 'zero' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={() => onConfirm(mode)}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{mode === 'zero' ? 'تأیید و صفر کردن همه' : 'تأیید و بارگذاری نمونه'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
