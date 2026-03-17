"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

export function RoomCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow min-h-[220px]">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Content area */}
        <div className="flex-grow">
          {/* Time Slot Badges */}
          <div className="mb-4 flex flex-wrap gap-2 min-h-[32px]">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Room Status */}
          <div className="mb-4">
            <Skeleton className="h-5 w-28" />
          </div>
        </div>

        {/* More Info Link */}
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export function SearchFiltersSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4 mb-4 items-end">
          <div className="xl:col-span-4 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="xl:col-span-2 space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="xl:col-span-2 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="xl:col-span-2 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="xl:col-span-2 space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Campus Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-6 w-80" />
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-5 w-48" />
      </div>
    </div>
  );
}

export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CalendarViewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="mb-8 text-center">
        <Skeleton className="h-9 w-32 mx-auto mb-2" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <div className="mt-4 flex items-center justify-center gap-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </>
  );
}
