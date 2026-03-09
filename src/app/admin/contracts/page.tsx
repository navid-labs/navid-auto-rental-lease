export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { AdminContractList } from '@/features/contracts/components/admin-contract-list'

const contractInclude = {
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
  customer: { select: { id: true, name: true, email: true } },
  dealer: { select: { id: true, name: true, email: true } },
}

export default async function AdminContractsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  // Fetch both contract types in parallel
  const [rentals, leases] = await Promise.all([
    prisma.rentalContract.findMany({
      include: contractInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaseContract.findMany({
      include: contractInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Merge and normalize for the list component
  const contracts = [
    ...rentals.map((r) => ({
      id: r.id,
      contractType: 'RENTAL' as const,
      status: r.status,
      monthlyPayment: r.monthlyPayment,
      deposit: r.deposit,
      totalAmount: r.totalAmount,
      createdAt: r.createdAt,
      vehicleName: `${r.vehicle.trim.generation.carModel.brand.name} ${r.vehicle.trim.generation.carModel.name} ${r.vehicle.year}`,
      customerName: r.customer.name ?? r.customer.email,
    })),
    ...leases.map((l) => ({
      id: l.id,
      contractType: 'LEASE' as const,
      status: l.status,
      monthlyPayment: l.monthlyPayment,
      deposit: l.deposit,
      totalAmount: l.totalAmount,
      createdAt: l.createdAt,
      vehicleName: `${l.vehicle.trim.generation.carModel.brand.name} ${l.vehicle.trim.generation.carModel.name} ${l.vehicle.year}`,
      customerName: l.customer.name ?? l.customer.email,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const pendingCount = contracts.filter((c) => c.status === 'PENDING_APPROVAL').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">계약 관리</h1>
        <p className="text-sm text-muted-foreground">
          전체 계약을 관리합니다. ({contracts.length}건
          {pendingCount > 0 && `, 승인 대기 ${pendingCount}건`})
        </p>
      </div>

      <AdminContractList contracts={contracts} />
    </div>
  )
}
