/** Result from a license plate lookup */
export type PlateResult = {
  brand?: string
  model?: string
  year?: number
  fuelType?: string
  engineCC?: number
  color?: string
  transmission?: string
}

/** Interface for license plate lookup providers */
export interface PlateProvider {
  lookup(plateNumber: string, ownerName?: string): Promise<PlateResult | null>
}

/** Korean license plate pattern: 2-3 digits + Korean char + 4 digits */
const KOREAN_PLATE_REGEX = /^\d{2,3}[가-힣]\d{4}$/

/**
 * Mock provider for development.
 * Returns realistic Korean vehicle data for valid plate patterns.
 * Replace with a real provider (data.go.kr, hyphen.im) when API access is secured.
 */
export class MockPlateProvider implements PlateProvider {
  async lookup(plateNumber: string): Promise<PlateResult | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (!plateNumber || !KOREAN_PLATE_REGEX.test(plateNumber)) {
      return null
    }

    return {
      brand: '현대',
      model: '그랜저',
      year: 2023,
      fuelType: 'GASOLINE',
      engineCC: 2497,
      color: '흰색',
      transmission: 'AUTOMATIC',
    }
  }
}

// Default provider instance
const defaultProvider: PlateProvider = new MockPlateProvider()

/**
 * Look up vehicle data by Korean license plate number.
 * Uses MockPlateProvider in development; swap provider for production.
 */
export async function lookupPlate(
  plateNumber: string,
  provider: PlateProvider = defaultProvider
): Promise<PlateResult | null> {
  return provider.lookup(plateNumber)
}
