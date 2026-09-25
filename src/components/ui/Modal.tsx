'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  zIndex?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  zIndex = 'z-50',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className={cn('fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4', zIndex)}>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card (Bottom Sheet on Mobile, Centered Card on Desktop) */}
      <div
        className={cn(
          'relative w-full rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl z-10 transition-all duration-200 max-h-[88vh] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-bottom-4 duration-200',
          maxWidths[maxWidth]
        )}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="rounded-xl p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-10 min-h-10 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
