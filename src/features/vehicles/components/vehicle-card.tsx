'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatKRW, formatDistance } from '@/lib/utils/format'
import { ImageIcon, Heart, GitCompareArrows, Shield } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { getVehicleBadges } from '@/features/vehicles/lib/vehicle-badges'
import { getVehicleTags } from '@/features/vehicles/lib/vehicle-tags'
import { CardPreviewDialog } from './card-preview-dialog'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

/** Fuel type display label */
export function getFuelLabel(fuelType: string): string {
  switch (fuelType) {
    case 'GASOLINE':
      return '가솔린'
    case 'DIESEL':
      return '디젤'
    case 'LPG':
      return 'LPG'
    case 'HYBRID':
      return '하이브리드'
    case 'ELECTRIC':
      return '전기'
    case 'HYDROGEN':
      return '수소'
    default:
      return fuelType
  }
}

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

function WishlistButton({ vehicle }: { vehicle: VehicleSummary }) {
  const { wishlist, toggleWishlist } = useVehicleInteractionStore()
  const isWishlisted = wishlist.some((v) => v.id === vehicle.id)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleWishlist(vehicle)
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
  )
}

function CompareButton({ vehicle }: { vehicle: VehicleSummary }) {
  const { comparison, toggleComparison } = useVehicleInteractionStore()
  const isComparing = comparison.some((v) => v.id === vehicle.id)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleComparison(vehicle)
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
  )
}

export function VehicleCard({ vehicle }: { vehicle: VehicleWithDetails }) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const trim = vehicle.trim
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  // Badge input: extract fuelType from trim, inspectionData/warrantyEndDate from detail data
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

  // Warranty remaining months calculation
  const warrantyEnd = vehicleDetail.warrantyEndDate
    ? new Date(vehicleDetail.warrantyEndDate)
    : null
  const hasWarranty = warrantyEnd != null && warrantyEnd > new Date()
  const remainingMonths = hasWarranty
    ? Math.ceil((warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
    : 0

  return (
    <div
      className="group relative cursor-pointer"
      role="article"
      tabIndex={0}
      onClick={() => setPreviewOpen(true)}
      onKeyDown={(e) => e.key === 'Enter' && setPreviewOpen(true)}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-border/80">
        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${brand.nameKo || brand.name} ${model.nameKo || model.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="size-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Badge row - overlaid on image bottom */}
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

        {/* Info section */}
        <div className="p-4">
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

          {/* Price */}
          <p className="mt-2.5 text-xl font-bold text-text-price">
            {formatKRW(vehicle.price)}
          </p>

          {/* Monthly prices (NAVID DIFFERENTIATOR) */}
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

          {/* Warranty bar */}
          {hasWarranty && (
            <div className="mt-2 flex items-center gap-1.5">
              <Shield className="size-3.5 text-badge-success" />
              <span className="text-[11px] font-medium text-badge-success">
                보증 {remainingMonths}개월 남음
              </span>
            </div>
          )}

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

      {/* Action buttons (wishlist + compare) */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <WishlistButton vehicle={summary} />
        <CompareButton vehicle={summary} />
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
