import { describe, it, expect } from 'vitest'
import { mockVerifyIdentity, mockSendVerificationCode } from './mock-ekyc'
import type { EkycInput, EkycResult } from './mock-ekyc'

const validInput: EkycInput = {
  name: '홍길동',
  phone: '01012345678',
  carrier: 'SKT',
  birthDate: '1990-01-15',
  gender: 'M',
  verificationCode: '123456',
}

describe('Mock eKYC Provider', () => {
  describe('mockSendVerificationCode', () => {
    it('returns { sent: true } after delay', async () => {
      const start = Date.now()
      const result = await mockSendVerificationCode('01012345678')
      const elapsed = Date.now() - start
      expect(result).toEqual({ sent: true })
      expect(elapsed).toBeGreaterThanOrEqual(400) // allow slight timing variance
    })
  })

  describe('mockVerifyIdentity', () => {
    it('returns verified result with correct code (123456)', async () => {
      const result = await mockVerifyIdentity(validInput)
      expect(result.verified).toBe(true)
      expect(result.name).toBe('홍길동')
      expect(result.phone).toBe('01012345678')
      expect(result.carrier).toBe('SKT')
      expect(result.birthDate).toBe('1990-01-15')
      expect(result.gender).toBe('M')
      expect(result.verifiedAt).toBeInstanceOf(Date)
    })

    it('throws error with wrong verification code', async () => {
      const wrongInput = { ...validInput, verificationCode: '000000' }
      await expect(mockVerifyIdentity(wrongInput)).rejects.toThrow(
        '인증번호가 일치하지 않습니다.'
      )
    })

    it('accepts custom expected code', async () => {
      const customInput = { ...validInput, verificationCode: '999999' }
      const result = await mockVerifyIdentity(customInput, '999999')
      expect(result.verified).toBe(true)
    })

    it('simulates async delay (at least 500ms)', async () => {
      const start = Date.now()
      await mockVerifyIdentity(validInput)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(400) // allow slight timing variance
    })

    it('EkycResult has all required fields', async () => {
      const result: EkycResult = await mockVerifyIdentity(validInput)
      expect(result).toHaveProperty('verified')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('phone')
      expect(result).toHaveProperty('carrier')
      expect(result).toHaveProperty('birthDate')
      expect(result).toHaveProperty('gender')
      expect(result).toHaveProperty('verifiedAt')
    })
  })
})
