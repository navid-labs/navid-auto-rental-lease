import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { createQuoteRequestSchema } from '@/features/quotes/schemas/quote-request'
import { createQuoteRequest } from '@/features/quotes/mutations/create-quote'

export async function POST(request: Request) {
  const auth = await requireRole('CUSTOMER')
  if (auth.error) return auth.error

  const parsed = await parseBody(createQuoteRequestSchema, request)
  if (parsed.error) return parsed.error

  try {
    const quote = await createQuoteRequest(auth.user.id, parsed.data)
    return apiSuccess(quote, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
