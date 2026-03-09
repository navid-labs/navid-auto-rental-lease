export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { Button } from '@/components/ui/button'
import { VehicleDetailView } from '@/features/vehicles/components/vehicle-detail-view'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import { Pencil, ArrowLeft } from 'lucide-react'

export default async function DealerVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') redirect('/login')

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
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
      images: { orderBy: { order: 'asc' } },
      dealer: { select: { id: true, name: true, email: true, phone: true } },
    },
  }) as unknown as VehicleWithDetails | null

  if (!vehicle) notFound()

  // Ownership check
  if (vehicle.dealer.id !== user.id) redirect('/dealer/vehicles')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href="/dealer/vehicles" />}>
          <ArrowLeft className="mr-1 size-4" />
          목록으로
        </Button>
        <Button size="sm" render={<Link href={`/dealer/vehicles/${id}/edit`} />}>
          <Pencil className="mr-1 size-4" />
          수정
        </Button>
      </div>

      <VehicleDetailView vehicle={vehicle} />
    </div>
  )
}
