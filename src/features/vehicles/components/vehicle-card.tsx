'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatKRW, formatDistance } from '@/lib/utils/format'
import { ImageIcon, Heart, GitCompareArrows } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

type VehicleCardProps = {
  vehicle: VehicleWithDetails
}

type Badge = {
  label: string
  className: string
}

const CURRENT_YEAR = new Date().getFullYear()

/** Determine marketing badges based on vehicle data */
function getVehicleBadges(vehicle: VehicleWithDetails): Badge[] {
  const badges: Badge[] = []
  const fuelType = vehicle.trim.fuelType

  // Status badge takes priority
  if (vehicle.status === 'RESERVED') {
    badges.push({ label: '계약중', className: 'bg-[#71717A] text-white' })
  }

  // Electric vehicle
  if (fuelType === 'ELECTRIC') {
    badges.push({ label: '전기차', className: 'bg-emerald-500 text-white' })
  }

  // Near-new: recent year + low mileage
  if (vehicle.year >= CURRENT_YEAR - 1 && vehicle.mileage < 15_000) {
    badges.push({ label: '신차급', className: 'bg-blue-500 text-white' })
  }

  // Time deal: monthly rental below 500k
  if (vehicle.monthlyRental && vehicle.monthlyRental < 500_000) {
    badges.push({ label: '타임딜', className: 'bg-red-500 text-white' })
  }

  // Discount: monthly lease set
  if (vehicle.monthlyLease) {
    badges.push({ label: '할인중', className: 'bg-orange-500 text-white' })
  }

  // New listing: created within 7 days
  const daysSinceCreated =
    (Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated <= 7) {
    badges.push({ label: 'NEW', className: 'bg-purple-500 text-white' })
  }

  return badges.slice(0, 3)
}

/** Fuel type display label */
function getFuelLabel(fuelType: string): string {
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

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const trim = vehicle.trim
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  const badges = getVehicleBadges(vehicle)

  const summary = {
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

  const displayMonthly = vehicle.monthlyRental || vehicle.monthlyLease

  return (
    <div className="group relative">
      <Link href={`/vehicles/${vehicle.id}`} className="block">
        <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          {/* Image container */}
          <div className="relative aspect-[4/3] overflow-hidden bg-[#F4F4F4]">
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
                <ImageIcon className="size-10 text-[#71717A]/40" />
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
            {/* Meta line */}
            <p className="text-[12px] text-[#71717A]">
              {vehicle.year}.01 &nbsp;|&nbsp;{' '}
              {formatDistance(vehicle.mileage)} &nbsp;|&nbsp;{' '}
              {getFuelLabel(trim.fuelType)}
            </p>

            {/* Car name */}
            <h3 className="mt-1 truncate text-[16px] font-bold text-[#0D0D0D]">
              {brand.nameKo || brand.name} {model.nameKo || model.name}
            </h3>

            {/* Trim */}
            <p className="mt-0.5 truncate text-[13px] text-[#71717A]">{trim.name}</p>

            {/* Price */}
            <p className="mt-2 text-[18px] font-bold text-[#1A6DFF]">
              {formatKRW(vehicle.price)}
            </p>

            {/* Monthly price */}
            {displayMonthly ? (
              <p className="mt-0.5 text-[13px] text-[#71717A]">
                월 {formatKRW(displayMonthly)} / 72개월
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Action buttons (wishlist + compare) */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <WishlistButton vehicle={summary} />
        <CompareButton vehicle={summary} />
      </div>
    </div>
  )
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
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(vehicle)
      }}
      className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
      aria-label={isWishlisted ? '찜 해제' : '찜하기'}
    >
      <Heart
        className={`size-4 transition-colors ${
          isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'
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
        e.preventDefault()
        e.stopPropagation()
        toggleComparison(vehicle)
      }}
      className={`flex size-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all hover:scale-110 ${
        isComparing
          ? 'bg-[#1A6DFF] text-white'
          : 'bg-white/90 text-gray-500 hover:bg-white'
      }`}
      aria-label={isComparing ? '비교 해제' : '비교하기'}
    >
      <GitCompareArrows className="size-4" />
    </button>
  )
}
