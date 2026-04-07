'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

interface StepTermsProps {
  data: Partial<CreateQuoteRequestInput>
  onChange: (updates: Partial<CreateQuoteRequestInput>) => void
  onPrev: () => void
  onNext: () => void
}

const CONTRACT_MONTHS = [12, 24, 36, 48] as const

function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function StepTerms({ data, onChange, onPrev, onNext }: StepTermsProps) {
  const isValid = !!data.contractMonths && !!data.budgetMax && data.budgetMax >= 100000

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">계약 조건 설정</h2>
        <p className="mt-1 text-sm text-gray-500">원하시는 계약 기간과 예산을 입력해 주세요.</p>
      </div>

      {/* Contract months */}
      <div>
        <p className="text-sm font-medium text-gray-700">계약 기간</p>
        <div className="mt-2 flex gap-2">
          {CONTRACT_MONTHS.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => onChange({ contractMonths: months })}
              className={[
                'flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all',
                data.contractMonths === months
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              ].join(' ')}
            >
              {months}개월
            </button>
          ))}
        </div>
      </div>

      {/* Budget max */}
      <div>
        <label htmlFor="budgetMax" className="text-sm font-medium text-gray-700">
          월 최대 예산 <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            id="budgetMax"
            type="number"
            min={100000}
            placeholder="예: 500000"
            value={data.budgetMax ?? ''}
            onChange={(e) =>
              onChange({ budgetMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {data.budgetMax && data.budgetMax > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {formatKRW(data.budgetMax)}원 / 월
            </p>
          )}
        </div>
      </div>

      {/* Deposit max (optional) */}
      <div>
        <label htmlFor="depositMax" className="text-sm font-medium text-gray-700">
          최대 보증금 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <div className="mt-1">
          <input
            id="depositMax"
            type="number"
            min={0}
            placeholder="예: 3000000"
            value={data.depositMax ?? ''}
            onChange={(e) =>
              onChange({ depositMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {data.depositMax && data.depositMax > 0 && (
            <p className="mt-1 text-xs text-gray-500">{formatKRW(data.depositMax)}원</p>
          )}
        </div>
      </div>

      {/* Mileage limit (optional) */}
      <div>
        <label htmlFor="mileageLimit" className="text-sm font-medium text-gray-700">
          연간 주행거리 <span className="text-gray-400 font-normal">(선택, km)</span>
        </label>
        <input
          id="mileageLimit"
          type="number"
          min={0}
          placeholder="예: 20000"
          value={data.mileageLimit ?? ''}
          onChange={(e) =>
            onChange({ mileageLimit: e.target.value ? Number(e.target.value) : undefined })
          }
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
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
          disabled={!isValid}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}
