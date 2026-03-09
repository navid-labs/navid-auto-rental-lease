import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 border-b pb-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-md border md:block">
        <div className="flex items-center gap-4 border-b p-3">
          {['w-16', 'w-32', 'w-24', 'w-16', 'w-20', 'w-12'].map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-3 last:border-b-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-6 w-20 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
