'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InventoryToolbar } from '@/features/inventory/components/inventory-toolbar'
import { InventoryTable } from '@/features/inventory/components/inventory-table'
import { loadInventoryData } from '@/features/inventory/actions/load-inventory'
import type { InventoryFilter } from '@/features/inventory/types'

type InventoryItem = {
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

type Props = {
  items: InventoryItem[]
  count: number
  filter: InventoryFilter
}

export function InventoryPageClient({ items, count, filter }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const handleLoadData = () => {
    startTransition(async () => {
      await loadInventoryData()
      router.refresh()
    })
  }

  return (
    <>
      {/* Toolbar */}
      <InventoryToolbar
        count={count}
        onLoadData={handleLoadData}
        loading={isPending}
      />

      {/* Selection Info */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {selectedIds.size}건 선택됨
          </span>
        </div>
      )}

      {/* Table */}
      <InventoryTable
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  )
}
