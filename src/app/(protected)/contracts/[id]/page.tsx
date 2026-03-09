import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContractStatusTracker } from '@/features/contracts/components/contract-status-tracker'
import { ArrowLeft, Download } from 'lucide-react'
import type { ContractType, ContractStatus } from '@prisma/client'

const PDF_ELIGIBLE_STATUSES: ContractStatus[] = ['APPROVED', 'ACTIVE', 'COMPLETED']

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

  const canDownload = PDF_ELIGIBLE_STATUSES.includes(contract.status)

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/mypage"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="size-4" />
        마이페이지로 돌아가기
      </Link>

      <h1 className="mb-8 text-center text-2xl font-bold">계약 현황</h1>
      <ContractStatusTracker contract={contractData} contractType={contractType} />

      {canDownload ? (
        <div className="mt-8 flex justify-center">
          <a
            href={`/api/contracts/${contractId}/pdf?type=${contractType}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            <Download className="size-4" />
            계약서 다운로드
          </a>
        </div>
      ) : null}
    </div>
  )
}
