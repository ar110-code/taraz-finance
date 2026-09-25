import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function BrandLogo({ className = '', size = 'md', withText = true }: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Geometric SVG Logomark */}
      <div className={`relative shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        >
          <defs>
            <linearGradient id="brandLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="18" fill="url(#brandLogoGrad)" />
          {/* Modern Geometric Scale & Growth Line */}
          <path d="M32 15V49" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M17 24C23 22 41 22 47 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M13 36C13 41 21 41 21 36L17 24L13 36Z" fill="#ffffff" fillOpacity="0.9" />
          <path d="M43 33C43 38 51 38 51 33L47 24L43 33Z" fill="#ffffff" fillOpacity="0.9" />
          <circle cx="32" cy="15" r="3" fill="#ffffff" />
          <circle cx="32" cy="49" r="3.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Wordmark */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              تَـراز
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              مالی
            </span>
          </div>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
            TARAZ FINANCE
          </span>
        </div>
      )}
    </div>
  );
}
