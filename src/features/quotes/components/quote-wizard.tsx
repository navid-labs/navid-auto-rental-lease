'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CreateQuoteRequestInput } from '../schemas/quote-request'
import { StepVehicle } from './steps/step-vehicle'
import { StepTerms } from './steps/step-terms'
import { StepExtras } from './steps/step-extras'
import { StepConfirm } from './steps/step-confirm'

const STEPS = ['차량 유형', '계약 조건', '추가 요청', '최종 확인'] as const
const TOTAL_STEPS = STEPS.length

export function QuoteWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Partial<CreateQuoteRequestInput>>({
    expiresInDays: 3,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(updates: Partial<CreateQuoteRequestInput>) {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? '견적 요청에 실패했습니다.')
      }

      const data = await res.json()
      router.push(`/quote/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      setIsSubmitting(false)
    }
  }

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">견적 요청</h1>
        <p className="mt-1 text-sm text-gray-500">
          단계 {step + 1} / {TOTAL_STEPS} — {STEPS[step]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={[
                'h-1 flex-1 rounded-full transition-all',
                i <= step ? 'bg-blue-500' : 'bg-gray-200',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={[
                'text-xs',
                i === step ? 'font-medium text-blue-600' : 'text-gray-400',
              ].join(' ')}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <StepVehicle data={formData} onChange={handleChange} onNext={goNext} />
        )}
        {step === 1 && (
          <StepTerms
            data={formData}
            onChange={handleChange}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <StepExtras
            data={formData}
            onChange={handleChange}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
        {step === 3 && (
          <StepConfirm
            data={formData}
            onPrev={goPrev}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Hidden for a11y: progress */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="견적 요청 진행 상황"
        className="sr-only"
      />
    </div>
  )
}
