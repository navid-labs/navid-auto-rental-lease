'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type BidStatus = 'SUBMITTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'

interface DealerBidItem {
  id: string
  monthlyPayment: number
  status: BidStatus
  quoteRequest: {
    id: string
    contractType: 'RENTAL' | 'LEASE'
  }
}

const STATUS_LABEL: Record<BidStatus, string> = {
  SUBMITTED: '제출',
  SELECTED: '선정',
  REJECTED: '미선정',
  WITHDRAWN: '철회',
}

const STATUS_CLASS: Record<BidStatus, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  SELECTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-gray-100 text-gray-500',
  WITHDRAWN: 'bg-red-100 text-red-600',
}

function formatMonthly(amount: number): string {
  return `${Math.floor(amount / 10000).toLocaleString()}만원/월`
}

export function BidActivityWidget() {
  const [bids, setBids] = useState<DealerBidItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dealer/bids/my')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBids(json.data.slice(0, 5))
        } else {
          setError(json.error ?? '불러오기 실패')
        }
      })
      .catch(() => setError('서버 오류가 발생했습니다'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">최근 입찰 내역</h2>
        <Link
          href="/dealer/bids"
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          전체보기 →
        </Link>
      </div>

      {loading && (
        <p className="py-4 text-center text-xs text-gray-400">불러오는 중...</p>
      )}

      {error && (
        <p className="py-4 text-center text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && bids.length === 0 && (
        <p className="py-4 text-center text-xs text-gray-400">
          아직 입찰 내역이 없습니다
        </p>
      )}

      {!loading && !error && bids.length > 0 && (
        <ul className="space-y-2">
          {bids.map((bid) => (
            <li
              key={bid.id}
              className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                    bid.quoteRequest.contractType === 'RENTAL'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700',
                  ].join(' ')}
                >
                  {bid.quoteRequest.contractType === 'RENTAL' ? '렌탈' : '리스'}
                </span>
                <span className="truncate text-xs text-gray-700">
                  {formatMonthly(bid.monthlyPayment)}
                </span>
              </div>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                  STATUS_CLASS[bid.status],
                ].join(' ')}
              >
                {STATUS_LABEL[bid.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
