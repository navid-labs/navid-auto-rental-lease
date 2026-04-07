'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface BidCard {
  id: string
  dealerName: string
  vehicleName: string
  monthlyPayment: number
  deposit: number
  totalCost: number
  residualValue?: number | null
  interestRate?: number | null
  promotionNote?: string | null
}

type SortKey = 'monthlyPayment' | 'totalCost' | 'deposit'

const SORT_LABELS: Record<SortKey, string> = {
  monthlyPayment: '월 납입금',
  totalCost: '총 비용',
  deposit: '선수금',
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`
  }
  return `${amount.toLocaleString()}원`
}

interface ComparisonViewProps {
  quoteId: string
  bids: BidCard[]
  isSelectable: boolean
  selectedBidId?: string | null
}

export function ComparisonView({
  quoteId,
  bids,
  isSelectable,
  selectedBidId,
}: ComparisonViewProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('monthlyPayment')
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sorted = [...bids].sort((a, b) => a[sortKey] - b[sortKey])
  const lowestId = sorted[0]?.id

  async function handleSelect(bidId: string) {
    if (!isSelectable || selectingId) return
    setSelectingId(bidId)
    setError(null)

    try {
      const res = await fetch(`/api/quotes/${quoteId}/select`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? '선택에 실패했습니다')
        return
      }

      router.refresh()
    } catch {
      setError('서버 오류가 발생했습니다')
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">정렬:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            className={[
              'rounded-full px-3 py-1 text-sm transition-colors',
              sortKey === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {SORT_LABELS[key]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Bid cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((bid) => {
          const isSelected = bid.id === selectedBidId
          const isLowest = bid.id === lowestId

          return (
            <div
              key={bid.id}
              className={[
                'rounded-xl border-2 p-5 transition-all',
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:shadow-md',
              ].join(' ')}
            >
              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isLowest && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    최저가
                  </span>
                )}
                {isSelected && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    선택됨
                  </span>
                )}
              </div>

              {/* Dealer & vehicle */}
              <p className="text-xs text-gray-500">{bid.dealerName}</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{bid.vehicleName}</p>

              {/* Monthly payment (highlighted) */}
              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-500">월 납입금</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatAmount(bid.monthlyPayment)}
                </p>
              </div>

              {/* Other amounts */}
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">선수금</dt>
                  <dd className="font-medium text-gray-800">{formatAmount(bid.deposit)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">총 비용</dt>
                  <dd className="font-medium text-gray-800">{formatAmount(bid.totalCost)}</dd>
                </div>
                {bid.residualValue != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">잔존가치</dt>
                    <dd className="font-medium text-gray-800">
                      {formatAmount(bid.residualValue)}
                    </dd>
                  </div>
                )}
                {bid.interestRate != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">이자율</dt>
                    <dd className="font-medium text-gray-800">{bid.interestRate}%</dd>
                  </div>
                )}
              </dl>

              {/* Promotion note */}
              {bid.promotionNote && (
                <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  {bid.promotionNote}
                </p>
              )}

              {/* Select button */}
              {isSelectable && !isSelected && (
                <button
                  type="button"
                  onClick={() => handleSelect(bid.id)}
                  disabled={selectingId !== null}
                  className="mt-4 w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  {selectingId === bid.id ? '처리 중...' : '이 견적 선택'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
