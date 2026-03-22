'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  useVehicleInteractionStore,
  type VehicleSummary,
} from '@/lib/stores/vehicle-interaction-store'
import { formatKRW, formatDistance } from '@/lib/utils/format'
import { getBestIndex, getCompareHighlightClass } from '@/features/vehicles/lib/compare-utils'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

// ─── Spec rows for comparison table ─────────────────────────────────────────

type SpecRow = {
  key: string
  label: string
  getValue: (v: VehicleSummary) => string | number | null
  betterIs?: 'lower' | 'higher'
}

const SPEC_ROWS: SpecRow[] = [
  {
    key: 'price',
    label: '가격',
    getValue: (v) => v.price,
    betterIs: 'lower',
  },
  {
    key: 'year',
    label: '연식',
    getValue: (v) => v.year,
    betterIs: 'higher',
  },
  {
    key: 'mileage',
    label: '주행거리',
    getValue: (v) => v.mileage,
    betterIs: 'lower',
  },
  {
    key: 'monthlyRental',
    label: '월 렌탈료',
    getValue: (v) => v.monthlyRental ?? null,
    betterIs: 'lower',
  },
  {
    key: 'monthlyLease',
    label: '월 리스료',
    getValue: (v) => v.monthlyLease ?? null,
    betterIs: 'lower',
  },
]

function formatSpecValue(key: string, value: string | number | null): string {
  if (value == null) return '\u2014'
  switch (key) {
    case 'price':
    case 'monthlyRental':
    case 'monthlyLease':
      return formatKRW(value as number)
    case 'year':
      return `${value}년`
    case 'mileage':
      return formatDistance(value as number)
    default:
      return String(value)
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CompareDialog() {
  const {
    comparison,
    comparisonDialogOpen,
    setComparisonDialogOpen,
    removeFromComparison,
  } = useVehicleInteractionStore()

  // Column width based on vehicle count
  const colClass =
    comparison.length === 2 ? 'w-1/2' : comparison.length === 3 ? 'w-1/3' : 'w-full'

  return (
    <Dialog
      open={comparisonDialogOpen}
      onOpenChange={setComparisonDialogOpen}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader className="sticky top-0 z-10 bg-background pb-3 border-b border-border -mx-4 px-4 -mt-4 pt-4">
          <div className="flex items-center justify-between">
            <DialogTitle>차량 비교</DialogTitle>
            <button
              type="button"
              onClick={() => setComparisonDialogOpen(false)}
              className="flex size-8 items-center justify-center rounded-full hover:bg-secondary"
              aria-label="닫기"
            >
              <X className="size-5" />
            </button>
          </div>
        </DialogHeader>

        {comparison.length < 2 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            비교할 차량을 2대 이상 추가해주세요
          </div>
        ) : (
          <div className="mt-4">
            {/* Vehicle headers: image + name + price */}
            <div className="flex gap-3 mb-6">
              {comparison.map((vehicle) => (
                <div key={vehicle.id} className={`${colClass} text-center`}>
                  <div className="relative mx-auto size-24 overflow-hidden rounded-lg bg-secondary">
                    {vehicle.thumbnailUrl ? (
                      <Image
                        src={vehicle.thumbnailUrl}
                        alt={`${vehicle.brandName} ${vehicle.modelName}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromComparison(vehicle.id)}
                      className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
                      aria-label="비교에서 제거"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground truncate">
                    {vehicle.brandName} {vehicle.modelName}
                  </p>
                  <p className="text-base font-bold text-text-price">
                    {formatKRW(vehicle.price)}
                  </p>
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="mt-1 inline-block text-xs text-accent hover:underline"
                    onClick={() => setComparisonDialogOpen(false)}
                  >
                    상세보기
                  </Link>
                </div>
              ))}
            </div>

            {/* Spec comparison table */}
            <div className="overflow-hidden rounded-lg border border-border">
              {SPEC_ROWS.map((row) => {
                const values = comparison.map((v) => row.getValue(v))
                const bestIdx = getBestIndex(values, row.betterIs)

                return (
                  <div
                    key={row.key}
                    className="flex border-b border-border last:border-b-0"
                  >
                    {/* Label column */}
                    <div className="w-[120px] shrink-0 bg-secondary px-3 py-2.5 text-sm font-medium text-foreground">
                      {row.label}
                    </div>

                    {/* Value columns */}
                    {comparison.map((vehicle, idx) => {
                      const hl = getCompareHighlightClass(idx, bestIdx, values[idx])
                      return (
                        <div
                          key={vehicle.id}
                          className={`flex-1 px-3 py-2.5 text-center text-sm ${hl.cell} ${hl.text || 'text-foreground'}`}
                        >
                          {formatSpecValue(row.key, values[idx])}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
