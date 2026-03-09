/**
 * Mock eKYC (electronic Know Your Customer) provider.
 *
 * Simulates Korean PASS-style identity verification with 6-digit SMS code.
 * Uses a pluggable adapter pattern -- swap this module for a real provider
 * (e.g., PASS, KMC, NICE) in production without changing the calling code.
 */

export type EkycInput = {
  name: string
  phone: string
  carrier: string
  birthDate: string
  gender: string
  verificationCode: string
}

export type EkycResult = {
  verified: boolean
  name: string
  phone: string
  carrier: 'SKT' | 'KT' | 'LGU'
  birthDate: string
  gender: 'M' | 'F'
  verifiedAt: Date
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Simulate sending a verification code via SMS.
 * In production, this would call a real SMS gateway.
 */
export async function mockSendVerificationCode(
  _phone: string
): Promise<{ sent: true }> {
  await delay(500)
  return { sent: true }
}

/**
 * Simulate identity verification with a 6-digit code.
 * Default expected code is '123456'.
 *
 * @throws Error if verification code does not match
 */
export async function mockVerifyIdentity(
  input: EkycInput,
  expectedCode: string = '123456'
): Promise<EkycResult> {
  // Simulate network delay (shorter in test env, longer in production)
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  await delay(isTest ? 500 : 1500)

  if (input.verificationCode !== expectedCode) {
    throw new Error('인증번호가 일치하지 않습니다.')
  }

  return {
    verified: true,
    name: input.name,
    phone: input.phone,
    carrier: input.carrier as 'SKT' | 'KT' | 'LGU',
    birthDate: input.birthDate,
    gender: input.gender as 'M' | 'F',
    verifiedAt: new Date(),
  }
}
