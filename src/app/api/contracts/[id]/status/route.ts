import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { updateContractStatusMutation } from '@/features/contracts/mutations/status'
import type { ContractStatus, ContractType } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body: { contractType: ContractType; newStatus: ContractStatus } = await request.json()
    const result = await updateContractStatusMutation(id, body.contractType, body.newStatus, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
