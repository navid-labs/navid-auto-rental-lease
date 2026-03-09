'use client'

import { useQueryState } from 'nuqs'
import { parseAsString } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'newest', label: '최신 등록순' },
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
    <div className="mb-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>대
      </p>
      <Select value={sort} onValueChange={(value) => setSort(value)}>
        <SelectTrigger className="w-40">
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
