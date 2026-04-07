'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QuoteRequestItem {
  id: string
  contractType: 'RENTAL' | 'LEASE'
  contractMonths: number
  budgetMax: number
  expiresAt: string
  preferredBrand: { nameKo: string | null; name: string } | null
  preferredModel: { nameKo: string | null; name: string } | null
  _count: { bids: number }
}

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatBudget(amount: number): string {
  return `${Math.floor(amount / 10000).toLocaleString()}만원`
}

export function DealerQuoteList() {
  const [quotes, setQuotes] = useState<QuoteRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dealer/quotes')
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
      <div className="py-12 text-center text-sm text-gray-500">
        견적 요청을 불러오는 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        현재 입찰 가능한 견적 요청이 없습니다.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {quotes.map((quote) => {
        const daysLeft = getDaysRemaining(quote.expiresAt)
        const brandName = quote.preferredBrand?.nameKo ?? quote.preferredBrand?.name ?? '무관'
        const modelName = quote.preferredModel?.nameKo ?? quote.preferredModel?.name ?? '무관'

        return (
          <div
            key={quote.id}
            className="rounded-xl border-2 border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            {/* Header badges */}
            <div className="mb-3 flex items-center gap-2">
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
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {quote.contractMonths}개월
              </span>
            </div>

            {/* Vehicle info */}
            <p className="text-base font-semibold text-gray-900">
              {brandName} {modelName}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              최대 예산: {formatBudget(quote.budgetMax)}/월
            </p>

            {/* Stats */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>입찰 {quote._count.bids}건</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 font-medium',
                  daysLeft <= 1
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600',
                ].join(' ')}
              >
                {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
              </span>
            </div>

            {/* CTA */}
            <div className="mt-4">
              {daysLeft > 0 ? (
                <Link
                  href={`/dealer/bids/${quote.id}/new`}
                  className="block w-full rounded-lg bg-blue-500 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  입찰하기
                </Link>
              ) : (
                <span className="block w-full rounded-lg bg-gray-100 py-2 text-center text-sm font-medium text-gray-400">
                  마감됨
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
