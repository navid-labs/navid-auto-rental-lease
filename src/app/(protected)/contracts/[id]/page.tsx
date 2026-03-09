import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContractStatusTracker } from '@/features/contracts/components/contract-status-tracker'
import type { ContractType } from '@prisma/client'

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
}

type ContractPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function ContractStatusPage({ params, searchParams }: ContractPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id: contractId } = await params
  const { type } = await searchParams
  const contractType: ContractType = type === 'LEASE' ? 'LEASE' : 'RENTAL'

  // Fetch contract based on type
  let contract
  if (contractType === 'RENTAL') {
    contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: contractInclude,
    })
  } else {
    contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: contractInclude,
    })
  }

  if (!contract) notFound()

  // Verify ownership (customers can only see their own, admin can see all)
  if (user.role !== 'ADMIN' && contract.customerId !== user.id) {
    notFound()
  }

  const vehicle = contract.vehicle
  const vehicleName = `${vehicle.trim.generation.carModel.brand.name} ${vehicle.trim.generation.carModel.name}`
  const vehicleImageUrl = vehicle.images?.[0]?.url ?? null

  const baseData = {
    id: contract.id,
    status: contract.status,
    monthlyPayment: contract.monthlyPayment,
    deposit: contract.deposit,
    totalAmount: contract.totalAmount,
    startDate: contract.startDate,
    endDate: contract.endDate,
    vehicleName,
    vehicleYear: vehicle.year,
    vehicleImageUrl,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = contract as any
  const contractData = contractType === 'LEASE' && raw.residualValue != null
    ? {
        ...baseData,
        residualValue: Number(raw.residualValue) as number | null,
        residualRate: raw.residualRate != null ? Number(raw.residualRate) : null,
      }
    : baseData

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-center text-2xl font-bold">계약 현황</h1>
      <ContractStatusTracker contract={contractData} contractType={contractType} />
    </div>
  )
}
