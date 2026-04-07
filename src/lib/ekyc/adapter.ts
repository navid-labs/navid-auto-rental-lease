/**
 * KCB eKYC Adapter interface.
 *
 * Defines the contract for Korean identity verification providers.
 * Swap implementations (mock, KCB, NICE, etc.) without changing callers.
 */

export type KcbVerifyInput = {
  name: string
  phone: string
  carrier: string
  birthDate: string
  gender: string
  verificationCode: string
}

export type KcbVerifyResult = {
  verified: boolean
  name: string
  phone: string
  carrier: 'SKT' | 'KT' | 'LGU'
  birthDate: string
  gender: 'M' | 'F'
  verifiedAt: Date
  ci: string | null // 연계정보 88 bytes
  di: string | null // 중복가입확인정보 64 bytes
}

export type KcbAdapter = {
  sendVerificationCode(phone: string): Promise<{ sent: true }>
  verifyIdentity(input: KcbVerifyInput): Promise<KcbVerifyResult>
}
