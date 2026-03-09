'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { ImageIcon } from 'lucide-react'
import type { VehicleWithDetails } from '@/features/contracts/types'

type StepVehicleConfirmProps = {
  vehicle: VehicleWithDetails
  onNext: () => void
}

export function StepVehicleConfirm({ vehicle, onNext }: StepVehicleConfirmProps) {
  const images = vehicle.images.sort((a, b) => a.order - b.order)
  const primaryImage = images[0]

  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const generation = vehicle.trim.generation
  const trim = vehicle.trim

  const title = `${brand.name} ${model.name} ${generation.name} ${trim.name}`

  return (
    <div className="space-y-6">
      {/* Vehicle image */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto mb-2 size-12" />
              <p className="text-sm">사진 없음</p>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle info */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">연식</span>
            <p className="font-medium">{formatYearModel(vehicle.year)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">주행거리</span>
            <p className="font-medium">{formatDistance(vehicle.mileage)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">색상</span>
            <p className="font-medium">{vehicle.color}</p>
          </div>
          <div>
            <span className="text-muted-foreground">차량가</span>
            <p className="font-medium text-accent">{formatKRW(vehicle.price)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
        <p className="text-sm font-medium">이 차량으로 계약을 진행하시겠습니까?</p>
      </div>

      <Button size="lg" className="w-full" onClick={onNext}>
        다음 단계
      </Button>
    </div>
  )
}
