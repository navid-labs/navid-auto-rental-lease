'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { ImageIcon } from 'lucide-react'

type VehicleDetailViewProps = {
  vehicle: VehicleWithDetails
}

export function VehicleDetailView({ vehicle }: VehicleDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const images = vehicle.images.sort((a, b) => a.order - b.order)
  const selectedImage = images[selectedImageIndex]

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const generation = vehicle.trim.generation
  const trim = vehicle.trim

  const title = `${brand.name} ${model.name} ${generation.name} ${trim.name}`

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <Card>
        <CardContent className="p-0">
          {/* Main image */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted">
            {selectedImage ? (
              <Image
                src={selectedImage.url}
                alt={`${title} photo ${selectedImageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="mx-auto mb-2 size-12" />
                  <p className="text-sm">등록된 사진이 없습니다</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {images.length > 1 && (
            <div className="flex gap-1 overflow-x-auto p-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`
                    relative size-16 shrink-0 overflow-hidden rounded border-2 transition-colors
                    ${idx === selectedImageIndex ? 'border-accent' : 'border-transparent hover:border-muted-foreground/30'}
                  `}
                >
                  <Image
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {formatYearModel(vehicle.year)} &middot; {formatDistance(vehicle.mileage)} &middot; {vehicle.color}
              </p>
            </div>
            <StatusBadge status={vehicle.status} />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="text-2xl font-bold text-accent">
              {formatKRW(vehicle.price)}
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {vehicle.monthlyRental && (
                <span>렌탈 {formatKRW(vehicle.monthlyRental, { monthly: true })}</span>
              )}
              {vehicle.monthlyLease && (
                <span>리스 {formatKRW(vehicle.monthlyLease, { monthly: true })}</span>
              )}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="브랜드" value={brand.name} />
            <InfoRow label="모델" value={model.name} />
            <InfoRow label="세대" value={generation.name} />
            <InfoRow label="트림" value={trim.name} />
            <InfoRow label="연식" value={formatYearModel(vehicle.year)} />
            <InfoRow label="주행거리" value={formatDistance(vehicle.mileage)} />
            <InfoRow label="색상" value={vehicle.color} />
            {vehicle.licensePlate && (
              <InfoRow label="차량번호" value={vehicle.licensePlate} />
            )}
          </div>

          {/* Description */}
          {vehicle.description && (
            <div>
              <h3 className="mb-2 text-sm font-medium">상세 설명</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {vehicle.description}
              </p>
            </div>
          )}

          {/* Dealer info */}
          <div className="border-t pt-4">
            <h3 className="mb-1 text-sm font-medium">딜러 정보</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.dealer.name ?? vehicle.dealer.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
