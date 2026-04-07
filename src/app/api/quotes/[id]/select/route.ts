import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { selectBidSchema } from '@/features/quotes/schemas/quote-request'
import { selectBid } from '@/features/quotes/mutations/select-bid'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('CUSTOMER')
  if (auth.error) return auth.error

  const { id } = await params

  const parsed = await parseBody(selectBidSchema, request)
  if (parsed.error) return parsed.error

  try {
    const result = await selectBid(id, parsed.data.bidId, auth.user.id)
    if (!result.success) return apiError(result.error, 400)
    return apiSuccess(result.data)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
