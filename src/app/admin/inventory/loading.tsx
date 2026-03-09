import { Skeleton } from '@/components/ui/skeleton'

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-muted/80 px-2 py-2.5">
          <Skeleton className="h-4 w-full" />
        </div>
        {/* Rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-2 border-b border-border ${
              i % 2 === 0 ? 'bg-background' : 'bg-muted/30'
            }`}
          >
            <Skeleton className="size-3.5" />
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
