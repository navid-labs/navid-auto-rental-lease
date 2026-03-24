'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CascadeSelect } from './cascade-select'
import { lookupPlate } from '@/lib/api/generated/vehicles/vehicles'
import { ApiError } from '@/lib/api/fetcher'
import type { PlateResult } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'
import type { VehicleFormData } from '@/features/vehicles/types'

type StepPlateLookupProps = {
  formData: Partial<VehicleFormData>
  onChange: (field: string, value: string | number) => void
  onNext: () => void
}

export function StepPlateLookup({ formData, onChange, onNext }: StepPlateLookupProps) {
  const [mode, setMode] = useState<'plate' | 'manual'>('plate')
  const [plateNumber, setPlateNumber] = useState(formData.licensePlate ?? '')
  const [plateMessage, setPlateMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handlePlateLookup = () => {
    if (!plateNumber.trim()) return

    startTransition(async () => {
      try {
        const response = await lookupPlate({ plateNumber: plateNumber.trim() })
        // response.data is LookupPlate200 = { data: PlateResult }
        const plateData = (response.data as { data: PlateResult }).data

        // Auto-fill available fields
        onChange('licensePlate', plateNumber.trim())
        if (plateData.color) onChange('color', plateData.color)
        if (plateData.year) onChange('year', plateData.year)

        setPlateMessage('자동 입력됨 - 차량 정보를 직접 선택해주세요.')
        setMode('manual')
      } catch (e) {
        setPlateMessage(e instanceof ApiError ? e.message : '번호판 조회에 실패했습니다.')
      }
    })
  }

  const isNextEnabled = !!(formData.brandId && formData.modelId && formData.generationId && formData.trimId)

  return (
    <div className="space-y-6">
      {mode === 'plate' && (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="plate">차량 번호판</Label>
            <div className="flex gap-2">
              <Input
                id="plate"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="예: 12가3456"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handlePlateLookup}
                disabled={isPending || !plateNumber.trim()}
              >
                {isPending ? '조회 중...' : '조회'}
              </Button>
            </div>
            {plateMessage && (
              <p className="text-sm text-muted-foreground">{plateMessage}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className="text-sm text-accent underline underline-offset-4 hover:text-accent/80"
          >
            직접 입력
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          {plateMessage && (
            <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
              {plateMessage}
            </p>
          )}

          <CascadeSelect
            value={{
              brandId: formData.brandId ?? '',
              modelId: formData.modelId ?? '',
              generationId: formData.generationId ?? '',
              trimId: formData.trimId ?? '',
            }}
            onChange={onChange}
          />

          {!plateMessage && (
            <button
              type="button"
              onClick={() => setMode('plate')}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              번호판으로 조회
            </button>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={onNext} disabled={!isNextEnabled}>
          다음
        </Button>
      </div>
    </div>
  )
}
