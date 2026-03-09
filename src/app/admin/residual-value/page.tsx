export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getBrands } from '@/features/vehicles/actions/get-cascade-data'
import { getResidualRates } from '@/features/pricing/actions/residual-rate'
import { ResidualValueTable } from '@/features/pricing/components/residual-value-table'
import { ResidualValueForm } from '@/features/pricing/components/residual-value-form'
import { BrandFilterClient } from '@/features/pricing/components/brand-filter-client'

type PageProps = {
  searchParams: Promise<{ brandId?: string }>
}

export default async function AdminResidualValuePage({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams

  const [brands, rates] = await Promise.all([
    getBrands(),
    getResidualRates(params.brandId),
  ])

  const selectedBrandId = params.brandId ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">잔존가치 관리</h1>
        <p className="text-sm text-muted-foreground">
          브랜드/모델/연식별 잔존가치율을 관리합니다.
        </p>
      </div>

      {/* Brand filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="brand-filter" className="text-sm font-medium">
          브랜드 필터
        </label>
        <BrandFilterClient brands={brands} selectedBrandId={selectedBrandId} />
      </div>

      {/* Rates table */}
      <ResidualValueTable rates={rates} />

      {/* Add form */}
      <ResidualValueForm brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  )
}
