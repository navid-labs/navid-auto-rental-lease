'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { ImageIcon, MessageCircle, FileText } from 'lucide-react'
import { InquiryForm } from './inquiry-form'
import { PricingCalculator } from '@/features/pricing/components/pricing-calculator'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleWithDetails } from '@/features/vehicles/types'

type PublicVehicleDetailProps = {
  vehicle: VehicleWithDetails
  residualRate?: number | null
}

export function PublicVehicleDetail({ vehicle, residualRate }: PublicVehicleDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const images = vehicle.images.sort((a, b) => a.order - b.order)
  const selectedImage = images[selectedImageIndex]

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const generation = vehicle.trim.generation
  const trim = vehicle.trim

  const title = `${brand.name} ${model.name} ${generation.name} ${trim.name}`

  // Track recently viewed
  const addRecentlyViewed = useVehicleInteractionStore((s) => s.addRecentlyViewed)
  useEffect(() => {
    const primaryImage = images[0]
    addRecentlyViewed({
      id: vehicle.id,
      brandName: brand.nameKo || brand.name,
      modelName: model.nameKo || model.name,
      year: vehicle.year,
      mileage: vehicle.mileage,
      price: vehicle.price,
      monthlyRental: vehicle.monthlyRental,
      monthlyLease: vehicle.monthlyLease,
      thumbnailUrl: primaryImage?.url ?? null,
    })
  }, [vehicle.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <Card>
        <CardContent className="p-0">
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
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatYearModel(vehicle.year)} &middot;{' '}
              {formatDistance(vehicle.mileage)} &middot; {vehicle.color}
            </p>
          </div>

          {/* Price */}
          <div className="space-y-1">
            {(vehicle.monthlyRental || vehicle.monthlyLease) && (
              <div className="flex gap-4 text-2xl font-bold text-accent">
                {vehicle.monthlyRental && (
                  <span>
                    렌탈 {formatKRW(vehicle.monthlyRental, { monthly: true })}
                  </span>
                )}
                {vehicle.monthlyLease && (
                  <span>
                    리스 {formatKRW(vehicle.monthlyLease, { monthly: true })}
                  </span>
                )}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              차량가 {formatKRW(vehicle.price)}
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
            <InfoRow label="연료" value={fuelTypeLabel(trim.fuelType)} />
            <InfoRow
              label="변속기"
              value={transmissionLabel(trim.transmission)}
            />
            {trim.engineCC && (
              <InfoRow label="배기량" value={`${trim.engineCC.toLocaleString()}cc`} />
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

          {/* Pricing Calculator */}
          <div className="border-t pt-4">
            <PricingCalculator
              vehicle={{
                id: vehicle.id,
                price: vehicle.price,
                brandName: brand.name,
                modelName: model.name,
                year: vehicle.year,
              }}
              residualRate={residualRate}
            />
          </div>

          {/* Contract CTA */}
          <div className="border-t pt-4 space-y-3">
            {vehicle.status === 'AVAILABLE' && vehicle.approvalStatus === 'APPROVED' ? (
              <Link href={`/vehicles/${vehicle.id}/contract`}>
                <Button size="lg" className="w-full">
                  <FileText className="size-4" />
                  계약 신청
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full" disabled>
                현재 계약 신청 불가
              </Button>
            )}

            <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
              <DialogTrigger
                render={
                  <Button size="lg" variant="outline" className="w-full" />
                }
              >
                <MessageCircle className="size-4" />
                상담 신청
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>상담 신청</DialogTitle>
                </DialogHeader>
                <InquiryForm
                  vehicleId={vehicle.id}
                  vehicleTitle={title}
                  onSuccess={() => setInquiryOpen(false)}
                />
              </DialogContent>
            </Dialog>
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

function fuelTypeLabel(type: string): string {
  const map: Record<string, string> = {
    GASOLINE: '가솔린',
    DIESEL: '디젤',
    LPG: 'LPG',
    HYBRID: '하이브리드',
    ELECTRIC: '전기',
    HYDROGEN: '수소',
  }
  return map[type] ?? type
}

function transmissionLabel(type: string): string {
  const map: Record<string, string> = {
    AUTOMATIC: '자동',
    MANUAL: '수동',
    CVT: 'CVT',
    DCT: 'DCT',
  }
  return map[type] ?? type
}
