'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition, useState } from 'react'
import { promoRateSchema, type PromoRateInput } from '../schemas/settings'
import { putAdminSettingsPromoRates } from '@/lib/api/generated/settings/settings'
import { ApiError } from '@/lib/api/fetcher'
import type { Resolver } from 'react-hook-form'

type BrandOption = { id: string; name: string; nameKo: string | null }

type Props = {
  brands: BrandOption[]
}

export function PromoRateForm({ brands }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromoRateInput>({
    resolver: zodResolver(promoRateSchema) as Resolver<PromoRateInput>,
    defaultValues: { brandId: '', rate: 0, label: '' },
  })

  function onSubmit(data: PromoRateInput) {
    setMessage(null)
    startTransition(async () => {
      try {
        await putAdminSettingsPromoRates(data)
        setMessage({ type: 'success', text: '저장되었습니다.' })
        reset()
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof ApiError ? err.message : '저장에 실패했습니다.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border bg-card p-4">
      <h3 className="text-sm font-semibold">프로모션율 추가/수정</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="promo-brand" className="text-sm font-medium">
            브랜드
          </label>
          <select
            id="promo-brand"
            {...register('brandId')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">브랜드 선택</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameKo ?? b.name}
              </option>
            ))}
          </select>
          {errors.brandId && (
            <p className="text-xs text-destructive">{errors.brandId.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="promo-rate" className="text-sm font-medium">
            프로모션율 (%)
          </label>
          <input
            id="promo-rate"
            type="number"
            step="0.1"
            {...register('rate', {
              setValueAs: (v: string) => (v === '' ? 0 : Number(v) / 100),
            })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="예: 3.0"
          />
          {errors.rate && (
            <p className="text-xs text-destructive">{errors.rate.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="promo-label" className="text-sm font-medium">
            라벨 (선택)
          </label>
          <input
            id="promo-label"
            type="text"
            {...register('label')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="예: 3월 특별 프로모션"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
