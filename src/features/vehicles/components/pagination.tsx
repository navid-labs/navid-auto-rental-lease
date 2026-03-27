'use client'

import { useQueryState, parseAsInteger } from 'nuqs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  totalCount: number
  pageSize: number
}

export function Pagination({ totalCount, pageSize }: PaginationProps) {
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return null

  // Show max 5 page numbers centered around current page
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)
  const pages = Array.from(
    { length: end - adjustedStart + 1 },
    (_, i) => adjustedStart + i
  )

  const btnBase =
    'flex size-10 items-center justify-center rounded-lg text-sm font-medium transition-colors'
  const btnActive = 'bg-brand-blue text-white'
  const btnInactive = 'bg-white text-foreground border border-border hover:bg-surface-hover'
  const btnDisabled = 'bg-white text-muted-foreground border border-border cursor-not-allowed opacity-50'

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1.5"
      aria-label="페이지네이션"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPage(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
        aria-label="다음 페이지"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
