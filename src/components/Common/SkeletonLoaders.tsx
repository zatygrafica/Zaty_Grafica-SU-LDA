import React from 'react';
import { cn } from '@/utils/cn';

type SkeletonProps = {
  className?: string;
};

const SkeletonLine: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse rounded-full bg-gray-200/70 dark:bg-neutral-800/70',
      className,
    )}
  />
);

const SkeletonCard: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900/70 p-4 space-y-4 animate-pulse',
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-neutral-800" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-2/3" />
        <SkeletonLine className="h-3 w-1/3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-5/6" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <SkeletonLine className="h-8 w-20" />
      <SkeletonLine className="h-8 w-20" />
    </div>
  </div>
);

export const CardGridSkeleton: React.FC<{
  cards?: number;
}> = ({ cards = 6 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: cards }).map((_, index) => (
      <SkeletonCard key={`card-skeleton-${index}`} />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 6, columns = 5 }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900/70">
    <div className="border-b border-gray-100/80 dark:border-white/10 bg-gray-50/40 dark:bg-neutral-900/40 p-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, idx) => (
          <SkeletonLine key={`table-head-${idx}`} className="h-4 w-5/6" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-100/80 dark:divide-white/5">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`table-row-${rowIdx}`} className="p-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <SkeletonLine key={`table-cell-${rowIdx}-${colIdx}`} className="h-3 w-4/5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StackedListSkeleton: React.FC<{
  rows?: number;
}> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={`stacked-item-${index}`}
        className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900/70 p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-4">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-4 w-20" />
        </div>
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-5/6" />
        <div className="flex gap-3 pt-2">
          <SkeletonLine className="h-8 w-24" />
          <SkeletonLine className="h-8 w-16" />
        </div>
      </div>
    ))}
  </div>
);

