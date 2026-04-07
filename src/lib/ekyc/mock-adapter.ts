/**
 * MockKcbAdapter — development/test implementation of KcbAdapter.
 *
 * Simulates KCB eKYC with:
 * - Rate limiting: max 3 send attempts per phone per 5-minute window
 * - Verify lockout: max 5 attempts per phone session
 * - CI (88 bytes) and DI (64 bytes) generation from phone seed
 * - Correct code: '123456'
 */

import type { KcbAdapter, KcbVerifyInput, KcbVerifyResult } from './adapter'

const MAX_SEND_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5

type SendRecord = { count: number; firstAttemptAt: number }

export class MockKcbAdapter implements KcbAdapter {
  private sendAttempts = new Map<string, SendRecord>()
  private verifyAttempts = new Map<string, number>()

  async sendVerificationCode(phone: string): Promise<{ sent: true }> {
    const now = Date.now()
    const record = this.sendAttempts.get(phone)

    if (record) {
      const withinWindow = now - record.firstAttemptAt < RATE_LIMIT_WINDOW_MS
      if (withinWindow) {
        if (record.count >= MAX_SEND_ATTEMPTS) {
          throw new Error('인증번호 발송 횟수를 초과했습니다 (5분 후 재시도)')
        }
        record.count++
      } else {
        // Window expired — reset
        this.sendAttempts.set(phone, { count: 1, firstAttemptAt: now })
      }
    } else {
      this.sendAttempts.set(phone, { count: 1, firstAttemptAt: now })
    }

    await new Promise((r) => setTimeout(r, 500))
    return { sent: true }
  }

  async verifyIdentity(input: KcbVerifyInput): Promise<KcbVerifyResult> {
    const attempts = this.verifyAttempts.get(input.phone) ?? 0
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new Error('인증 시도 횟수를 초과했습니다 (30분 후 재시도)')
    }
    this.verifyAttempts.set(input.phone, attempts + 1)

    await new Promise((r) => setTimeout(r, 500))

    if (input.verificationCode !== '123456') {
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
      ci: generateMockCI(input.phone),
      di: generateMockDI(input.phone),
    }
  }
}

function generateMockCI(phone: string): string {
  const base = Buffer.from(`CI-MOCK-${phone}-NAVID`).toString('base64')
  return base.padEnd(88, '0').slice(0, 88)
}

function generateMockDI(phone: string): string {
  const base = Buffer.from(`DI-MOCK-${phone}-NAVID`).toString('base64')
  return base.padEnd(64, '0').slice(0, 64)
}
