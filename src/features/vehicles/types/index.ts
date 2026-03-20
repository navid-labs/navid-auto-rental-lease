import type {
  Vehicle,
  VehicleImage,
  Trim,
  Generation,
  CarModel,
  Brand,
  Profile,
  ImageCategory,
} from '@prisma/client'
import type { InspectionData } from '../schemas/inspection-data'
import type { HistoryData } from '../schemas/history-data'

/** All fields collected across wizard steps */
export type VehicleFormData = {
  // Step 1: Vehicle identification
  brandId: string
  modelId: string
  generationId: string
  trimId: string
  licensePlate?: string

  // Step 2: Details
  year: number
  mileage: number
  color: string
  price: number
  monthlyRental?: number
  monthlyLease?: number
  description?: string
}

/** Vehicle with all nested relations for display */
export type VehicleWithDetails = Vehicle & {
  trim: Trim & {
    generation: Generation & {
      carModel: CarModel & {
        brand: Brand
      }
    }
  }
  images: VehicleImage[]
  dealer: Pick<Profile, 'id' | 'name' | 'email' | 'phone'>
}

/** Image item for sortable grid */
export type ImageItem = {
  id: string
  url: string
  order: number
}

/** Extended type for detail page only -- does not affect existing components */
export type VehicleDetailData = VehicleWithDetails & {
  inspectionData: InspectionData | null
  historyData: HistoryData | null
  warrantyEndDate: Date | null
  warrantyMileage: number | null
  images: (VehicleImage & { category: ImageCategory })[]
}
