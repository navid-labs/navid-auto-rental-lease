import { Skeleton } from '@/components/ui/skeleton'

export default function VehiclesSearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-32" />

      <div className="flex gap-8">
        {/* Filter sidebar - desktop */}
        <div className="hidden w-64 shrink-0 space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Vehicle grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
