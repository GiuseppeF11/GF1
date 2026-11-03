/** Shimmering placeholder block. Width/height come from className. */
export const Skeleton = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded bg-f1-border/40 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
  </div>
);

/** Placeholder rows shaped like a standings / results table. */
export const SkeletonRows = ({ rows = 5, showAvatar = true }) => (
  <div className="divide-y divide-f1-border/30" aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-4 w-4 flex-shrink-0" />
        {showAvatar && <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32 max-w-full" />
          <Skeleton className="h-2.5 w-20 max-w-full" />
        </div>
        <Skeleton className="h-4 w-8 flex-shrink-0" />
      </div>
    ))}
  </div>
);

/** Placeholder for the hero card at the top of Home and GP detail. */
export const SkeletonHero = () => (
  <div className="rounded-3xl border border-f1-border bg-f1-surface/60 overflow-hidden" aria-hidden="true">
    <Skeleton className="h-1 w-full rounded-none" />
    <div className="space-y-4 p-5 sm:p-8">
      <Skeleton className="h-5 w-28 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="flex gap-2 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-[52px] flex-shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
