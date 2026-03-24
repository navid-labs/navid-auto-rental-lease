import { prisma } from '@/lib/db/prisma'
import { canTransitionContract } from '@/features/contracts/utils/contract-machine'
import type { UserProfile } from '@/lib/auth/helpers'
import type { ContractStatus, ContractType } from '@prisma/client'

export type UpdateContractStatusResult = { success: true } | { error: string }

/**
 * Generic contract status transition.
 * Validates the transition using the state machine before updating.
 */
export async function updateContractStatusMutation(
  contractId: string,
  contractType: ContractType,
  newStatus: ContractStatus,
  user: UserProfile
): Promise<UpdateContractStatusResult> {
  const role = user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'

  try {
    if (contractType === 'RENTAL') {
      const contract = await prisma.rentalContract.findUnique({
        where: { id: contractId },
      })
      if (!contract) return { error: '계약을 찾을 수 없습니다.' }

      // Verify ownership for non-admin
      if (role !== 'ADMIN' && contract.customerId !== user.id) {
        return { error: '계약 접근 권한이 없습니다.' }
      }

      if (!canTransitionContract(contract.status, newStatus, role)) {
        return { error: '해당 상태로 변경할 수 없습니다.' }
      }

      await prisma.rentalContract.update({
        where: { id: contractId },
        data: { status: newStatus },
      })
    } else {
      const contract = await prisma.leaseContract.findUnique({
        where: { id: contractId },
      })
      if (!contract) return { error: '계약을 찾을 수 없습니다.' }

      if (role !== 'ADMIN' && contract.customerId !== user.id) {
        return { error: '계약 접근 권한이 없습니다.' }
      }

      if (!canTransitionContract(contract.status, newStatus, role)) {
        return { error: '해당 상태로 변경할 수 없습니다.' }
      }

      await prisma.leaseContract.update({
        where: { id: contractId },
        data: { status: newStatus },
      })
    }

    return { success: true }
  } catch {
    return { error: '상태 변경 중 오류가 발생했습니다.' }
  }
}
