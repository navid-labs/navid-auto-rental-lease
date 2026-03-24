import { requireAdmin } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { approveContractMutation } from '@/features/contracts/mutations/approve'
import type { ContractType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body: { contractType: ContractType; action: 'APPROVED' | 'CANCELED'; reason?: string } =
      await request.json()
    const result = await approveContractMutation(id, body.contractType, body.action, body.reason, auth.user)
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess(result)
  } catch {
    return apiError('서버 오류가 발생했습니다', 500)
  }
}
