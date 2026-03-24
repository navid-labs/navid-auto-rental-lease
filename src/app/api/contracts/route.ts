import { requireRole } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { createContractMutation } from '@/features/contracts/mutations/create'
import type { CreateContractInput } from '@/features/contracts/mutations/create'

export async function POST(request: Request) {
  const auth = await requireRole('CUSTOMER')
  if (auth.error) return auth.error

  try {
    const body: CreateContractInput = await request.json()
    const result = await createContractMutation(body, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result, 201)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
