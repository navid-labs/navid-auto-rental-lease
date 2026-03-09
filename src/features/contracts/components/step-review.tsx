'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { ImageIcon } from 'lucide-react'
import type { VehicleWithDetails, ContractFormData } from '@/features/contracts/types'
import type { RentalResult, LeaseResult } from '@/lib/finance/calculate'

type StepReviewProps = {
  vehicle: VehicleWithDetails
  formData: ContractFormData
  calculation: RentalResult | LeaseResult
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepReview({
  vehicle,
  formData,
  calculation,
  onSubmit,
  onBack,
  isSubmitting,
}: StepReviewProps) {
  const [agreed, setAgreed] = useState(false)

  const images = vehicle.images.sort((a, b) => a.order - b.order)
  const primaryImage = images[0]
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const generation = vehicle.trim.generation
  const trim = vehicle.trim
  const title = `${brand.name} ${model.name} ${generation.name} ${trim.name}`

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-center text-sm font-medium">
        계약 내용을 최종 확인해주세요
      </div>

      {/* Vehicle info */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground">차량 정보</h3>
        <div className="flex gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={title}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="text-sm space-y-1">
            <p className="font-bold">{title}</p>
            <p className="text-muted-foreground">
              {formatYearModel(vehicle.year)} / {formatDistance(vehicle.mileage)} / {vehicle.color}
            </p>
            <p className="font-medium text-accent">{formatKRW(vehicle.price)}</p>
          </div>
        </div>
      </div>

      {/* Contract terms */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground">계약 조건</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">계약 유형</span>
            <p className="font-medium">
              {formData.contractType === 'RENTAL' ? '렌탈' : '리스'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">계약 기간</span>
            <p className="font-medium">{formData.periodMonths}개월</p>
          </div>
          <div>
            <span className="text-muted-foreground">월 납입금</span>
            <p className="font-bold text-accent">
              {formatKRW(calculation.monthlyPayment, { monthly: true })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">보증금</span>
            <p className="font-medium">{formatKRW(calculation.deposit)}</p>
          </div>
          {'residualValue' in calculation && (
            <div>
              <span className="text-muted-foreground">잔존가치</span>
              <p className="font-medium">{formatKRW(calculation.residualValue)}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">총 비용</span>
            <p className="font-bold">{formatKRW(calculation.totalCost)}</p>
          </div>
        </div>
      </div>

      {/* Applicant info */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground">신청자 정보</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">이름</span>
            <p className="font-medium">{formData.ekyc.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">연락처</span>
            <p className="font-medium">{formData.ekyc.phone}</p>
          </div>
        </div>
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer rounded-lg border p-4">
        <Checkbox
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm leading-relaxed">
          위 내용을 확인하였으며, 계약 신청에 동의합니다
        </span>
      </label>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!agreed || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? '신청 중...' : '계약 신청'}
        </Button>
      </div>
    </div>
  )
}
