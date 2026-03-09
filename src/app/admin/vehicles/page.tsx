export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { Button } from '@/components/ui/button'
import { VehicleTable } from '@/features/vehicles/components/vehicle-table'
import { ApprovalQueueTable } from '@/features/vehicles/components/approval-queue-table'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { Plus } from 'lucide-react'

const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: { brand: true },
          },
        },
      },
    },
  },
  images: { orderBy: { order: 'asc' as const }, take: 1 },
  dealer: { select: { id: true, name: true, email: true, phone: true } },
}

/**
 * Helper for public-facing vehicle queries.
 * Only APPROVED vehicles should appear in customer-facing searches.
 * Used in Phase 5+ for public vehicle listing.
 */
export function getPublicVehicleWhere() {
  return {
    approvalStatus: 'APPROVED' as const,
    status: 'AVAILABLE' as const,
  }
}

type AdminVehiclesPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminVehiclesPage({ searchParams }: AdminVehiclesPageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams

  const vehicles = await prisma.vehicle.findMany({
    include: vehicleInclude,
    orderBy: { createdAt: 'desc' },
  }) as unknown as VehicleWithDetails[]

  const activeTab = params.tab ?? 'all'
  const pendingVehicles = vehicles.filter(
    (v) => 'approvalStatus' in v && v.approvalStatus === 'PENDING'
  )
  const pendingCount = pendingVehicles.length

  const tabs = [
    { key: 'all', label: '전체', count: vehicles.length },
    { key: 'approval-queue', label: '승인 대기', count: pendingCount },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">차량 관리</h1>
          <p className="text-sm text-muted-foreground">
            전체 차량을 관리합니다. ({vehicles.length}대)
          </p>
        </div>
        <Button render={<Link href="/admin/vehicles/new" />}>
          <Plus className="mr-1 size-4" />
          차량 등록
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/admin/vehicles' : `/admin/vehicles?tab=${tab.key}`}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key === 'approval-queue' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'approval-queue' ? (
        <ApprovalQueueTable vehicles={pendingVehicles} />
      ) : (
        <VehicleTable
          vehicles={vehicles}
          userRole="ADMIN"
          basePath="/admin/vehicles"
        />
      )}
    </div>
  )
}
