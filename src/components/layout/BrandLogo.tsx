import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function BrandLogo({ className = '', size = 'md', withText = true }: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Geometric SVG Logomark */}
      <div className={`relative shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-200 hover:scale-105"
        >
          <defs>
            <linearGradient id="tarazBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>

            <linearGradient id="tarazStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>

            <linearGradient id="tarazDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            <linearGradient id="rimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Squircle Base with Rim Light */}
          <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#tarazBgGrad)" />
          <rect x="2.5" y="2.5" width="95" height="95" rx="25.5" stroke="url(#rimGrad)" strokeWidth="1.5" />

          {/* Two Persian "Te" Glowing Diamonds (نقاط ت) */}
          <rect x="37" y="16" width="9" height="9" rx="2" transform="rotate(45 41.5 20.5)" fill="url(#tarazDotGrad)" />
          <rect x="52" y="16" width="9" height="9" rx="2" transform="rotate(45 56.5 20.5)" fill="url(#tarazDotGrad)" />

          {/* Letterform "ت" Base Curve */}
          <path
            d="M 23 48 C 23 68, 38 78, 50 78 C 62 78, 77 68, 77 48"
            stroke="url(#tarazStrokeGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Center Fulcrum Post (ستون تراز) */}
          <path
            d="M 50 36 V 78"
            stroke="url(#tarazStrokeGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Dynamic Balance Beam (اهرم رشد مالی) */}
          <path
            d="M 26 42 Q 50 38 74 34"
            stroke="url(#tarazStrokeGrad)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Left Balance Pan (کفه چپ) */}
          <path
            d="M 26 42 L 20 54 H 32 Z"
            fill="url(#tarazStrokeGrad)"
            fillOpacity="0.8"
          />

          {/* Right Balance Pan (کفه رشد بالاتر - نماد سود و دارایی فزاینده) */}
          <path
            d="M 74 34 L 68 46 H 80 Z"
            fill="url(#tarazDotGrad)"
            fillOpacity="0.9"
          />

          {/* Center Pivot Jewel (نگین مرکزی شاهین ترازو) */}
          <circle cx="50" cy="38" r="3.5" fill="#ffffff" />
          <circle cx="50" cy="38" r="1.8" fill="#6366f1" />
        </svg>
      </div>

      {/* Typography Wordmark */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              تَـراز
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              هوشمند
            </span>
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
            TARAZ • SMART FINANCE
          </span>
        </div>
      )}
    </div>
  );
}
