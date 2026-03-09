export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { Button } from '@/components/ui/button'
import { VehicleTable } from '@/features/vehicles/components/vehicle-table'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { Plus } from 'lucide-react'

export default async function AdminVehiclesPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const vehicles = await prisma.vehicle.findMany({
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
  }) as unknown as VehicleWithDetails[]

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

      <VehicleTable
        vehicles={vehicles}
        userRole="ADMIN"
        basePath="/admin/vehicles"
      />
    </div>
  )
}
