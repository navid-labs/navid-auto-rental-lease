'use client'

import { useQueryState, parseAsString } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'newest', label: '최근 등록순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
  { value: 'year-desc', label: '연식 최신순' },
  { value: 'year-asc', label: '연식 오래된순' },
  { value: 'mileage-asc', label: '주행거리 짧은순' },
] as const

type SearchSortProps = {
  totalCount: number
}

export function SearchSort({ totalCount }: SearchSortProps) {
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsString.withDefault('newest').withOptions({ shallow: false })
  )

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-[#0D0D0D]">
        총{' '}
        <span className="font-semibold">{totalCount.toLocaleString()}</span>
        대의 차량
      </p>

      <Select value={sort} onValueChange={(value) => setSort(value)}>
        <SelectTrigger className="h-9 w-40 gap-1 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#0D0D0D]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
