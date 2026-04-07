export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { Button } from '@/components/ui/button'
import { VehicleTable } from '@/features/vehicles/components/vehicle-table'
import { DealerStatsSidebar } from '@/features/vehicles/components/dealer-stats-sidebar'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { Plus } from 'lucide-react'
import { BidActivityWidget } from '@/features/quotes/components/dealer/bid-activity-widget'

export default async function DealerDashboardPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') redirect('/login')

  const [approvalGroups, statusGroups, vehicles] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ['approvalStatus'],
      where: { dealerId: user.id },
      _count: true,
    }),
    prisma.vehicle.groupBy({
      by: ['status'],
      where: { dealerId: user.id },
      _count: true,
    }),
    prisma.vehicle.findMany({
      where: { dealerId: user.id },
      include: {
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
        images: { orderBy: { order: 'asc' }, take: 1 },
        dealer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<VehicleWithDetails[]>,
  ])

  // Transform groupBy results into Record<string, number>
  const approvalCounts: Record<string, number> = {}
  for (const g of approvalGroups) {
    approvalCounts[g.approvalStatus] = g._count
  }

  const statusCounts: Record<string, number> = {}
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count
  }

  const totalVehicles = vehicles.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">딜러 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            내 차량과 승인 현황을 한눈에 확인합니다.
          </p>
        </div>
        <Button render={<Link href="/dealer/vehicles/new" />}>
          <Plus className="mr-1 size-4" />
          차량 등록
        </Button>
      </div>

      {/* Bid activity widget */}
      <BidActivityWidget />

      {/* Main content: table + sidebar */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Stats sidebar - mobile on top, desktop on right */}
        <div className="order-first md:order-last md:w-64 md:shrink-0">
          <DealerStatsSidebar
            approvalCounts={approvalCounts}
            statusCounts={statusCounts}
            totalVehicles={totalVehicles}
          />
        </div>

        {/* Vehicle table */}
        <div className="min-w-0 flex-1">
          <VehicleTable
            vehicles={vehicles}
            userRole="DEALER"
            basePath="/dealer/vehicles"
          />
        </div>
      </div>
    </div>
  )
}
