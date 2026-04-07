'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

interface StepExtrasProps {
  data: Partial<CreateQuoteRequestInput>
  onChange: (updates: Partial<CreateQuoteRequestInput>) => void
  onPrev: () => void
  onNext: () => void
}

const EXPIRES_OPTIONS = [
  { value: 1, label: '1일' },
  { value: 2, label: '2일' },
  { value: 3, label: '3일' },
  { value: 5, label: '5일' },
  { value: 7, label: '7일' },
] as const

const MAX_CHARS = 500

export function StepExtras({ data, onChange, onPrev, onNext }: StepExtrasProps) {
  const specialRequests = data.specialRequests ?? ''
  const charCount = specialRequests.length
  const expiresInDays = data.expiresInDays ?? 3

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">추가 요청사항</h2>
        <p className="mt-1 text-sm text-gray-500">특별 요청사항과 견적 유효기간을 설정해 주세요.</p>
      </div>

      {/* Special requests */}
      <div>
        <label htmlFor="specialRequests" className="text-sm font-medium text-gray-700">
          특별 요청사항 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <div className="relative mt-1">
          <textarea
            id="specialRequests"
            rows={4}
            maxLength={MAX_CHARS}
            placeholder="원하시는 옵션, 색상, 기타 요청사항을 자유롭게 입력해 주세요."
            value={specialRequests}
            onChange={(e) => onChange({ specialRequests: e.target.value || undefined })}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p
            className={[
              'mt-1 text-right text-xs',
              charCount >= MAX_CHARS ? 'text-red-500' : 'text-gray-400',
            ].join(' ')}
          >
            {charCount} / {MAX_CHARS}
          </p>
        </div>
      </div>

      {/* Expires in days */}
      <div>
        <label htmlFor="expiresInDays" className="text-sm font-medium text-gray-700">
          견적 유효기간
        </label>
        <select
          id="expiresInDays"
          value={expiresInDays}
          onChange={(e) => onChange({ expiresInDays: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {EXPIRES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.value === 3 ? ' (기본)' : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          딜러가 견적을 제출할 수 있는 기간입니다.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white"
        >
          다음
        </button>
      </div>
    </div>
  )
}
