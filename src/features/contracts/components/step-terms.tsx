'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { termsSchema, type TermsData } from '@/features/contracts/schemas/contract'
import { calculateRental, calculateLease } from '@/lib/finance/calculate'
import { formatKRW } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { Resolver } from 'react-hook-form'

type StepTermsProps = {
  vehiclePrice: number
  residualRate: number
  onSubmit: (data: TermsData) => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepTerms({
  vehiclePrice,
  residualRate,
  onSubmit,
  onBack,
  isSubmitting,
}: StepTermsProps) {
  const form = useForm<TermsData>({
    resolver: zodResolver(termsSchema) as Resolver<TermsData>,
    defaultValues: {
      contractType: 'RENTAL',
      periodMonths: 36,
      deposit: 0,
    },
  })

  const { setValue } = form
  const contractType = useWatch({ control: form.control, name: 'contractType' })
  const periodMonths = useWatch({ control: form.control, name: 'periodMonths' })
  const deposit = useWatch({ control: form.control, name: 'deposit' })

  // Live calculation
  const calc =
    contractType === 'RENTAL'
      ? calculateRental(vehiclePrice, periodMonths, deposit)
      : calculateLease(vehiclePrice, periodMonths, deposit, residualRate)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Contract type toggle */}
      <div className="space-y-2">
        <Label>계약 유형</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['RENTAL', 'LEASE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('contractType', type)}
              className={`rounded-lg border-2 p-4 text-center transition-colors ${
                contractType === type
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-lg font-bold">
                {type === 'RENTAL' ? '렌탈' : '리스'}
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'RENTAL'
                  ? '월 균등 분할 납입'
                  : '잔가 설정 금융 리스'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Period slider */}
      <div className="space-y-3">
        <Label>계약 기간</Label>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">12개월</span>
          <span className="font-bold text-accent">{periodMonths}개월</span>
          <span className="text-muted-foreground">60개월</span>
        </div>
        <Slider
          min={12}
          max={60}
          step={6}
          value={[periodMonths]}
          onValueChange={(val: number | readonly number[]) => {
            const v = Array.isArray(val) ? val[0] : val
            setValue('periodMonths', v as number)
          }}
        />
      </div>

      {/* Deposit input */}
      <div className="space-y-2">
        <Label htmlFor="deposit">보증금</Label>
        <Input
          id="deposit"
          type="number"
          min={0}
          step={1000000}
          {...form.register('deposit', { valueAsNumber: true })}
        />
        {deposit > 0 && (
          <p className="text-xs text-muted-foreground">{formatKRW(deposit)}</p>
        )}
      </div>

      {/* Live calculation preview */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="text-sm font-medium">예상 납입 내역</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">월 납입금</span>
            <span className="font-bold text-accent">
              {formatKRW(calc.monthlyPayment, { monthly: true })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">보증금</span>
            <span>{formatKRW(calc.deposit)}</span>
          </div>
          {contractType === 'LEASE' && 'residualValue' in calc && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                잔존가치 ({Math.round(residualRate * 100)}%)
              </span>
              <span>{formatKRW((calc as { residualValue: number }).residualValue)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1">
            <span className="text-muted-foreground">총 비용</span>
            <span className="font-bold">{formatKRW(calc.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? '처리 중...' : '다음'}
        </Button>
      </div>
    </form>
  )
}
