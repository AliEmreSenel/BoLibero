"use client";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function RoomCardSkeleton() {
  return (
    <div className="flex min-h-[150px] sm:min-h-[188px] flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-none sm:h-12" />
    </div>
  );
}

export function SearchFiltersSkeleton() {
  return (
    <div className="mb-4 space-y-2 sm:rounded-2xl sm:border sm:bg-card sm:p-3">
      <Skeleton className="h-11 w-full" />
      <div className="flex gap-2"><Skeleton className="h-11 flex-1 rounded-full" /><Skeleton className="h-11 w-24 rounded-lg" /></div>
      <div className="flex flex-wrap gap-2"><Skeleton className="h-11 w-24 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /></div>
      <Skeleton className="hidden h-16 w-full sm:block" />
      <Skeleton className="h-4 w-56" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="hidden h-4 w-72 sm:block" />
      </div>
      <Skeleton className="h-12 w-52 rounded-xl" />
    </div>
  );
}

export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CalendarViewSkeleton() {
  return (
    <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="rounded-xl border bg-card p-3.5">
        <Skeleton className="mx-auto mb-3 h-6 w-36" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className={`h-11 rounded-lg ${index > 6 ? "hidden lg:block" : ""}`} />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-[999_1_560px] space-y-3 rounded-2xl border bg-card p-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <div className="mb-4 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="space-y-2 p-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-full rounded-none sm:h-12" />
      </div>
    </div>
  );
}
