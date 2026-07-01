interface RowsProps {
  count?: number;
}

// Shimmer placeholder rows for list loading states.
export function SkeletonRows({ count = 3 }: RowsProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E6E8EE]" />
            <span className="h-3.5 w-40 animate-pulse rounded bg-[#E6E8EE]" />
            <span className="h-3.5 w-16 animate-pulse rounded bg-[#EEF0F4]" />
          </div>
          <div className="mt-3 h-2.5 w-56 animate-pulse rounded bg-[#EEF0F4]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card">
          <div className="h-8 w-14 animate-pulse rounded bg-[#E6E8EE]" />
          <div className="mt-2 h-2.5 w-20 animate-pulse rounded bg-[#EEF0F4]" />
        </div>
      ))}
    </div>
  );
}
