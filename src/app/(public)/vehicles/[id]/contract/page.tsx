import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getResidualRate } from '@/features/pricing/actions/residual-rate'
import { ContractWizard } from '@/features/contracts/components/contract-wizard'
import type { VehicleWithDetails } from '@/features/contracts/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '계약 신청 | Navid Auto',
}

const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: {
              brand: true,
            },
          },
        },
      },
    },
  },
  images: true,
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
} as const

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ContractPage({ params }: PageProps) {
  // Auth check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }
  if (user.role !== 'CUSTOMER') {
    redirect('/')
  }

  const { id } = await params

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id,
      status: 'AVAILABLE',
      approvalStatus: 'APPROVED',
    },
    include: vehicleInclude,
  })

  if (!vehicle) {
    notFound()
  }

  const residualRate = await getResidualRate(
    vehicle.trim.generation.carModel.brand.id,
    vehicle.trim.generation.carModel.id,
    vehicle.year
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ContractWizard
        vehicle={vehicle as unknown as VehicleWithDetails}
        residualRate={residualRate}
      />
    </div>
  )
}
