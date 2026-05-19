"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-lg p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-lg p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Kanban column skeleton
export function KanbanColumnSkeleton() {
  return (
    <div className="w-72 shrink-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-4 ml-auto" />
      </div>
      <div className="space-y-2 min-h-[200px]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-base-card border border-base-border rounded-lg p-3 space-y-2"
          >
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Project card skeleton (for ProjectsView grid)
export function ProjectCardSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Finance stat skeleton
export function FinanceStatSkeleton() {
  return (
    <div className="bg-base-card border border-base-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <Skeleton className="h-6 w-28" />
    </div>
  );
}

// Transaction item skeleton
export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="h-7 w-7 rounded-md shrink-0" />
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="text-right shrink-0 ml-3 space-y-1.5">
        <Skeleton className="h-3 w-20 ml-auto" />
        <Skeleton className="h-2.5 w-16 ml-auto" />
      </div>
    </div>
  );
}

// Cover image skeleton
export function CoverSkeleton() {
  return (
    <Skeleton className="w-full h-32 md:h-40 rounded-lg" />
  );
}

// Project detail header skeleton
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-5xl">
      {/* Cover image */}
      <CoverSkeleton />
      {/* Navigation bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      {/* Info card */}
      <div className="bg-base-card border border-base-border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-7 w-28 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>
      {/* Tab skeleton */}
      <div className="bg-base-card border border-base-border rounded-lg p-4">
        <Skeleton className="h-9 w-full mb-4 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
