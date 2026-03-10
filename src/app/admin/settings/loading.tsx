import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Password gate placeholder */}
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4">
            <Skeleton className="mx-auto h-6 w-24" />
            <Skeleton className="mx-auto h-4 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
