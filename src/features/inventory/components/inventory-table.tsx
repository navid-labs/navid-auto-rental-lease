'use client'

import { useCallback, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

type InventoryRow = {
  id: string
  category: 'STRATEGIC' | 'GENERAL'
  itemNumber: string
  promotion: string | null
  representModel: string
  modelName: string
  options: string | null
  modelYear: number
  exteriorColor: string
  interiorColor: string
  price: number
  subsidy: number
  availableQuantity: number
  immediateQuantity: number
  productionDate: string | null
  notice: string | null
  brand: string | null
}

type SortKey = 'price' | 'modelYear' | 'availableQuantity' | 'immediateQuantity'
type SortDir = 'asc' | 'desc'

type InventoryTableProps = {
  items: InventoryRow[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('ko-KR').format(value)

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'price', label: '가격' },
  { key: 'modelYear', label: '차량연식' },
  { key: 'availableQuantity', label: '판매가능수량' },
  { key: 'immediateQuantity', label: '즉시출고수량' },
]

export function InventoryTable({ items, selectedIds, onSelectionChange }: InventoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey]
  )

  const sortedItems = useMemo(() => {
    if (!sortKey) return items
    const dir = sortDir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => (a[sortKey] - b[sortKey]) * dir)
  }, [items, sortKey, sortDir])

  const allSelected = items.length > 0 && selectedIds.size === items.length

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(items.map((i) => i.id)))
    }
  }, [allSelected, items, onSelectionChange])

  const handleSelectRow = useCallback(
    (id: string) => {
      const next = new Set(selectedIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      onSelectionChange(next)
    },
    [selectedIds, onSelectionChange]
  )

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <ArrowUpDown className="inline size-3 ml-0.5 text-muted-foreground/50" />
    return sortDir === 'asc' ? (
      <ArrowUp className="inline size-3 ml-0.5 text-primary" />
    ) : (
      <ArrowDown className="inline size-3 ml-0.5 text-primary" />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b border-border">
            {/* Checkbox */}
            <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm w-10 px-2 py-2.5 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="size-3.5 rounded border-input accent-primary"
                aria-label="전체 선택"
              />
            </th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">구분</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">번호</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">프로모션</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">대표차종</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">차종명</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">옵션</th>
            {/* Sortable columns */}
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-2 py-2.5 text-right font-medium whitespace-nowrap cursor-pointer select-none hover:text-primary transition-colors"
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortIcon column={col.key} />
              </th>
            ))}
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">외장색</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">내장색</th>
            <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">보조금</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">생산예시일</th>
            <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">공지</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.length === 0 ? (
            <tr>
              <td colSpan={16} className="py-12 text-center text-sm text-muted-foreground">
                데이터가 없습니다. &ldquo;데이터 조회&rdquo; 버튼을 클릭하여 재고를 불러오세요.
              </td>
            </tr>
          ) : (
            sortedItems.map((row, i) => {
              const isSelected = selectedIds.has(row.id)
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border transition-colors ${
                    isSelected
                      ? 'bg-primary/5'
                      : i % 2 === 0
                        ? 'bg-background'
                        : 'bg-muted/30'
                  } hover:bg-primary/10`}
                >
                  {/* Checkbox */}
                  <td className="sticky left-0 z-10 bg-inherit w-10 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(row.id)}
                      className="size-3.5 rounded border-input accent-primary"
                      aria-label={`${row.modelName} 선택`}
                    />
                  </td>
                  {/* Category Badge */}
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        row.category === 'STRATEGIC'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {row.category === 'STRATEGIC' ? '전략' : '일반'}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                    {row.itemNumber}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {row.promotion ? (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {row.promotion}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap font-medium">
                    {row.representModel}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{row.modelName}</td>
                  <td className="px-2 py-2 max-w-[120px] truncate" title={row.options ?? undefined}>
                    {row.options ?? '-'}
                  </td>
                  {/* Sortable data cells: price, modelYear, availableQuantity, immediateQuantity */}
                  <td className="px-2 py-2 text-right whitespace-nowrap font-medium">
                    {formatPrice(row.price)}만원
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{row.modelYear}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{row.availableQuantity}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <span
                      className={
                        row.immediateQuantity > 0
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : ''
                      }
                    >
                      {row.immediateQuantity}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{row.exteriorColor}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{row.interiorColor}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    {row.subsidy > 0 ? `${formatPrice(row.subsidy)}만원` : '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                    {row.productionDate ?? '-'}
                  </td>
                  <td className="px-2 py-2 max-w-[100px] truncate" title={row.notice ?? undefined}>
                    {row.notice ?? '-'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
