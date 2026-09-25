'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, Delete, KeyRound, Sparkles } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils';

interface LockScreenProps {
  onUnlock: (pin: string) => boolean;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleKeyPress = useCallback((num: string) => {
    setIsError(false);
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      return prev + num;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setIsError(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // When PIN reaches 4 digits, attempt unlock
  useEffect(() => {
    if (pin.length === 4) {
      const success = onUnlock(pin);
      if (success) {
        setIsSuccess(true);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 600);
      }
    }
  }, [pin, onUnlock]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none transition-opacity duration-300 ${isSuccess ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* App Badge / Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              تَـراز
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              رمز عبور ۴ رقمی خود را وارد فرمایید
            </p>
          </div>
        </div>

        {/* 4 PIN Dots */}
        <div className={`flex items-center gap-4 py-2 ${isError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-rose-500 scale-110 shadow-sm shadow-rose-500/50'
                    : isFilled
                    ? 'bg-indigo-500 scale-110 shadow-sm shadow-indigo-500/50'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Hint Message */}
        <div className="min-h-5 text-center">
          {isError ? (
            <span className="text-xs font-bold text-rose-400 animate-in fade-in">
              رمز عبور نادرست است
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">
              رمز پیش‌فرض: <strong className="text-zinc-400">۱۲۳۴</strong>
            </span>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-zinc-700 text-white font-sans text-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              {toPersianDigits(digit)}
            </button>
          ))}

          {/* Empty spacer */}
          <div />

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-zinc-700 text-white font-sans text-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {toPersianDigits('0')}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 active:scale-95 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="پاک کردن"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
