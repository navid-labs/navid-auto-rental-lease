import { prisma } from '@/lib/db/prisma'
import { mockVerifyIdentity, mockSendVerificationCode, type EkycInput } from '@/features/contracts/utils/mock-ekyc'
import { canTransitionContract } from '@/features/contracts/utils/contract-machine'
import type { UserProfile } from '@/lib/auth/helpers'
import type { ContractType } from '@prisma/client'

export type SubmitEkycInput = {
  contractId: string
  contractType: ContractType
  ekycData: EkycInput
}

export type SubmitEkycResult = { success: true } | { error: string }
export type SendVerificationCodeResult = { sent: true } | { error: string }

/**
 * Submit eKYC verification for a contract.
 * Transitions: DRAFT -> PENDING_EKYC -> PENDING_APPROVAL
 */
export async function submitEkycMutation(
  input: SubmitEkycInput,
  user: UserProfile
): Promise<SubmitEkycResult> {
  const { contractId, contractType, ekycData } = input

  // Fetch contract and verify ownership
  const contract =
    contractType === 'RENTAL'
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

/**
 * Send eKYC verification code via SMS (mock implementation).
 */
export async function sendVerificationCodeMutation(
  phone: string
): Promise<SendVerificationCodeResult> {
  try {
    const result = await mockSendVerificationCode(phone)
    return result
  } catch {
    return { error: '인증번호 발송에 실패했습니다.' }
  }
}
