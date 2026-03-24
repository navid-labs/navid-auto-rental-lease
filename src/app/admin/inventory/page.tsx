import { getInventoryItemsQuery, getLastUploadTimeQuery } from '@/features/inventory/queries/inventory'
import type { InventoryFilter, InventoryCategory } from '@/features/inventory/types'
import { InventoryPageClient } from './inventory-page-client'
import { CsvUploadForm } from '@/features/inventory/components/csv-upload-form'
import { UploadStatus } from '@/features/inventory/components/upload-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  const [{ items, count }, lastUploadTime] = await Promise.all([
    getInventoryItemsQuery(filter),
    getLastUploadTimeQuery(),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">재고 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          도매 재고 현황을 조회하고 관리합니다
        </p>
      </div>

      {/* CSV Upload Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>CSV 데이터 업로드</CardTitle>
            <UploadStatus lastUploadTime={lastUploadTime?.toISOString() ?? null} />
          </div>
        </CardHeader>
        <CardContent>
          <CsvUploadForm />
        </CardContent>
      </Card>

      {/* Client Interactive Wrapper */}
      <InventoryPageClient
        items={JSON.parse(JSON.stringify(items))}
        count={count}
        filter={filter}
      />
    </div>
  )
}
