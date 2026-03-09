'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

type PopularTag = {
  label: string
  /** URLSearchParams-compatible key-value pairs appended to /vehicles */
  params: Record<string, string>
}

export const POPULAR_TAGS: PopularTag[] = [
  { label: 'BMW 3시리즈', params: { q: 'BMW 3시리즈' } },
  { label: '벤츠 E클래스', params: { q: '벤츠 E클래스' } },
  { label: '아우디 A6', params: { q: '아우디 A6' } },
  { label: '제네시스 G80', params: { q: '제네시스 G80' } },
  { label: '월 50만원 이하', params: { priceMax: '500000' } },
  { label: '2024년식 이상', params: { yearMin: '2024' } },
  { label: '1만km 미만', params: { mileMax: '10000' } },
  { label: '가격 낮은순', params: { sort: 'price-asc' } },
]

function buildHref(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString()
  return `/vehicles${qs ? `?${qs}` : ''}`
}

export function PopularSearches() {
  return (
    <div className="mb-4 flex items-center gap-3">
      {/* Label */}
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
        <TrendingUp className="size-4 text-accent" />
        인기 검색
      </span>

      {/* Chips — horizontally scrollable, snaps per chip */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
        {POPULAR_TAGS.map((tag) => (
          <Link
            key={tag.label}
            href={buildHref(tag.params)}
            className="snap-start shrink-0 rounded-full border border-border bg-white px-4 py-1.5 text-sm transition-colors hover:bg-accent hover:text-white hover:border-accent"
          >
            {tag.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
