import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { createDealerBidSchema } from '@/features/quotes/schemas/quote-request'
import { createDealerBid } from '@/features/quotes/mutations/create-bid'

export async function POST(request: Request) {
  const auth = await requireRole('DEALER')
  if (auth.error) return auth.error

  const parsed = await parseBody(createDealerBidSchema, request)
  if (parsed.error) return parsed.error

  try {
    const result = await createDealerBid(auth.user.id, parsed.data)
    if (!result.success) return apiError(result.error, 400)
    return apiSuccess(result.data, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
