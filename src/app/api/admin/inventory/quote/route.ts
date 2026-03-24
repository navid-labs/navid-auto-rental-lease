import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { generateQuoteMutation } from '@/features/inventory/mutations/quote'
import type { InventoryVehicleForQuote, QuoteParams } from '@/features/inventory/types/quote'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body: { vehicles: InventoryVehicleForQuote[]; params: QuoteParams } =
      await request.json()
    const result = await generateQuoteMutation(body.vehicles, body.params)
    return apiSuccess(result)
  } catch (error) {
    if (error instanceof Error) {
      return apiError(error.message, 422)
    }
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
