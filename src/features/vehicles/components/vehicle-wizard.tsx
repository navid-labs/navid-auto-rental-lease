'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StepPlateLookup } from './step-plate-lookup'
import { StepDetails } from './step-details'
import { StepPhotos } from './step-photos'
import {
  createVehicle as createVehicleApi,
  updateVehicle as updateVehicleApi,
} from '@/lib/api/generated/vehicles/vehicles'
import { ApiError } from '@/lib/api/fetcher'
import type { CreateVehicle201 } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'
import type { VehicleFormData, ImageItem } from '@/features/vehicles/types'
import type { VehicleStep2Data } from '@/features/vehicles/schemas/vehicle'
import { cn } from '@/lib/utils'

type VehicleWizardProps = {
  mode: 'create' | 'edit'
  userRole: 'DEALER' | 'ADMIN'
  initialData?: Partial<VehicleFormData> & { id?: string; images?: ImageItem[] }
}

const STEPS = [
  { label: '차량 선택', number: 1 },
  { label: '상세 정보', number: 2 },
  { label: '사진 등록', number: 3 },
]

export function VehicleWizard({ mode, userRole, initialData }: VehicleWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<VehicleFormData>>(initialData ?? {})
  const [vehicleId, setVehicleId] = useState<string | null>(initialData?.id ?? null)
  const [error, setError] = useState('')

  const redirectPath = userRole === 'ADMIN' ? '/admin/vehicles' : '/dealer/vehicles'

  const handleFieldChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleStep2Submit = (data: VehicleStep2Data) => {
    const merged: VehicleFormData = {
      brandId: formData.brandId!,
      modelId: formData.modelId!,
      generationId: formData.generationId!,
      trimId: formData.trimId!,
      licensePlate: formData.licensePlate,
      ...data,
    }

    startTransition(async () => {
      setError('')

      try {
        if (mode === 'edit' && vehicleId) {
          await updateVehicleApi(vehicleId, merged)
          // In edit mode, vehicleId is already set; go to photos
          setCurrentStep(3)
        } else {
          const response = await createVehicleApi(merged)
          // response.data is CreateVehicle201 = { data: { success, vehicleId } }
          setVehicleId((response.data as CreateVehicle201).data.vehicleId)
          setCurrentStep(3)
        }
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message)
        } else {
          setError('요청에 실패했습니다.')
        }
      }
    })
  }

  const handleComplete = () => {
    router.push(redirectPath)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'h-2 w-full rounded-full transition-colors',
                currentStep >= step.number ? 'bg-accent' : 'bg-muted'
              )}
            />
            <span
              className={cn(
                'text-xs',
                currentStep >= step.number
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? '차량 등록' : '차량 수정'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <StepPlateLookup
              formData={formData}
              onChange={handleFieldChange}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <StepDetails
              defaultValues={{
                year: formData.year,
                mileage: formData.mileage,
                color: formData.color,
                price: formData.price,
                monthlyRental: formData.monthlyRental,
                monthlyLease: formData.monthlyLease,
                description: formData.description,
              }}
              onSubmit={handleStep2Submit}
              onBack={() => setCurrentStep(1)}
              isSubmitting={isPending}
              submitLabel="다음"
            />
          )}

          {currentStep === 3 && vehicleId && (
            <StepPhotos
              vehicleId={vehicleId}
              initialImages={initialData?.images}
              onBack={() => setCurrentStep(2)}
              onComplete={handleComplete}
              mode={mode}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
