'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition, useState } from 'react'
import { defaultSettingSchema, type DefaultSettingInput } from '../schemas/settings'
import { upsertDefaultSetting } from '../actions/settings'
import type { Resolver } from 'react-hook-form'

export function SubsidyForm() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DefaultSettingInput>({
    resolver: zodResolver(defaultSettingSchema) as Resolver<DefaultSettingInput>,
    defaultValues: { key: '', value: '', label: '' },
  })

  function onSubmit(data: DefaultSettingInput) {
    setMessage(null)
    // Prefix key with "subsidy_" if not already
    const prefixedData = {
      ...data,
      key: data.key.startsWith('subsidy_') ? data.key : `subsidy_${data.key}`,
    }

    startTransition(async () => {
      const result = await upsertDefaultSetting(prefixedData)
      if ('success' in result) {
        setMessage({ type: 'success', text: '저장되었습니다.' })
        reset()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border bg-card p-4">
      <h3 className="text-sm font-semibold">보조금 설정 추가/수정</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="subsidy-key" className="text-sm font-medium">
            키 (subsidy_ 자동 추가)
          </label>
          <input
            id="subsidy-key"
            type="text"
            {...register('key')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="예: ev, default"
          />
          {errors.key && (
            <p className="text-xs text-destructive">{errors.key.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="subsidy-value" className="text-sm font-medium">
            금액 (원)
          </label>
          <input
            id="subsidy-value"
            type="text"
            {...register('value')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="예: 500000"
          />
          {errors.value && (
            <p className="text-xs text-destructive">{errors.value.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="subsidy-label" className="text-sm font-medium">
            설명
          </label>
          <input
            id="subsidy-label"
            type="text"
            {...register('label')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="예: 전기차 보조금 기본값"
          />
          {errors.label && (
            <p className="text-xs text-destructive">{errors.label.message}</p>
          )}
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
