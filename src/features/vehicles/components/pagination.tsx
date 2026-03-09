'use client'

import { useQueryState, parseAsInteger } from 'nuqs'
import { Button } from '@/components/ui/button'
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

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      aria-label="페이지네이션"
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPage(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
