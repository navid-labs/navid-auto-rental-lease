'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatKRW, formatDistance } from '@/lib/utils/format'
import { ImageIcon, Heart, GitCompareArrows } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { getVehicleBadges } from '@/features/vehicles/lib/vehicle-badges'
import { getVehicleTags } from '@/features/vehicles/lib/vehicle-tags'
import { getFuelLabel } from './vehicle-card'
import { CardPreviewDialog } from './card-preview-dialog'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

type VehicleSummary = {
  id: string
  brandName: string
  modelName: string
  year: number
  mileage: number
  price: number
  monthlyRental?: number | null
  monthlyLease?: number | null
  thumbnailUrl?: string | null
}

export function VehicleCardList({ vehicle }: { vehicle: VehicleWithDetails }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { wishlist, toggleWishlist, comparison, toggleComparison } =
    useVehicleInteractionStore()

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const trim = vehicle.trim
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  const vehicleDetail = vehicle as VehicleWithDetails & {
    inspectionData?: { accidentDiagnosis?: string } | null
    historyData?: { ownerCount?: number } | null
    warrantyEndDate?: Date | string | null
  }

  const badges = getVehicleBadges({
    status: vehicle.status,
    year: vehicle.year,
    mileage: vehicle.mileage,
    monthlyRental: vehicle.monthlyRental,
    monthlyLease: vehicle.monthlyLease,
    createdAt: vehicle.createdAt,
    fuelType: trim.fuelType,
    inspectionData: vehicleDetail.inspectionData ?? null,
    warrantyEndDate: vehicleDetail.warrantyEndDate ?? null,
  })

  const tags = getVehicleTags({
    inspectionData: vehicleDetail.inspectionData ?? null,
    historyData: vehicleDetail.historyData ?? null,
    warrantyEndDate: vehicleDetail.warrantyEndDate ?? null,
  })

  const summary: VehicleSummary = {
    id: vehicle.id,
    brandName: brand.nameKo || brand.name,
    modelName: model.nameKo || model.name,
    year: vehicle.year,
    mileage: vehicle.mileage,
    price: vehicle.price,
    monthlyRental: vehicle.monthlyRental,
    monthlyLease: vehicle.monthlyLease,
    thumbnailUrl: primaryImage?.url ?? null,
  }

  const isWishlisted = wishlist.some((v) => v.id === vehicle.id)
  const isComparing = comparison.some((v) => v.id === vehicle.id)

  return (
    <div
      className="group relative flex gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md cursor-pointer"
      role="article"
      tabIndex={0}
      onClick={() => setPreviewOpen(true)}
      onKeyDown={(e) => e.key === 'Enter' && setPreviewOpen(true)}
    >
      {/* Image container */}
      <div className="relative w-[200px] shrink-0 overflow-hidden rounded-lg aspect-[4/3]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={`${brand.nameKo || brand.name} ${model.nameKo || model.name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="200px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <ImageIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Badge row */}
        {badges.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight ${badge.className}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info container */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Spec line */}
          <p className="text-xs text-muted-foreground">
            {vehicle.year}.01 | {formatDistance(vehicle.mileage)} |{' '}
            {getFuelLabel(trim.fuelType)}
          </p>

          {/* Vehicle name */}
          <h3 className="mt-1 truncate text-[15px] font-bold text-foreground">
            {brand.nameKo || brand.name} {model.nameKo || model.name}
          </h3>

          {/* Trim */}
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {trim.name}
          </p>
        </div>

        <div>
          {/* Price */}
          <p className="mt-2 text-xl font-bold text-text-price">
            {formatKRW(vehicle.price)}
          </p>

          {/* Monthly prices */}
          <div className="mt-1 flex items-center gap-3 text-[13px]">
            {vehicle.monthlyRental && (
              <span className="text-muted-foreground">
                렌탈 월 {formatKRW(vehicle.monthlyRental)}
              </span>
            )}
            {vehicle.monthlyLease && (
              <span className="text-muted-foreground">
                리스 월 {formatKRW(vehicle.monthlyLease)}
              </span>
            )}
            {!vehicle.monthlyRental && !vehicle.monthlyLease && (
              <span className="text-muted-foreground">
                월 {formatKRW(Math.round(vehicle.price / 72))} / 72개월
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (top-right) */}
      <div className="absolute right-3 top-3 flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleWishlist(summary)
          }}
          className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          aria-label={isWishlisted ? '찜 해제' : '찜하기'}
        >
          <Heart
            className={`size-4 transition-colors ${
              isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleComparison(summary)
          }}
          className={`flex size-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all hover:scale-110 ${
            isComparing
              ? 'bg-accent text-white'
              : 'bg-white/90 text-muted-foreground hover:bg-white'
          }`}
          aria-label={isComparing ? '비교 해제' : '비교하기'}
        >
          <GitCompareArrows className="size-4" />
        </button>
      </div>

      {/* Preview Dialog */}
      <CardPreviewDialog
        vehicle={vehicle}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
