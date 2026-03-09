'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StepPlateLookup } from './step-plate-lookup'
import { StepDetails } from './step-details'
import { createVehicle } from '@/features/vehicles/actions/create-vehicle'
import { updateVehicle } from '@/features/vehicles/actions/update-vehicle'
import type { VehicleFormData } from '@/features/vehicles/types'
import type { VehicleStep2Data } from '@/features/vehicles/schemas/vehicle'
import { cn } from '@/lib/utils'

type VehicleWizardProps = {
  mode: 'create' | 'edit'
  userRole: 'DEALER' | 'ADMIN'
  initialData?: Partial<VehicleFormData> & { id?: string }
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
  const [error, setError] = useState('')

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

      if (mode === 'edit' && initialData?.id) {
        const result = await updateVehicle(initialData.id, merged)
        if ('error' in result) {
          setError(result.error)
          return
        }
      } else {
        const result = await createVehicle(merged)
        if ('error' in result) {
          setError(result.error)
          return
        }
      }

      // Redirect to vehicle list
      const basePath = userRole === 'ADMIN' ? '/admin/vehicles' : '/dealer/vehicles'
      router.push(basePath)
      router.refresh()
    })
  }

  const redirectPath = userRole === 'ADMIN' ? '/admin/vehicles' : '/dealer/vehicles'

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
              submitLabel={mode === 'create' ? '등록하기' : '수정하기'}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-4 text-center text-muted-foreground">
              <p>사진 등록은 다음 업데이트에서 지원됩니다.</p>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-sm underline underline-offset-4"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => router.push(redirectPath)}
                  className="text-sm underline underline-offset-4"
                >
                  차량 목록으로
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
