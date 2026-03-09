import { Skeleton } from '@/components/ui/skeleton'

export default function AdminResidualValueLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Brand filter */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="flex items-center gap-4 border-b p-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-3 last:border-b-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Form skeleton */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
