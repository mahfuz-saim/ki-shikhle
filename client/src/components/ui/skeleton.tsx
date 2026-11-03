import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-muted/60 dark:bg-muted/40 animate-pulse',
        shimmer && 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 dark:before:via-white/5 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b animate-in fade-in duration-150">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
        <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border bg-card/60 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-24 rounded-lg mt-2" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="pt-3 border-t flex items-center gap-2">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 sm:p-4 rounded-2xl border bg-card flex items-center justify-between gap-3"
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 sm:w-48 rounded" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 sm:w-36 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PageShellSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <CardGridSkeleton count={3} />
    </div>
  );
}

export function QuizTakingSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      {/* Top Quiz Bar */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border bg-card/80 backdrop-blur shadow-sm">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-48 sm:w-64 rounded-md" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
        <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
      </div>

      {/* Progress Bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Current Question Card */}
      <div className="rounded-3xl border shadow-lg bg-card p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-5/6 rounded-lg" />
          <Skeleton className="h-6 w-3/4 rounded-lg" />
        </div>

        {/* MCQ Options */}
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full p-4 rounded-2xl border bg-card flex items-center justify-between"
            >
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border bg-card flex items-start gap-3.5">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-3.5 w-5/6 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
