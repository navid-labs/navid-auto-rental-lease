import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { submitEkycMutation } from '@/features/contracts/mutations/ekyc'
import type { ContractType } from '@prisma/client'
import type { EkycInput } from '@/features/contracts/utils/mock-ekyc'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body: { contractType: ContractType; ekycData: EkycInput } = await request.json()
    const result = await submitEkycMutation(
      { contractId: id, contractType: body.contractType, ekycData: body.ekycData },
      auth.user
    )
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
