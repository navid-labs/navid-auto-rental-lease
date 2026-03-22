'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Heart, GitCompareArrows, ImageIcon } from 'lucide-react'
import { formatKRW, formatDistance } from '@/lib/utils/format'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { getFuelLabel } from './vehicle-card'
import type { VehicleWithDetails } from '../types'

type Props = {
  vehicle: VehicleWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Transmission type display label */
function getTransmissionLabel(transmission: string): string {
  switch (transmission) {
    case 'AUTOMATIC':
      return '자동'
    case 'MANUAL':
      return '수동'
    case 'CVT':
      return 'CVT'
    case 'DCT':
      return 'DCT'
    default:
      return transmission
  }
}

export function CardPreviewDialog({ vehicle, open, onOpenChange }: Props) {
  const { wishlist, toggleWishlist, comparison, toggleComparison } =
    useVehicleInteractionStore()

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const trim = vehicle.trim
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0]

  const vehicleName = `${brand.nameKo || brand.name} ${model.nameKo || model.name}`

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

  const isWishlisted = wishlist.some((v) => v.id === vehicle.id)
  const isComparing = comparison.some((v) => v.id === vehicle.id)

  const specs = [
    { label: '연식', value: `${vehicle.year}년식` },
    { label: '연료', value: getFuelLabel(trim.fuelType) },
    { label: '주행거리', value: formatDistance(vehicle.mileage) },
    { label: '변속기', value: getTransmissionLabel(trim.transmission) },
    { label: '색상', value: vehicle.color || '-' },
    { label: '배기량', value: trim.engineCC ? `${new Intl.NumberFormat('ko-KR').format(trim.engineCC)}cc` : '-' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg rounded-2xl bg-card p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{vehicleName} 미리보기</DialogTitle>

        {/* Image section */}
        <div className="relative aspect-[4/3] bg-secondary">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={vehicleName}
              fill
              className="object-cover"
              sizes="512px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="size-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-5 space-y-4">
          {/* Name and price */}
          <div>
            <h3 className="text-lg font-bold text-foreground">{vehicleName}</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{trim.name}</p>
            <p className="mt-2 text-xl font-bold text-text-price">
              {formatKRW(vehicle.price)}
            </p>
          </div>

          {/* Spec grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {specs.map((spec) => (
              <div key={spec.label}>
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="text-sm font-medium text-foreground">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly prices boxes */}
          <div className="flex gap-4">
            {vehicle.monthlyRental ? (
              <div className="flex-1 rounded-lg bg-secondary p-3 text-center">
                <p className="text-xs text-muted-foreground">렌탈 월</p>
                <p className="text-base font-bold text-text-price">
                  {formatKRW(vehicle.monthlyRental)}
                </p>
              </div>
            ) : null}
            {vehicle.monthlyLease ? (
              <div className="flex-1 rounded-lg bg-secondary p-3 text-center">
                <p className="text-xs text-muted-foreground">리스 월</p>
                <p className="text-base font-bold text-text-price">
                  {formatKRW(vehicle.monthlyLease)}
                </p>
              </div>
            ) : null}
            {!vehicle.monthlyRental && !vehicle.monthlyLease && (
              <div className="flex-1 rounded-lg bg-secondary p-3 text-center">
                <p className="text-xs text-muted-foreground">월 예상 (72개월)</p>
                <p className="text-base font-bold text-text-price">
                  {formatKRW(Math.round(vehicle.price / 72))}
                </p>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              render={
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <ExternalLink className="size-4" />
              상세보기
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                toggleComparison(summary)
              }}
            >
              <GitCompareArrows className="size-4" />
              {isComparing ? '비교 해제' : '비교하기'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                toggleWishlist(summary)
              }}
            >
              <Heart
                className={`size-4 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`}
              />
              {isWishlisted ? '찜 해제' : '찜하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
