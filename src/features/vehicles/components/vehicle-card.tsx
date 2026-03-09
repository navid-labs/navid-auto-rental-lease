'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { estimateMonthlyRental, formatEstimate } from '@/lib/finance/calculate'
import { ImageIcon, Heart, GitCompareArrows, Flame, Sparkles, Tag } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleWithDetails } from '@/features/vehicles/types'

type VehicleCardProps = {
  vehicle: VehicleWithDetails
}

/** Determine marketing badges based on vehicle data */
function getMarketingBadges(vehicle: VehicleWithDetails) {
  const badges: { label: string; icon: typeof Flame; className: string }[] = []
  const now = Date.now()
  const createdAt = new Date(vehicle.createdAt).getTime()
  const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24)

  // New arrival: created within 7 days
  if (daysSinceCreated <= 7) {
    badges.push({
      label: '신규',
      icon: Sparkles,
      className: 'bg-emerald-500 text-white',
    })
  }

  // Hot deal: has monthlyRental and price < 500k
  if (vehicle.monthlyRental && vehicle.monthlyRental < 500_000) {
    badges.push({
      label: '특가',
      icon: Tag,
      className: 'bg-red-500 text-white',
    })
  }

  // Popular: mileage < 30k (low mileage = popular)
  if (vehicle.mileage < 30_000) {
    badges.push({
      label: '인기',
      icon: Flame,
      className: 'bg-orange-500 text-white',
    })
  }

  return badges.slice(0, 2) // max 2 badges
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  const badges = getMarketingBadges(vehicle)

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

  return (
    <div className="group relative">
      <Link href={`/vehicles/${vehicle.id}`}>
        <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <div className="relative aspect-[16/9] bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={`${brand.name} ${model.name}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground/40" />
              </div>
            )}

            {/* Marketing badges */}
            {badges.length > 0 && (
              <div className="absolute left-2 top-2 flex gap-1.5">
                {badges.map((badge) => (
                  <span
                    key={badge.label}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm ${badge.className}`}
                  >
                    <badge.icon className="size-3" />
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* Status badge for non-available */}
            {vehicle.status !== 'AVAILABLE' && (
              <div className="absolute right-2 top-2">
                <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  {vehicle.status === 'RESERVED' && '예약중'}
                  {vehicle.status === 'RENTED' && '렌탈중'}
                  {vehicle.status === 'LEASED' && '리스중'}
                  {vehicle.status === 'MAINTENANCE' && '정비중'}
                </span>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="truncate font-semibold">
              {brand.nameKo || brand.name} {model.nameKo || model.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatYearModel(vehicle.year)} &middot;{' '}
              {formatDistance(vehicle.mileage, { compact: true })}
            </p>
            <p className="mt-2 text-lg font-bold text-accent">
              {vehicle.monthlyRental
                ? formatKRW(vehicle.monthlyRental, { monthly: true })
                : formatKRW(vehicle.price)}
            </p>
            {vehicle.price > 0 && !vehicle.monthlyRental && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatEstimate(estimateMonthlyRental(vehicle.price))}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Action buttons (wishlist + compare) - positioned over card */}
      <div className="absolute right-2 bottom-[calc(100%-theme(spacing.4)-theme(height.9))] z-10 flex gap-1">
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
          isWishlisted
            ? 'fill-red-500 text-red-500'
            : 'text-gray-500 group-hover:text-gray-700'
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
          ? 'bg-accent text-white'
          : 'bg-white/90 text-gray-500 hover:bg-white group-hover:text-gray-700'
      }`}
      aria-label={isComparing ? '비교 해제' : '비교하기'}
    >
      <GitCompareArrows className="size-4" />
    </button>
  )
}
