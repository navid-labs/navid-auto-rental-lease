'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { canTransitionContract } from '@/features/contracts/utils/contract-machine'
import type { ContractStatus, ContractType } from '@prisma/client'

type ApproveContractResult = { success: true } | { error: string }

/**
 * Admin action to approve or reject a contract.
 * On approval: sets vehicle to RENTED/LEASED, sets start/end dates.
 * On rejection: restores vehicle to AVAILABLE.
 */
export async function approveContract(
  contractId: string,
  contractType: ContractType | 'RENTAL' | 'LEASE',
  action: 'APPROVED' | 'CANCELED',
  reason?: string
): Promise<ApproveContractResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (user.role !== 'ADMIN') return { error: '관리자만 계약을 승인/반려할 수 있습니다.' }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch contract
      let contract: { id: string; status: ContractStatus; vehicleId: string; monthlyPayment: number; totalAmount: number } | null = null

      if (contractType === 'RENTAL') {
        contract = await tx.rentalContract.findUnique({
          where: { id: contractId },
          select: { id: true, status: true, vehicleId: true, monthlyPayment: true, totalAmount: true },
        })
      } else {
        contract = await tx.leaseContract.findUnique({
          where: { id: contractId },
          select: { id: true, status: true, vehicleId: true, monthlyPayment: true, totalAmount: true },
        })
      }

      if (!contract) {
        throw new Error('계약을 찾을 수 없습니다.')
      }

      // 2. Validate transition
      if (!canTransitionContract(contract.status as ContractStatus, action as ContractStatus, 'ADMIN')) {
        throw new Error('해당 상태로 변경할 수 없습니다.')
      }

      // 3. Calculate dates for approval
      const now = new Date()
      const periodMonths = contract.monthlyPayment > 0
        ? Math.round(contract.totalAmount / contract.monthlyPayment)
        : 36
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + periodMonths)

      // 4. Update contract status
      const updateData: Record<string, unknown> = {
        status: action,
      }

      if (action === 'APPROVED') {
        updateData.startDate = now
        updateData.endDate = endDate
      }

      if (contractType === 'RENTAL') {
        await tx.rentalContract.update({
          where: { id: contractId },
          data: updateData,
        })
      } else {
        await tx.leaseContract.update({
          where: { id: contractId },
          data: updateData,
        })
      }

      // 5. Update vehicle status
      if (action === 'APPROVED') {
        const vehicleStatus = contractType === 'RENTAL' ? 'RENTED' : 'LEASED'
        await tx.vehicle.update({
          where: { id: contract.vehicleId },
          data: { status: vehicleStatus },
        })
      } else if (action === 'CANCELED') {
        await tx.vehicle.update({
          where: { id: contract.vehicleId },
          data: { status: 'AVAILABLE' },
        })
      }
    })

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: '계약 처리 중 오류가 발생했습니다.' }
  }
}
