import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { VehicleDetailPage } from '@/features/vehicles/components/detail/vehicle-detail-page'
import { getResidualRateQuery } from '@/features/pricing/queries/residual-rates'
import { getKoreanVehicleName } from '@/lib/utils/format'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import type { Metadata } from 'next'
import type { VehicleDetailData, VehicleWithDetails } from '@/features/vehicles/types'

export const revalidate = 300

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
  images: {
    orderBy: [{ category: 'asc' as const }, { order: 'asc' as const }],
  },
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
}

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

export default async function VehicleDetailServerPage({ params }: PageProps) {
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

  // Parallel fetching: residualRate + similarVehicles (per CLAUDE.md performance rules)
  const [residualRate, similarVehicles] = await Promise.all([
    getResidualRateQuery(
      vehicle.trim.generation.carModel.brand.id,
      vehicle.trim.generation.carModel.id,
      vehicle.year,
    ),
    prisma.vehicle.findMany({
      where: {
        id: { not: vehicle.id },
        approvalStatus: 'APPROVED',
        status: { not: 'HIDDEN' },
        OR: [
          {
            trim: {
              generation: {
                carModel: {
                  brandId: vehicle.trim.generation.carModel.brandId,
                },
              },
            },
          },
          {
            price: {
              gte: Math.floor(vehicle.price * 0.8),
              lte: Math.ceil(vehicle.price * 1.2),
            },
          },
        ],
      },
      include: vehicleInclude,
      take: 8,
    }),
  ])

  const vehicleName = getKoreanVehicleName(vehicle)
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel

  return (
    <div className="pb-safe">
      <div className="mx-auto max-w-7xl px-4 lg:px-0">
        <BreadcrumbNav
          items={[
            { label: '내차사기', href: '/vehicles' },
            { label: `${brand.nameKo || brand.name} ${model.nameKo || model.name}` },
          ]}
        />
      </div>
      <VehicleDetailPage
        vehicle={vehicle as unknown as VehicleDetailData}
        residualRate={residualRate}
        vehicleName={vehicleName}
        similarVehicles={similarVehicles as unknown as VehicleWithDetails[]}
      />
    </div>
  )
}
