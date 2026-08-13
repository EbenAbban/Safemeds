import { cn } from "./cn";

/**
 * Loading placeholders (§54 — "do not use generic 'Loading…' everywhere").
 *
 * Two rules the composed skeletons below all follow:
 *
 * 1. A skeleton must mirror the shape of what replaces it. A placeholder with
 *    different proportions to the real content trades a spinner for a layout
 *    shift, which is worse — it costs CLS and makes the page feel unstable.
 *
 * 2. Exactly one `aria-busy` live region per group, never per bar. Screen
 *    readers should hear "loading consultations" once, not forty anonymous
 *    blank elements. Individual bars are `aria-hidden`.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded", className)} />;
}

function Group({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** A single content card: media block, title, two lines of body. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Group
      label="Loading content"
      className={cn(
        "rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container",
        className
      )}
    >
      <Skeleton className="mb-4 h-32 w-full rounded-md" />
      <Skeleton className="mb-3 h-5 w-2/3" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </Group>
  );
}

/** Greeting, stat tiles, then a card grid — the client dashboard's shape. */
export function DashboardSkeleton() {
  return (
    <Group label="Loading dashboard" className="space-y-8">
      <div>
        <Skeleton className="mb-3 h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container"
          >
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Group>
  );
}

/**
 * Admin tables. Renders the desktop row grid and the mobile card stack behind
 * the same breakpoints the real tables use (§69), so the placeholder doesn't
 * reflow into a different layout the moment data lands.
 */
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Group label="Loading table" className="w-full">
      <div className="hidden overflow-hidden rounded-lg border border-outline-variant/60 md:block">
        <div className="flex gap-4 border-b border-outline-variant/60 bg-surface-container-low p-4">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-4 border-b border-outline-variant/40 p-4 last:border-0">
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="rounded-lg border border-outline-variant/60 p-4">
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </Group>
  );
}

/**
 * Chat transcript. Alternates sides and varies bubble width so it reads as a
 * conversation rather than a stack of identical blocks — a uniform ladder is
 * instantly recognisable as a placeholder and looks unfinished.
 */
export function ChatSkeleton({ messages = 6 }: { messages?: number }) {
  const widths = ["w-3/5", "w-2/5", "w-4/5", "w-1/2", "w-3/4", "w-2/3"];

  return (
    <Group label="Loading conversation" className="space-y-4 p-4">
      {Array.from({ length: messages }, (_, i) => {
        const mine = i % 3 === 1;
        return (
          <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <Skeleton
              className={cn("h-12 rounded-xl", widths[i % widths.length])}
            />
          </div>
        );
      })}
    </Group>
  );
}

/** Avatar plus identity lines, for profile and pharmacist panels. */
export function ProfileSkeleton() {
  return (
    <Group label="Loading profile" className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
    </Group>
  );
}

/** Medication catalogue grid. */
export function MedicationSkeleton({ items = 6 }: { items?: number }) {
  return (
    <Group
      label="Loading medications"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: items }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container"
        >
          <Skeleton className="mb-4 h-24 w-full rounded-md" />
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-4 h-3 w-1/2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </Group>
  );
}

/** Delivery tracking: map panel above a status timeline. */
export function DeliverySkeleton({ steps = 5 }: { steps?: number }) {
  return (
    <Group label="Loading delivery" className="space-y-6">
      <Skeleton className="h-56 w-full rounded-lg sm:h-72" />
      <div className="space-y-5">
        {Array.from({ length: steps }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </Group>
  );
}
