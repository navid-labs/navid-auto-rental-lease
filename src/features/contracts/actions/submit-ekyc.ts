'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { mockVerifyIdentity, type EkycInput } from '@/features/contracts/utils/mock-ekyc'
import { canTransitionContract } from '@/features/contracts/utils/contract-machine'
import type { ContractType } from '@prisma/client'

type SubmitEkycInput = {
  contractId: string
  contractType: ContractType
  ekycData: EkycInput
}

type SubmitEkycResult = { success: true } | { error: string }

/**
 * Submit eKYC verification for a contract.
 * Transitions: DRAFT -> PENDING_EKYC -> PENDING_APPROVAL
 */
export async function submitEkyc(
  input: SubmitEkycInput
): Promise<SubmitEkycResult> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { contractId, contractType, ekycData } = input

  // Fetch contract and verify ownership
  const contract = contractType === 'RENTAL'
    ? await prisma.rentalContract.findUnique({ where: { id: contractId } })
    : await prisma.leaseContract.findUnique({ where: { id: contractId } })

  if (!contract) return { error: '계약을 찾을 수 없습니다.' }
  if (contract.customerId !== user.id) return { error: '계약 접근 권한이 없습니다.' }

  // Transition 1: DRAFT -> PENDING_EKYC (if still DRAFT)
  if (contract.status === 'DRAFT') {
    if (!canTransitionContract('DRAFT', 'PENDING_EKYC', 'CUSTOMER')) {
      return { error: '본인인증 단계로 전환할 수 없습니다.' }
    }

    if (contractType === 'RENTAL') {
      await prisma.rentalContract.update({
        where: { id: contractId },
        data: { status: 'PENDING_EKYC' },
      })
    } else {
      await prisma.leaseContract.update({
        where: { id: contractId },
        data: { status: 'PENDING_EKYC' },
      })
    }
  }

  // Verify identity
  try {
    const result = await mockVerifyIdentity(ekycData)

    // Create EkycVerification record
    await prisma.ekycVerification.create({
      data: {
        profileId: user.id,
        contractType,
        contractId,
        name: result.name,
        phone: result.phone,
        carrier: result.carrier,
        birthDate: result.birthDate,
        gender: result.gender,
        verified: true,
        verifiedAt: result.verifiedAt,
      },
    })

    // Transition 2: PENDING_EKYC -> PENDING_APPROVAL
    if (canTransitionContract('PENDING_EKYC', 'PENDING_APPROVAL', 'CUSTOMER')) {
      if (contractType === 'RENTAL') {
        await prisma.rentalContract.update({
          where: { id: contractId },
          data: { status: 'PENDING_APPROVAL' },
        })
      } else {
        await prisma.leaseContract.update({
          where: { id: contractId },
          data: { status: 'PENDING_APPROVAL' },
        })
      }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: '본인인증 중 오류가 발생했습니다.' }
  }
}
