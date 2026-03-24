import { prisma } from '@/lib/db/prisma'

export type DashboardStats = {
  vehicleCount: number
  pendingApprovals: number
  userCount: number
  activeContracts: number
  recentActivity: ActivityItem[]
  monthlyVehicles: MonthlyData[]
  monthlyContracts: MonthlyData[]
}

export type ActivityItem = {
  id: string
  contractType: 'RENTAL' | 'LEASE'
  vehicleName: string
  customerName: string
  status: string
  createdAt: string
}

export type MonthlyData = {
  month: string
  count: number
}

function getLastSixMonthsRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return { start, end: now }
}

function formatMonthLabel(date: Date): string {
  return `${date.getMonth() + 1}월`
}

function buildMonthlyBuckets(start: Date, end: Date): Map<string, { label: string; count: number }> {
  const buckets = new Map<string, { label: string; count: number }>()
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (current <= endMonth) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, { label: formatMonthLabel(current), count: 0 })
    current.setMonth(current.getMonth() + 1)
  }
  return buckets
}

function groupByMonth(items: { createdAt: Date }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const d = new Date(item.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Fetch all dashboard statistics using 10 parallel Prisma queries.
 */
export async function getDashboardStatsQuery(): Promise<DashboardStats> {
  const { start, end } = getLastSixMonthsRange()

  const [
    vehicleCount,
    pendingApprovals,
    userCount,
    rentalByStatus,
    leaseByStatus,
    recentRentals,
    recentLeases,
    vehiclesInRange,
    rentalsInRange,
    leasesInRange,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: 'HIDDEN' } } }),
    prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.profile.count(),
    prisma.rentalContract.groupBy({ by: ['status'], _count: true }),
    prisma.leaseContract.groupBy({ by: ['status'], _count: true }),
    prisma.rentalContract.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        vehicle: {
          select: {
            trim: {
              select: {
                generation: {
                  select: {
                    carModel: {
                      select: {
                        name: true,
                        nameKo: true,
                        brand: { select: { name: true, nameKo: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customer: { select: { name: true } },
      },
    }),
    prisma.leaseContract.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        vehicle: {
          select: {
            trim: {
              select: {
                generation: {
                  select: {
                    carModel: {
                      select: {
                        name: true,
                        nameKo: true,
                        brand: { select: { name: true, nameKo: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customer: { select: { name: true } },
      },
    }),
    prisma.vehicle.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: 'HIDDEN' } },
      select: { createdAt: true },
    }),
    prisma.rentalContract.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.leaseContract.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
  ])

  // Active contracts (ACTIVE status from both rental + lease)
  const rentalActive = rentalByStatus.find((g) => g.status === 'ACTIVE')?._count ?? 0
  const leaseActive = leaseByStatus.find((g) => g.status === 'ACTIVE')?._count ?? 0
  const activeContracts = rentalActive + leaseActive

  // Recent activity: merge rental + lease, sort by date, take 5
  function formatVehicleName(vehicle: {
    trim: {
      generation: {
        carModel: {
          name: string
          nameKo: string | null
          brand: { name: string; nameKo: string | null }
        }
      }
    }
  }): string {
    const brand =
      vehicle.trim.generation.carModel.brand.nameKo ??
      vehicle.trim.generation.carModel.brand.name
    const model =
      vehicle.trim.generation.carModel.nameKo ?? vehicle.trim.generation.carModel.name
    return `${brand} ${model}`
  }

  const allRecent: ActivityItem[] = [
    ...recentRentals.map((r) => ({
      id: r.id,
      contractType: 'RENTAL' as const,
      vehicleName: formatVehicleName(r.vehicle),
      customerName: r.customer.name ?? '미입력',
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    ...recentLeases.map((l) => ({
      id: l.id,
      contractType: 'LEASE' as const,
      vehicleName: formatVehicleName(l.vehicle),
      customerName: l.customer.name ?? '미입력',
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Monthly vehicle registrations
  const vehicleBuckets = buildMonthlyBuckets(start, end)
  const vehicleCounts = groupByMonth(vehiclesInRange)
  for (const [key, count] of vehicleCounts) {
    const bucket = vehicleBuckets.get(key)
    if (bucket) bucket.count = count
  }
  const monthlyVehicles: MonthlyData[] = Array.from(vehicleBuckets.values()).map((b) => ({
    month: b.label,
    count: b.count,
  }))

  // Monthly contracts (rental + lease combined)
  const contractBuckets = buildMonthlyBuckets(start, end)
  const rentalCounts = groupByMonth(rentalsInRange)
  const leaseCounts = groupByMonth(leasesInRange)
  for (const [key, count] of rentalCounts) {
    const bucket = contractBuckets.get(key)
    if (bucket) bucket.count += count
  }
  for (const [key, count] of leaseCounts) {
    const bucket = contractBuckets.get(key)
    if (bucket) bucket.count += count
  }
  const monthlyContracts: MonthlyData[] = Array.from(contractBuckets.values()).map((b) => ({
    month: b.label,
    count: b.count,
  }))

  return {
    vehicleCount,
    pendingApprovals,
    userCount,
    activeContracts,
    recentActivity: allRecent,
    monthlyVehicles,
    monthlyContracts,
  }
}
