'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InventoryCategory } from '../types'

type CategoryOption = 'ALL' | InventoryCategory

type InventoryToolbarProps = {
  count: number
  onLoadData: () => void
  loading: boolean
}

const CATEGORY_OPTIONS: { value: CategoryOption; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'STRATEGIC', label: '전략구매' },
  { value: 'GENERAL', label: '일반구매(현대/기아)' },
]

export function InventoryToolbar({ count, onLoadData, loading }: InventoryToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, startTransition] = useTransition()

  const activeCategory: CategoryOption =
    (searchParams.get('category') as CategoryOption) ?? 'ALL'

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      startTransition(() => {
        router.push(`/admin/inventory?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchValue(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        updateParams({ search: value || null })
      }, 300)
    },
    [updateParams]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleCategoryChange = useCallback(
    (category: CategoryOption) => {
      updateParams({ category: category === 'ALL' ? null : category })
    },
    [updateParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="차종, 옵션, 색상 등..."
          value={searchValue}
          onChange={handleSearchChange}
          className="pl-8"
        />
      </div>

      {/* Category Toggle */}
      <div className="flex rounded-lg border border-input overflow-hidden">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleCategoryChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Load Data Button */}
      <Button onClick={onLoadData} disabled={loading} variant="outline" size="sm">
        <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        데이터 조회
      </Button>

      {/* Result Count */}
      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        조회결과 <strong className="ml-1 text-foreground">{count.toLocaleString('ko-KR')}건</strong>
      </span>
    </div>
  )
}
