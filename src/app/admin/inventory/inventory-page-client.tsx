'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InventoryToolbar } from '@/features/inventory/components/inventory-toolbar'
import { InventoryTable } from '@/features/inventory/components/inventory-table'
import { QuoteBuilder } from '@/features/inventory/components/quote-builder'
import { loadInventoryData } from '@/features/inventory/actions/load-inventory'
import type { InventoryFilter } from '@/features/inventory/types'
import type { InventoryVehicleForQuote } from '@/features/inventory/types/quote'

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
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedVehicles: InventoryVehicleForQuote[] = useMemo(() =>
    items
      .filter(item => selectedIds.has(item.id))
      .map(item => ({
        id: item.id,
        vehicleName: item.modelName,
        vehiclePrice: item.price,
        brand: item.brand ?? item.representModel.split(' ')[0],
        isImport: false,
        vehicleCategory: 'SEDAN' as const,
        fuelType: 'GASOLINE' as const,
        promotionRate: undefined,
        subsidyAmount: item.subsidy > 0 ? item.subsidy : undefined,
        options: item.options ?? undefined,
        exteriorColor: item.exteriorColor,
        year: item.modelYear,
      })),
    [items, selectedIds]
  )

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
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedIds.size === 0}
            onClick={() => setShowQuoteBuilder(true)}
          >
            견적 생성
          </button>
        </div>
      )}

      {/* Table */}
      <InventoryTable
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* QuoteBuilder */}
      {showQuoteBuilder && selectedVehicles.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card p-6">
          <QuoteBuilder
            selectedVehicles={selectedVehicles}
            onClose={() => setShowQuoteBuilder(false)}
          />
        </div>
      )}
    </>
  )
}
