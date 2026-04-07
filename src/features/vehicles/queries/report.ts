import { prisma } from '@/lib/db/prisma'
import { createMockKotsaVehicleData } from '@/lib/kotsa'
import { mapKotsaToInspectionData } from '@/lib/kotsa/utils/mapper'
import type { KotsaVehicleData } from '@/lib/kotsa'
import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'

export type VehicleReportData = {
  vehicleId: string
  brandName: string
  modelName: string
  generationName: string
  trimName: string
  year: number
  mileage: number
  color: string
  kotsaData: KotsaVehicleData
  inspectionData: InspectionData
}

/**
 * 차량 ID로 KOTSA 기반 점검 리포트 데이터를 조회한다.
 * 실제 KOTSA API 연동 전까지 Mock 어댑터를 사용한다.
 *
 * @param vehicleId - 차량 UUID
 * @returns VehicleReportData or null (차량 미존재 시)
 */
export async function getVehicleReport(
  vehicleId: string,
): Promise<VehicleReportData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
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

  if (!vehicle) return null

  const { trim } = vehicle
  const { generation } = trim
  const { carModel } = generation
  const { brand } = carModel

  const kotsaData = createMockKotsaVehicleData({
    basicInfo: {
      manufacturer: brand.name,
      modelName: carModel.name,
      modelYear: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color,
    },
  })

  const inspectionData = mapKotsaToInspectionData(kotsaData)

  return {
    vehicleId: vehicle.id,
    brandName: brand.nameKo ?? brand.name,
    modelName: carModel.nameKo ?? carModel.name,
    generationName: generation.name,
    trimName: trim.name,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color,
    kotsaData,
    inspectionData,
  }
}
