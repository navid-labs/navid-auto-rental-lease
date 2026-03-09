'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleStep2Schema, type VehicleStep2Data } from '@/features/vehicles/schemas/vehicle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type StepDetailsProps = {
  defaultValues: Partial<VehicleStep2Data>
  onSubmit: (data: VehicleStep2Data) => void
  onBack: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function StepDetails({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting = false,
  submitLabel = '다음',
}: StepDetailsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleStep2Data>({
    resolver: zodResolver(vehicleStep2Schema) as Resolver<VehicleStep2Data>,
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Year */}
        <div className="grid gap-2">
          <Label htmlFor="year">연식</Label>
          <Input
            id="year"
            type="number"
            placeholder="예: 2023"
            {...register('year')}
          />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>

        {/* Mileage */}
        <div className="grid gap-2">
          <Label htmlFor="mileage">주행거리</Label>
          <div className="relative">
            <Input
              id="mileage"
              type="number"
              placeholder="예: 15000"
              className="pr-10"
              {...register('mileage')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              km
            </span>
          </div>
          {errors.mileage && (
            <p className="text-sm text-destructive">{errors.mileage.message}</p>
          )}
        </div>

        {/* Color */}
        <div className="grid gap-2">
          <Label htmlFor="color">색상</Label>
          <Input
            id="color"
            placeholder="예: 흰색"
            {...register('color')}
          />
          {errors.color && (
            <p className="text-sm text-destructive">{errors.color.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="grid gap-2">
          <Label htmlFor="price">가격</Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              placeholder="예: 25000000"
              className="pr-8"
              {...register('price')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>

        {/* Monthly Rental */}
        <div className="grid gap-2">
          <Label htmlFor="monthlyRental">월 렌탈료 (선택)</Label>
          <div className="relative">
            <Input
              id="monthlyRental"
              type="number"
              placeholder="월 렌탈료"
              className="pr-8"
              {...register('monthlyRental')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          {errors.monthlyRental && (
            <p className="text-sm text-destructive">{errors.monthlyRental.message}</p>
          )}
        </div>

        {/* Monthly Lease */}
        <div className="grid gap-2">
          <Label htmlFor="monthlyLease">월 리스료 (선택)</Label>
          <div className="relative">
            <Input
              id="monthlyLease"
              type="number"
              placeholder="월 리스료"
              className="pr-8"
              {...register('monthlyLease')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          {errors.monthlyLease && (
            <p className="text-sm text-destructive">{errors.monthlyLease.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          placeholder="차량 상태, 옵션 등을 입력해주세요."
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
