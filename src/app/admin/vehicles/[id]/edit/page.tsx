import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { VehicleWizard } from '@/features/vehicles/components/vehicle-wizard'

type Params = { params: Promise<{ id: string }> }

export default async function AdminVehicleEditPage({ params }: Params) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

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
    },
  })

  if (!vehicle) notFound()

  const initialData = {
    id: vehicle.id,
    brandId: vehicle.trim.generation.carModel.brand.id,
    modelId: vehicle.trim.generation.carModel.id,
    generationId: vehicle.trim.generation.id,
    trimId: vehicle.trim.id,
    licensePlate: vehicle.licensePlate ?? undefined,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color,
    price: vehicle.price,
    monthlyRental: vehicle.monthlyRental ?? undefined,
    monthlyLease: vehicle.monthlyLease ?? undefined,
    description: vehicle.description ?? undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">차량 수정</h1>
        <p className="text-sm text-muted-foreground">차량 정보를 수정합니다.</p>
      </div>

      <VehicleWizard mode="edit" userRole="ADMIN" initialData={initialData} />
    </div>
  )
}
