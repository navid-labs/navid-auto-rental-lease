export function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="매물 불러오는 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border bg-[var(--chayong-bg)]"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-[var(--chayong-surface)]" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="mt-1 h-px bg-[var(--chayong-divider)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--chayong-surface)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
