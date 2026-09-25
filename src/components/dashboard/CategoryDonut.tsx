'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { PieChart } from 'lucide-react';

interface CategoryDonutProps {
  categories: {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    totalAmount: number;
    percentage: number;
  }[];
  compact?: boolean;
}

export function CategoryDonut({ categories, compact = false }: CategoryDonutProps) {
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  if (!categories || categories.length === 0) {
    return (
      <Card className="flex flex-col h-full items-center justify-center p-8 text-center">
        <PieChart className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
        <CardTitle className="text-sm">هنوز هزینه‌ای در این ماه ثبت نشده است</CardTitle>
        <CardDescription>با ثبت اولین تراکنش هزینه، نمودار دسته‌ها نمایش داده می‌شود</CardDescription>
      </Card>
    );
  }

  // Calculate SVG stroke dashes for Donut chart
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = categories.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeCategory = hoveredCatId
    ? categories.find((c) => c.categoryId === hoveredCatId)
    : categories[0];

  return (
    <Card className={`flex flex-col h-full justify-between ${compact ? 'p-2.5 sm:p-4' : 'p-4 sm:p-6'}`}>
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {compact ? 'تفکیک مخارج' : 'تفکیک مخارج این ماه'}
          </span>
        </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center gap-2 py-1`}>
        {/* SVG Donut */}
        <div className={`relative ${compact ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-36 h-36'} shrink-0 flex items-center justify-center`}>
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 select-none">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800/60"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredCatId === slice.categoryId;
              return (
                <circle
                  key={slice.categoryId}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCatId(slice.categoryId)}
                  onMouseLeave={() => setHoveredCatId(null)}
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-1">
            <span className="text-[9px] sm:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[65px] px-0.5">
              {activeCategory?.categoryName}
            </span>
            <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {activeCategory ? `${toPersianDigits(activeCategory.percentage)}٪` : '۰٪'}
            </span>
          </div>
        </div>

        {/* Categories Legend List */}
        <div className={`w-full ${compact ? 'space-y-0.5' : 'space-y-1.5 max-h-48 overflow-y-auto'} pe-0.5`}>
          {categories.slice(0, compact ? 3 : 5).map((cat) => {
            const isHovered = hoveredCatId === cat.categoryId;
            return (
              <div
                key={cat.categoryId}
                onMouseEnter={() => setHoveredCatId(cat.categoryId)}
                onMouseLeave={() => setHoveredCatId(null)}
                className={`flex items-center justify-between gap-1 px-1.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs transition-colors cursor-pointer ${
                  isHovered
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!compact && (
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap privacy-mask">
                      {formatToman(cat.totalAmount)}
                    </span>
                  )}
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 min-w-6 text-left">
                    {toPersianDigits(cat.percentage)}٪
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
