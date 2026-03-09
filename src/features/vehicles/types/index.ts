import type {
  Vehicle,
  VehicleImage,
  Trim,
  Generation,
  CarModel,
  Brand,
  Profile,
  ApprovalStatus,
} from '@prisma/client'

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
