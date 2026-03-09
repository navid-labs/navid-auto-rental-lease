import { describe, it, expect } from 'vitest'
import {
  vehicleStep1Schema,
  vehicleStep2Schema,
  vehicleFormSchema,
} from './vehicle'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'

describe('vehicleStep1Schema', () => {
  it('accepts valid step 1 data', () => {
    const result = vehicleStep1Schema.safeParse({
      brandId: validUuid,
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional licensePlate', () => {
    const result = vehicleStep1Schema.safeParse({
      brandId: validUuid,
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
      licensePlate: '12가1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing brandId', () => {
    const result = vehicleStep1Schema.safeParse({
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid uuid format', () => {
    const result = vehicleStep1Schema.safeParse({
      brandId: 'not-a-uuid',
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty string for required fields', () => {
    const result = vehicleStep1Schema.safeParse({
      brandId: '',
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
    })
    expect(result.success).toBe(false)
  })
})

describe('vehicleStep2Schema', () => {
  it('accepts valid step 2 data', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(true)
  })

  it('coerces string numbers', () => {
    const result = vehicleStep2Schema.safeParse({
      year: '2023',
      mileage: '50000',
      color: '흰색',
      price: '35000000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2023)
      expect(result.data.mileage).toBe(50000)
      expect(result.data.price).toBe(35000000)
    }
  })

  it('accepts optional fields', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
      monthlyRental: 500000,
      monthlyLease: 450000,
      description: '잘 관리된 차량입니다.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects year below 1990', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 1989,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects year above current+1', () => {
    const futureYear = new Date().getFullYear() + 2
    const result = vehicleStep2Schema.safeParse({
      year: futureYear,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative mileage', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: -100,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero price', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: -1000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty color', () => {
    const result = vehicleStep2Schema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '',
      price: 35000000,
    })
    expect(result.success).toBe(false)
  })
})

describe('vehicleFormSchema', () => {
  it('accepts complete valid form data', () => {
    const result = vehicleFormSchema.safeParse({
      brandId: validUuid,
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects data missing step 1 fields', () => {
    const result = vehicleFormSchema.safeParse({
      year: 2023,
      mileage: 50000,
      color: '흰색',
      price: 35000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects data missing step 2 fields', () => {
    const result = vehicleFormSchema.safeParse({
      brandId: validUuid,
      modelId: validUuid,
      generationId: validUuid,
      trimId: validUuid,
    })
    expect(result.success).toBe(false)
  })
})
