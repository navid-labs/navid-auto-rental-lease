'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuoteStatusBannerProps {
  quoteId: string
  initialBidCount: number
  expiresAt: string
}

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

interface QuoteStatusResponse {
  success: boolean
  data?: {
    status: string
    _count?: { bids: number }
    expiresAt?: string
  }
}

export function QuoteStatusBanner({
  quoteId,
  initialBidCount,
  expiresAt,
}: QuoteStatusBannerProps) {
  const router = useRouter()
  const [bidCount, setBidCount] = useState(initialBidCount)
  const [expired, setExpired] = useState(getDaysRemaining(expiresAt) === 0)

  useEffect(() => {
    if (expired) return

    // Poll every 30 seconds for new bids or status changes
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/quotes/${quoteId}`)
        const json: QuoteStatusResponse = await res.json()

        if (!json.success || !json.data) return

        const { status, _count } = json.data

        // If quote moved to COMPARING or SELECTED, navigate to compare view
        if (status === 'COMPARING' || status === 'SELECTED') {
          router.push(`/quote/${quoteId}/compare`)
          return
        }

        if (_count?.bids !== undefined) {
          setBidCount(_count.bids)
        }

        // Check expiry
        if (getDaysRemaining(expiresAt) === 0) {
          setExpired(true)
        }
      } catch {
        // Silent polling failure — will retry next interval
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [quoteId, expiresAt, expired, router])

  if (expired) {
    return (
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-lg font-semibold text-gray-500">마감되었습니다</p>
        <p className="mt-1 text-sm text-gray-400">이 견적 요청의 입찰이 종료되었습니다.</p>
      </div>
    )
  }

  const daysLeft = getDaysRemaining(expiresAt)

  return (
    <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-blue-900">견적 입찰 대기 중</p>
          <p className="mt-1 text-sm text-blue-600">
            딜러들이 견적을 준비하고 있습니다. 잠시만 기다려 주세요.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-700">{bidCount}</p>
          <p className="text-xs text-blue-500">입찰 건수</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, (bidCount / 5) * 100)}%` }}
          />
        </div>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-xs font-medium',
            daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700',
          ].join(' ')}
        >
          {daysLeft > 0 ? `D-${daysLeft}` : '오늘 마감'}
        </span>
      </div>

      <p className="mt-3 text-xs text-blue-400">
        30초마다 자동으로 업데이트됩니다
      </p>
    </div>
  )
}
