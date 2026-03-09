import { describe, it, expect } from 'vitest'
import {
  vehicleConfirmSchema,
  termsSchema,
  ekycSchema,
  reviewSchema,
} from './contract'

describe('Contract Zod Schemas', () => {
  describe('vehicleConfirmSchema', () => {
    it('accepts valid UUID vehicleId', () => {
      const result = vehicleConfirmSchema.safeParse({
        vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-UUID vehicleId', () => {
      const result = vehicleConfirmSchema.safeParse({ vehicleId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('rejects missing vehicleId', () => {
      const result = vehicleConfirmSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('termsSchema', () => {
    it('accepts valid RENTAL terms', () => {
      const result = termsSchema.safeParse({
        contractType: 'RENTAL',
        periodMonths: 24,
        deposit: 500000,
      })
      expect(result.success).toBe(true)
    })

    it('accepts valid LEASE terms', () => {
      const result = termsSchema.safeParse({
        contractType: 'LEASE',
        periodMonths: 36,
        deposit: 0,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid contractType', () => {
      const result = termsSchema.safeParse({
        contractType: 'PURCHASE',
        periodMonths: 24,
        deposit: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects periodMonths below 12', () => {
      const result = termsSchema.safeParse({
        contractType: 'RENTAL',
        periodMonths: 6,
        deposit: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects periodMonths above 60', () => {
      const result = termsSchema.safeParse({
        contractType: 'RENTAL',
        periodMonths: 72,
        deposit: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative deposit', () => {
      const result = termsSchema.safeParse({
        contractType: 'RENTAL',
        periodMonths: 24,
        deposit: -100,
      })
      expect(result.success).toBe(false)
    })

    it('coerces string numbers', () => {
      const result = termsSchema.safeParse({
        contractType: 'RENTAL',
        periodMonths: '24',
        deposit: '500000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.periodMonths).toBe(24)
        expect(result.data.deposit).toBe(500000)
      }
    })
  })

  describe('ekycSchema', () => {
    const validEkyc = {
      name: '홍길동',
      phone: '01012345678',
      carrier: 'SKT',
      birthDate: '1990-01-15',
      gender: 'M',
      verificationCode: '123456',
    }

    it('accepts valid ekyc data', () => {
      const result = ekycSchema.safeParse(validEkyc)
      expect(result.success).toBe(true)
    })

    it('rejects name shorter than 2 chars', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, name: '홍' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid phone format', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, phone: '02-1234-5678' })
      expect(result.success).toBe(false)
    })

    it('accepts valid Korean mobile numbers', () => {
      expect(ekycSchema.safeParse({ ...validEkyc, phone: '01012345678' }).success).toBe(true)
      expect(ekycSchema.safeParse({ ...validEkyc, phone: '01112345678' }).success).toBe(true)
      expect(ekycSchema.safeParse({ ...validEkyc, phone: '0161234567' }).success).toBe(true)
    })

    it('rejects invalid carrier', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, carrier: 'MVNO' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid birthDate format', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, birthDate: '19900115' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid gender', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, gender: 'X' })
      expect(result.success).toBe(false)
    })

    it('rejects verification code not 6 digits', () => {
      const result = ekycSchema.safeParse({ ...validEkyc, verificationCode: '12345' })
      expect(result.success).toBe(false)
      const result2 = ekycSchema.safeParse({ ...validEkyc, verificationCode: '1234567' })
      expect(result2.success).toBe(false)
    })
  })

  describe('reviewSchema', () => {
    it('accepts empty object', () => {
      const result = reviewSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
