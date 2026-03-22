import { prisma } from '@/lib/db/prisma'
import { vehicleInclude } from '@/features/vehicles/lib/vehicle-include'
import { RecommendedVehiclesTabs } from './recommended-vehicles-tabs'

export async function RecommendedVehicles() {
  const baseWhere = { approvalStatus: 'APPROVED' as const }

  // CRITICAL: Promise.all for parallel fetch per project convention
  const [popular, newest, deals] = await Promise.all([
    prisma.vehicle.findMany({
      where: baseWhere,
      orderBy: { approvedAt: 'desc' },
      take: 8,
      include: vehicleInclude,
    }),
    prisma.vehicle.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: vehicleInclude,
    }),
    prisma.vehicle.findMany({
      where: baseWhere,
      orderBy: { price: 'asc' },
      take: 8,
      include: vehicleInclude,
    }),
  ])

  return (
    <section className="bg-[#F9FAFB] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />
      </div>
    </section>
  )
}
