'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

interface StepConfirmProps {
  data: Partial<CreateQuoteRequestInput>
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

interface SummaryRowProps {
  label: string
  value: string
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

export function StepConfirm({ data, onPrev, onSubmit, isSubmitting }: StepConfirmProps) {
  const contractTypeLabel = data.contractType === 'RENTAL' ? '렌탈' : '리스'
  const yearRange =
    data.yearMin || data.yearMax
      ? [data.yearMin ?? '제한없음', data.yearMax ?? '제한없음'].join(' ~ ')
      : '제한없음'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">견적 요청 확인</h2>
        <p className="mt-1 text-sm text-gray-500">입력하신 내용을 확인해 주세요.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 divide-y divide-gray-200">
        <SummaryRow label="계약 유형" value={contractTypeLabel} />
        <SummaryRow label="계약 기간" value={`${data.contractMonths}개월`} />
        <SummaryRow
          label="월 최대 예산"
          value={data.budgetMax ? `${formatKRW(data.budgetMax)}원` : '-'}
        />
        {data.depositMax != null && (
          <SummaryRow label="최대 보증금" value={`${formatKRW(data.depositMax)}원`} />
        )}
        {data.mileageLimit != null && (
          <SummaryRow label="연간 주행거리" value={`${formatKRW(data.mileageLimit)} km`} />
        )}
        <SummaryRow label="연식 범위" value={yearRange} />
        {data.specialRequests && (
          <SummaryRow label="특별 요청사항" value={data.specialRequests} />
        )}
        <SummaryRow label="견적 유효기간" value={`${data.expiresInDays ?? 3}일`} />
      </div>

      <p className="text-xs text-gray-400">
        견적 요청 후 딜러들이 맞춤 견적을 제출합니다. 유효기간 내에 원하는 견적을 선택하세요.
      </p>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? '요청 중...' : '견적 요청하기'}
        </button>
      </div>
    </div>
  )
}
