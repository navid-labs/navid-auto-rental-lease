'use client'

import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'

export function CompareFloatingBar() {
  const { comparison, removeFromComparison, clearComparison, setComparisonDialogOpen } =
    useVehicleInteractionStore()

  if (comparison.length === 0) return null

  const emptySlots = 3 - comparison.length

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-lg">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 lg:px-8">
        {/* Left: Vehicle thumbnails */}
        <div className="flex items-center gap-3">
          {comparison.map((vehicle) => (
            <div
              key={vehicle.id}
              className="relative flex items-center gap-2 rounded-lg border border-border bg-secondary px-2 py-1.5"
            >
              {vehicle.thumbnailUrl ? (
                <Image
                  src={vehicle.thumbnailUrl}
                  alt={vehicle.modelName}
                  width={40}
                  height={40}
                  className="size-10 rounded object-cover"
                />
              ) : (
                <div className="size-10 rounded bg-muted" />
              )}
              <span className="hidden max-w-[100px] truncate text-xs font-medium text-foreground sm:block">
                {vehicle.brandName} {vehicle.modelName}
              </span>
              <button
                type="button"
                onClick={() => removeFromComparison(vehicle.id)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
                aria-label="삭제"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {/* Empty slots (dashed) */}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex size-10 items-center justify-center rounded-lg border-2 border-dashed border-border"
            >
              <Plus className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Right: Count + CTA + Clear */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            비교함 ({comparison.length})
          </span>
          <Button
            variant="default"
            size="sm"
            className="bg-accent text-accent-foreground"
            disabled={comparison.length < 2}
            onClick={() => setComparisonDialogOpen(true)}
          >
            비교하기
          </Button>
          <button
            type="button"
            onClick={clearComparison}
            className="cursor-pointer text-xs text-muted-foreground hover:text-destructive"
          >
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
