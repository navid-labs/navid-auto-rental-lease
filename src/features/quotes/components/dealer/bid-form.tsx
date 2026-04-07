'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BidFormProps {
  quoteRequestId: string
}

interface BidFormState {
  monthlyPayment: string
  deposit: string
  totalCost: string
  residualValue: string
  interestRate: string
  promotionNote: string
}

const initialState: BidFormState = {
  monthlyPayment: '',
  deposit: '',
  totalCost: '',
  residualValue: '',
  interestRate: '',
  promotionNote: '',
}

export function BidForm({ quoteRequestId }: BidFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<BidFormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(field: keyof BidFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Basic required field validation
    if (!form.monthlyPayment || !form.deposit || !form.totalCost) {
      setError('월 납입금, 선수금, 총 비용은 필수 입력 항목입니다')
      return
    }

    setSubmitting(true)

    try {
      const body = {
        quoteRequestId,
        monthlyPayment: Number(form.monthlyPayment),
        deposit: Number(form.deposit),
        totalCost: Number(form.totalCost),
        ...(form.residualValue && { residualValue: Number(form.residualValue) }),
        ...(form.interestRate && { interestRate: Number(form.interestRate) }),
        ...(form.promotionNote && { promotionNote: form.promotionNote }),
      }

      const res = await fetch('/api/dealer/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? '입찰 제출에 실패했습니다')
        return
      }

      router.push('/dealer/bids')
    } catch {
      setError('서버 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">견적 입찰하기</h2>
        <p className="mt-1 text-sm text-gray-500">
          고객에게 제안할 견적 정보를 입력해 주세요.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Required fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="monthlyPayment" className="text-sm font-medium text-gray-700">
            월 납입금 <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="monthlyPayment"
              type="number"
              min={0}
              placeholder="예: 500000"
              value={form.monthlyPayment}
              onChange={(e) => handleChange('monthlyPayment', e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
        </div>

        <div>
          <label htmlFor="deposit" className="text-sm font-medium text-gray-700">
            선수금 <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="deposit"
              type="number"
              min={0}
              placeholder="예: 3000000"
              value={form.deposit}
              onChange={(e) => handleChange('deposit', e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
        </div>

        <div>
          <label htmlFor="totalCost" className="text-sm font-medium text-gray-700">
            총 비용 <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="totalCost"
              type="number"
              min={0}
              placeholder="예: 21000000"
              value={form.totalCost}
              onChange={(e) => handleChange('totalCost', e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
        </div>
      </div>

      {/* Optional fields */}
      <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          선택 항목
        </p>

        <div>
          <label htmlFor="residualValue" className="text-sm font-medium text-gray-700">
            잔존가치
          </label>
          <div className="relative mt-1">
            <input
              id="residualValue"
              type="number"
              min={0}
              placeholder="예: 5000000"
              value={form.residualValue}
              onChange={(e) => handleChange('residualValue', e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
        </div>

        <div>
          <label htmlFor="interestRate" className="text-sm font-medium text-gray-700">
            이자율
          </label>
          <div className="relative mt-1">
            <input
              id="interestRate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="예: 3.5"
              value={form.interestRate}
              onChange={(e) => handleChange('interestRate', e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 pr-6 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">%</span>
          </div>
        </div>

        <div>
          <label htmlFor="promotionNote" className="text-sm font-medium text-gray-700">
            프로모션 메모
          </label>
          <textarea
            id="promotionNote"
            rows={3}
            maxLength={300}
            placeholder="특별 프로모션이나 추가 혜택을 입력하세요"
            value={form.promotionNote}
            onChange={(e) => handleChange('promotionNote', e.target.value)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.promotionNote.length}/300
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-500 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
      >
        {submitting ? '제출 중...' : '입찰 제출'}
      </button>
    </form>
  )
}
