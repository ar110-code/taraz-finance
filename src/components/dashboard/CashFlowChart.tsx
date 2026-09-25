'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface CashFlowChartProps {
  data: { monthName: string; income: number; expense: number }[];
  compact?: boolean;
}

const SHORT_MONTHS: Record<string, string> = {
  'فروردین': 'فرو',
  'اردیبهشت': 'اردیـ',
  'خرداد': 'خرد',
  'تیر': 'تیر',
  'مرداد': 'مرد',
  'شهریور': 'شهر',
  'مهر': 'مهر',
  'آبان': 'آبان',
  'آذر': 'آذر',
  'دی': 'دی',
  'بهمن': 'بهمن',
  'اسفند': 'اسف',
};

export function CashFlowChart({ data, compact = false }: CashFlowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  // Find max value for scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000000
  );

  const chartHeight = compact ? 110 : 170;
  const barWidth = compact ? 9 : 14;
  const gapBetweenBars = compact ? 3 : 4;
  const groupWidth = barWidth * 2 + gapBetweenBars;
  const totalWidth = compact ? 320 : 500;
  const spacing = (totalWidth - data.length * groupWidth) / (data.length + 1);

  return (
    <Card className={`flex flex-col h-full justify-between ${compact ? 'p-2.5 sm:p-4' : 'p-4 sm:p-6'}`}>
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {compact ? 'جریان نقدینگی' : 'جریان نقدینگی ۶ ماه اخیر'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">درآمد</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">هزینه</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className={`relative flex-1 ${compact ? 'min-h-[140px] pt-1 pb-1' : 'min-h-[200px] pt-3 pb-2'} flex items-end`}>
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight - pct * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={totalWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-zinc-100 dark:text-zinc-800/80 stroke-1"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Bar Groups */}
          {data.map((item, idx) => {
            const groupX = spacing + idx * (groupWidth + spacing);
            const incomeH = (item.income / maxVal) * chartHeight;
            const expenseH = (item.expense / maxVal) * chartHeight;

            const incomeY = chartHeight - incomeH;
            const expenseY = chartHeight - expenseH;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
                className="cursor-pointer transition-opacity duration-150"
              >
                {/* Income Bar (Emerald) */}
                <rect
                  x={groupX}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeH, 2)}
                  rx="4"
                  className={`fill-emerald-500 transition-all duration-200 ${
                    isHovered ? 'brightness-110' : 'opacity-90'
                  }`}
                />

                {/* Expense Bar (Rose) */}
                <rect
                  x={groupX + barWidth + gapBetweenBars}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseH, 2)}
                  rx="4"
                  className={`fill-rose-500 transition-all duration-200 ${
                    isHovered ? 'brightness-110' : 'opacity-90'
                  }`}
                />

                {/* Month Label */}
                <text
                  x={groupX + groupWidth / 2}
                  y={chartHeight + (compact ? 18 : 24)}
                  textAnchor="middle"
                  className={`text-[10px] sm:text-[11px] font-sans transition-colors ${
                    isHovered
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                      : 'fill-zinc-500 dark:fill-zinc-400 font-medium'
                  }`}
                >
                  {compact ? (SHORT_MONTHS[item.monthName] || item.monthName) : item.monthName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl px-3.5 py-2 text-xs shadow-lg pointer-events-none flex items-center gap-4 z-20 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className="text-[10px] text-zinc-400 block">
                {data[hoveredIndex].monthName}
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-emerald-400 font-bold">
                  +{formatToman(data[hoveredIndex].income)}
                </span>
                <span className="text-rose-400 font-bold">
                  -{formatToman(data[hoveredIndex].expense)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
