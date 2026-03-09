import { Skeleton } from '@/components/ui/skeleton'

export default function VehicleDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Image gallery */}
      <Skeleton className="aspect-[16/9] w-full rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="size-16 rounded" />
        ))}
      </div>

      {/* Vehicle title + price */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1 rounded-lg border p-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Pricing section */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
