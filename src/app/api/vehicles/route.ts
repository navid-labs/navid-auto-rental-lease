import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { searchVehicles } from '@/features/vehicles/queries/search'
import { createVehicleMutation } from '@/features/vehicles/mutations/create'
import type { SearchFilters } from '@/features/vehicles/lib/search-query'
import type { VehicleFormData } from '@/features/vehicles/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: SearchFilters = {
      brand: searchParams.get('brandId'),
      model: searchParams.get('modelId'),
      gen: searchParams.get('generationId'),
      yearMin: searchParams.get('minYear') ? Number(searchParams.get('minYear')) : null,
      yearMax: searchParams.get('maxYear') ? Number(searchParams.get('maxYear')) : null,
      priceMin: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
      priceMax: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
      mileMin: null,
      mileMax: null,
      fuel: searchParams.get('fuelType'),
      transmission: searchParams.get('transmissionType'),
      color: null,
      seats: null,
      driveType: null,
      options: null,
      region: null,
      salesType: null,
      keyword: null,
      monthlyMin: null,
      monthlyMax: null,
      homeService: null,
      timeDeal: null,
      noAccident: null,
      hasRental: null,
      vehicleType: null,
    }

    const sort = searchParams.get('sort') ?? 'recommended'
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20

    const vehicles = await searchVehicles(filters, sort, offset, limit)
    return apiSuccess(vehicles)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}

export async function POST(request: Request) {
  const auth = await requireRole('DEALER', 'ADMIN')
  if (auth.error) return auth.error

  try {
    const body = (await request.json()) as VehicleFormData & { dealerIdOverride?: string }
    const { dealerIdOverride, ...vehicleData } = body
    const result = await createVehicleMutation(vehicleData, auth.user, dealerIdOverride)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
