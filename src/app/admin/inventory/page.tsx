import { getInventoryItems } from '@/features/inventory/actions/load-inventory'
import type { InventoryFilter, InventoryCategory } from '@/features/inventory/types'
import { InventoryPageClient } from './inventory-page-client'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{
    search?: string
    category?: string
    brand?: string
  }>
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams

  const filter: InventoryFilter = {
    search: params.search || undefined,
    category:
      params.category === 'STRATEGIC' || params.category === 'GENERAL'
        ? (params.category as InventoryCategory)
        : undefined,
    brand: params.brand || undefined,
  }

  const { items, count } = await getInventoryItems(filter)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">재고 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          도매 재고 현황을 조회하고 관리합니다
        </p>
      </div>

      {/* Client Interactive Wrapper */}
      <InventoryPageClient
        items={JSON.parse(JSON.stringify(items))}
        count={count}
        filter={filter}
      />
    </div>
  )
}
