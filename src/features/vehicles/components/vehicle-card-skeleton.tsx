export function VehicleCardSkeleton({
  count = 12,
  mode = 'grid',
}: {
  count?: number
  mode?: 'grid' | 'list'
}) {
  return (
    <div
      className={
        mode === 'grid'
          ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col gap-3'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border"
          aria-hidden="true"
        >
          {mode === 'grid' ? (
            <>
              <div className="aspect-[4/3] bg-secondary animate-pulse" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 w-20 rounded bg-secondary animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
                <div className="h-5 w-1/3 rounded bg-secondary animate-pulse" />
              </div>
            </>
          ) : (
            <div className="flex gap-4 p-3">
              <div className="w-[200px] shrink-0 aspect-[4/3] rounded-lg bg-secondary animate-pulse" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                <div className="h-5 w-1/3 rounded bg-secondary animate-pulse" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
