import type { ContractStatus, ContractType } from '@prisma/client'
import type {
  RentalContract,
  LeaseContract,
  Vehicle,
  VehicleImage,
  Trim,
  Generation,
  CarModel,
  Brand,
} from '@prisma/client'

export type { ContractStatus, ContractType }

/** Contract wizard step number (1-4) */
export type ContractWizardStep = 1 | 2 | 3 | 4

/** Form data for the eKYC verification step */
export type EkycFormData = {
  name: string
  phone: string
  carrier: 'SKT' | 'KT' | 'LGU'
  birthDate: string
  gender: 'M' | 'F'
  verificationCode: string
}

/** Form data for the terms/conditions step */
export type TermsFormData = {
  contractType: 'RENTAL' | 'LEASE'
  periodMonths: number
  deposit: number
}

/** Aggregate form data across all wizard steps */
export type ContractFormData = {
  vehicleId: string
  contractType: 'RENTAL' | 'LEASE'
  periodMonths: number
  deposit: number
  ekyc: EkycFormData
}

/** Vehicle with full hierarchy for contract display */
export type VehicleWithDetails = Vehicle & {
  images: VehicleImage[]
  trim: Trim & {
    generation: Generation & {
      carModel: CarModel & {
        brand: Brand
      }
    }
  }
}

/** Contract (rental or lease) with vehicle details */
export type ContractWithVehicle = (RentalContract | LeaseContract) & {
  vehicle: VehicleWithDetails
}

/** Data shape for PDF template rendering */
export type ContractPDFData = {
  contractType: 'RENTAL' | 'LEASE'
  contractId: string
  status: ContractStatus
  // Vehicle
  vehicleName: string
  vehicleYear: number
  vehiclePlateNumber: string | null
  vehicleMileage: number
  vehicleColor: string | null
  // Parties
  customerName: string
  customerPhone: string | null
  customerEmail: string
  dealerName: string | null
  // Terms
  startDate: Date | null
  endDate: Date | null
  monthlyPayment: number
  deposit: number
  totalAmount: number
  // Lease-only
  residualValue?: number | null
  residualRate?: number | null
  // Meta
  createdAt: Date
}
