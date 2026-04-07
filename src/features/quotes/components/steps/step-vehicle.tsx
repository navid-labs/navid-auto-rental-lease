'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

interface StepVehicleProps {
  data: Partial<CreateQuoteRequestInput>
  onChange: (updates: Partial<CreateQuoteRequestInput>) => void
  onNext: () => void
}

export function StepVehicle({ data, onChange, onNext }: StepVehicleProps) {
  const contractTypes = [
    {
      value: 'RENTAL' as const,
      label: '렌탈',
      description: '월 납입금으로 차량 이용, 소유권 없음',
    },
    {
      value: 'LEASE' as const,
      label: '리스',
      description: '금융 상품, 만기 후 인수 가능',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">계약 유형 선택</h2>
        <p className="mt-1 text-sm text-gray-500">원하시는 계약 방식을 선택해 주세요.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {contractTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange({ contractType: type.value })}
            className={[
              'rounded-xl border-2 p-5 text-left transition-all',
              data.contractType === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
            ].join(' ')}
          >
            <p className="text-base font-semibold">{type.label}</p>
            <p className="mt-1 text-sm text-gray-500">{type.description}</p>
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700">연식 범위 (선택)</h3>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <label htmlFor="yearMin" className="text-sm font-medium text-gray-600">
              최소 연식
            </label>
            <input
              id="yearMin"
              type="number"
              min={2015}
              max={2027}
              placeholder="예: 2020"
              value={data.yearMin ?? ''}
              onChange={(e) =>
                onChange({ yearMin: e.target.value ? Number(e.target.value) : undefined })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <span className="mt-5 text-gray-400">~</span>
          <div className="flex-1">
            <label htmlFor="yearMax" className="text-sm font-medium text-gray-600">
              최대 연식
            </label>
            <input
              id="yearMax"
              type="number"
              min={2015}
              max={2027}
              placeholder="예: 2024"
              value={data.yearMax ?? ''}
              onChange={(e) =>
                onChange({ yearMax: e.target.value ? Number(e.target.value) : undefined })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!data.contractType}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}
