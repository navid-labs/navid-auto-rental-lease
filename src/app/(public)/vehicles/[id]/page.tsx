import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PublicVehicleDetail } from '@/features/vehicles/components/public-vehicle-detail'
import { getResidualRate } from '@/features/pricing/actions/residual-rate'
import type { Metadata } from 'next'
import type { VehicleWithDetails } from '@/features/vehicles/types'

export const dynamic = 'force-dynamic'

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, approvalStatus: 'APPROVED' },
    include: vehicleInclude,
  })

  if (!vehicle) {
    return { title: '차량을 찾을 수 없습니다 | Navid Auto' }
  }

  const brand = vehicle.trim.generation.carModel.brand.name
  const model = vehicle.trim.generation.carModel.name
  const title = `${brand} ${model} ${vehicle.year}년식 | Navid Auto`
  const description = `${brand} ${model} - ${vehicle.year}년식, ${vehicle.mileage.toLocaleString()}km`

  return { title, description }
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id,
      approvalStatus: 'APPROVED',
      status: { not: 'HIDDEN' },
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PublicVehicleDetail
        vehicle={vehicle as unknown as VehicleWithDetails}
        residualRate={residualRate}
      />
    </div>
  )
}
