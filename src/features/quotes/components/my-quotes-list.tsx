'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type QuoteStatus =
  | 'OPEN'
  | 'BIDDING'
  | 'COMPARING'
  | 'SELECTED'
  | 'CONTRACTED'
  | 'EXPIRED'

interface QuoteRequestItem {
  id: string
  contractType: 'RENTAL' | 'LEASE'
  budgetMin: number | null
  budgetMax: number
  contractMonths: number
  status: QuoteStatus
  expiresAt: string
  _count: { bids: number }
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  OPEN: '대기중',
  BIDDING: '입찰중',
  COMPARING: '비교중',
  SELECTED: '선정완료',
  CONTRACTED: '계약완료',
  EXPIRED: '만료',
}

const STATUS_CLASS: Record<QuoteStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  BIDDING: 'bg-yellow-100 text-yellow-700',
  COMPARING: 'bg-green-100 text-green-700',
  SELECTED: 'bg-emerald-100 text-emerald-700',
  CONTRACTED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-red-100 text-red-600',
}

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatBudget(min: number | null, max: number): string {
  const maxStr = `${Math.floor(max / 10000).toLocaleString()}만원`
  if (min == null) return `~${maxStr}`
  const minStr = `${Math.floor(min / 10000).toLocaleString()}만원`
  return `${minStr} ~ ${maxStr}`
}

export function MyQuotesList() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/quotes/my')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setQuotes(json.data)
        } else {
          setError(json.error ?? '불러오기 실패')
        }
      })
      .catch(() => setError('서버 오류가 발생했습니다'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        견적 요청을 불러오는 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        아직 견적 요청 내역이 없습니다.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {quotes.map((quote) => {
        const daysLeft = getDaysRemaining(quote.expiresAt)
        const isActive = quote.status === 'OPEN' || quote.status === 'BIDDING'

        return (
          <li
            key={quote.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/quote/${quote.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                router.push(`/quote/${quote.id}`)
              }
            }}
            className="cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {/* Badges row */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  quote.contractType === 'RENTAL'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700',
                ].join(' ')}
              >
                {quote.contractType === 'RENTAL' ? '렌탈' : '리스'}
              </span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  STATUS_CLASS[quote.status],
                ].join(' ')}
              >
                {STATUS_LABEL[quote.status]}
              </span>
            </div>

            {/* Details */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-gray-900">
                  월 예산 {formatBudget(quote.budgetMin, quote.budgetMax)}/월
                </p>
                <p className="text-xs text-gray-500">
                  계약 기간 {quote.contractMonths}개월
                </p>
              </div>

              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-sm font-semibold text-gray-900">
                  입찰 {quote._count.bids}건
                </p>
                {isActive && (
                  <p
                    className={[
                      'text-xs font-medium',
                      daysLeft <= 1 ? 'text-red-500' : 'text-gray-400',
                    ].join(' ')}
                  >
                    {daysLeft > 0 ? `D-${daysLeft}` : '오늘 마감'}
                  </p>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
