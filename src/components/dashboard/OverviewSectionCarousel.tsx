'use client';

import React, { useState, useRef } from 'react';
import { StatCards } from './StatCards';
import { CashFlowChart } from './CashFlowChart';
import { CategoryDonut } from './CategoryDonut';
import { AnalyticsSummary } from '@/types';
import { Wallet, TrendingUp, PieChart, ChevronRight, ChevronLeft } from 'lucide-react';

interface OverviewSectionCarouselProps {
  analytics: AnalyticsSummary;
}

export function OverviewSectionCarousel({ analytics }: OverviewSectionCarouselProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  const tabs = [
    { title: 'خلاصه دارایی', icon: Wallet },
    { title: 'جریان ۶ ماهه', icon: TrendingUp },
    { title: 'تفکیک مخارج', icon: PieChart },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;

    // In RTL layout:
    // Swiping right-to-left (diff < -50) goes to NEXT tab (increase index)
    // Swiping left-to-right (diff > 50) goes to PREV tab (decrease index)
    if (diff < -50 && activeTab < 2) {
      setActiveTab((prev) => prev + 1);
    } else if (diff > 50 && activeTab > 0) {
      setActiveTab((prev) => prev - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Mobile-Only Segmented Tab Control */}
      <div className="lg:hidden flex items-center justify-between gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 select-none">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2]" />
              <span className="truncate">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile-Only Horizontal Sliding Carousel */}
      <div
        className="lg:hidden relative overflow-hidden rounded-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${activeTab * 100}%)` }}
        >
          {/* Slide 1: 4 Stat Cards */}
          <div className="w-full shrink-0">
            <StatCards analytics={analytics} />
          </div>

          {/* Slide 2: Cash Flow Chart */}
          <div className="w-full shrink-0">
            <CashFlowChart data={analytics.monthlyCashflow} />
          </div>

          {/* Slide 3: Category Donut Chart */}
          <div className="w-full shrink-0">
            <CategoryDonut categories={analytics.categoryBreakdown} />
          </div>
        </div>

        {/* Carousel Pagination Controls (Dots & Arrows) */}
        <div className="flex items-center justify-between pt-2 px-1 select-none">
          <button
            onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
            disabled={activeTab === 0}
            aria-label="قبلی"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                aria-label={`اسلاید ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeTab === idx
                    ? 'w-6 h-1.5 bg-indigo-600 dark:bg-indigo-400'
                    : 'w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveTab((prev) => Math.min(2, prev + 1))}
            disabled={activeTab === 2}
            aria-label="بعدی"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Standard View (lg+ screens) */}
      <div className="hidden lg:block space-y-6">
        <StatCards analytics={analytics} />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <CashFlowChart data={analytics.monthlyCashflow} />
          </div>
          <div>
            <CategoryDonut categories={analytics.categoryBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
