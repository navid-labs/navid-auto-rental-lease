'use server'

import { mockSendVerificationCode } from '@/features/contracts/utils/mock-ekyc'

type SendCodeResult = { sent: true } | { error: string }

/**
 * Server action wrapper for sending eKYC verification code via SMS.
 */
export async function sendVerificationCode(
  phone: string
): Promise<SendCodeResult> {
  try {
    const result = await mockSendVerificationCode(phone)
    return result
  } catch {
    return { error: '인증번호 발송에 실패했습니다.' }
  }
}
