import { describe, it, expect } from 'vitest'
import { csvRowSchema } from '@/features/inventory/schemas/inventory-upload'

const validRow = {
  category: 'STRATEGIC' as const,
  itemNumber: '001',
  promotion: '특가',
  representModel: '현대 아반떼',
  modelName: '아반떼 1.6 가솔린',
  options: '스마트',
  modelYear: 2025,
  exteriorColor: '흰색',
  interiorColor: '블랙',
  price: 25000000,
  subsidy: 0,
  availableQuantity: 10,
  immediateQuantity: 3,
  productionDate: '2025-03',
  notice: '인기차종',
}

describe('csvRowSchema', () => {
  it('validates a complete valid row', () => {
    const result = csvRowSchema.safeParse(validRow)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('STRATEGIC')
      expect(result.data.modelName).toBe('아반떼 1.6 가솔린')
      expect(result.data.price).toBe(25000000)
    }
  })

  it('rejects row with missing required field (modelName)', () => {
    const { modelName, ...withoutModel } = validRow
    const result = csvRowSchema.safeParse(withoutModel)
    expect(result.success).toBe(false)
  })

  it('coerces string numbers to integers (price: "25000000")', () => {
    const row = { ...validRow, price: '25000000', modelYear: '2025', subsidy: '0' }
    const result = csvRowSchema.safeParse(row)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(25000000)
      expect(result.data.modelYear).toBe(2025)
      expect(result.data.subsidy).toBe(0)
    }
  })

  it('handles optional fields as undefined', () => {
    const { promotion, options, productionDate, notice, ...required } = validRow
    const result = csvRowSchema.safeParse(required)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.promotion).toBeUndefined()
      expect(result.data.options).toBeUndefined()
      expect(result.data.productionDate).toBeUndefined()
      expect(result.data.notice).toBeUndefined()
    }
  })

  it('validates category enum (STRATEGIC/GENERAL only)', () => {
    const strategicResult = csvRowSchema.safeParse({ ...validRow, category: 'STRATEGIC' })
    expect(strategicResult.success).toBe(true)

    const generalResult = csvRowSchema.safeParse({ ...validRow, category: 'GENERAL' })
    expect(generalResult.success).toBe(true)

    const invalidResult = csvRowSchema.safeParse({ ...validRow, category: 'INVALID' })
    expect(invalidResult.success).toBe(false)
  })

  it('rejects missing required exteriorColor', () => {
    const { exteriorColor, ...withoutColor } = validRow
    const result = csvRowSchema.safeParse(withoutColor)
    expect(result.success).toBe(false)
  })

  it('rejects modelYear below 2000', () => {
    const result = csvRowSchema.safeParse({ ...validRow, modelYear: 1999 })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = csvRowSchema.safeParse({ ...validRow, price: -1 })
    expect(result.success).toBe(false)
  })
})
