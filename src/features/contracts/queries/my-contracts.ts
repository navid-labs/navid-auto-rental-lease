import { prisma } from '@/lib/db/prisma'
import type { ContractListItem } from '@/features/contracts/types'

const vehicleInclude = {
  vehicle: {
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
      images: { orderBy: { order: 'asc' as const }, take: 1 },
    },
  },
}

/**
 * Fetch all rental and lease contracts for a customer.
 * Uses Promise.all for parallel queries (per CLAUDE.md performance rules).
 */
export async function getMyContractsQuery(userId: string): Promise<ContractListItem[]> {
  const [rentalContracts, leaseContracts] = await Promise.all([
    prisma.rentalContract.findMany({
      where: { customerId: userId },
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaseContract.findMany({
      where: { customerId: userId },
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const rentalItems: ContractListItem[] = rentalContracts.map((c) => ({
    id: c.id,
    contractType: 'RENTAL' as const,
    status: c.status,
    vehicleName: `${c.vehicle.trim.generation.carModel.brand.name} ${c.vehicle.trim.generation.carModel.name}`,
    vehicleYear: c.vehicle.year,
    vehicleImageUrl: c.vehicle.images[0]?.url ?? null,
    monthlyPayment: c.monthlyPayment,
    deposit: c.deposit,
    startDate: c.startDate,
    endDate: c.endDate,
    createdAt: c.createdAt,
  }))

  const leaseItems: ContractListItem[] = leaseContracts.map((c) => ({
    id: c.id,
    contractType: 'LEASE' as const,
    status: c.status,
    vehicleName: `${c.vehicle.trim.generation.carModel.brand.name} ${c.vehicle.trim.generation.carModel.name}`,
    vehicleYear: c.vehicle.year,
    vehicleImageUrl: c.vehicle.images[0]?.url ?? null,
    monthlyPayment: c.monthlyPayment,
    deposit: c.deposit,
    startDate: c.startDate,
    endDate: c.endDate,
    createdAt: c.createdAt,
  }))

  // Merge and sort by createdAt desc
  return [...rentalItems, ...leaseItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}
