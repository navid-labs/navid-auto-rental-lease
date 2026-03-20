import { describe, it, expect } from 'vitest'
import { historyDataSchema } from './history-data'

function makeValidData() {
  return {
    accidentCount: 1,
    myDamageCount: 1,
    myDamageAmount: 500000,
    otherDamageCount: 0,
    otherDamageAmount: 0,
    ownerCount: 2,
    ownershipHistory: [
      { ownerNumber: 1, usageType: 'personal' as const, startDate: '2020-01-01', endDate: '2023-06-15' },
      { ownerNumber: 2, usageType: 'personal' as const, startDate: '2023-06-15', endDate: null },
    ],
    insuranceClaims: [
      { date: '2022-03-10', type: 'myDamage' as const, amount: 500000, description: 'Front bumper scratch' },
    ],
    warnings: { flood: false, theft: false, totalLoss: false },
  }
}

describe('historyDataSchema', () => {
  it('parses valid data successfully', () => {
    const result = historyDataSchema.parse(makeValidData())
    expect(result.accidentCount).toBe(1)
    expect(result.ownerCount).toBe(2)
  })

  it('applies defaults when fields are omitted', () => {
    const result = historyDataSchema.parse({})
    expect(result.accidentCount).toBe(0)
    expect(result.myDamageCount).toBe(0)
    expect(result.myDamageAmount).toBe(0)
    expect(result.otherDamageCount).toBe(0)
    expect(result.otherDamageAmount).toBe(0)
    expect(result.ownerCount).toBe(1)
    expect(result.ownershipHistory).toEqual([])
    expect(result.insuranceClaims).toEqual([])
    expect(result.warnings.flood).toBe(false)
    expect(result.warnings.theft).toBe(false)
    expect(result.warnings.totalLoss).toBe(false)
  })

  it('validates insuranceClaims as array of objects', () => {
    const data = makeValidData()
    const result = historyDataSchema.parse(data)
    expect(result.insuranceClaims).toHaveLength(1)
    expect(result.insuranceClaims[0].date).toBe('2022-03-10')
    expect(result.insuranceClaims[0].type).toBe('myDamage')
    expect(result.insuranceClaims[0].amount).toBe(500000)
    expect(result.insuranceClaims[0].description).toBe('Front bumper scratch')
  })

  it('validates insurance claim type enum', () => {
    const data = makeValidData()
    data.insuranceClaims[0].type = 'otherDamage'
    const result = historyDataSchema.parse(data)
    expect(result.insuranceClaims[0].type).toBe('otherDamage')
  })

  it('rejects invalid insurance claim type', () => {
    const data = makeValidData()
    ;(data as any).insuranceClaims[0].type = 'unknown'
    expect(() => historyDataSchema.parse(data)).toThrow()
  })

  it('validates warnings defaults to all false', () => {
    const result = historyDataSchema.parse({})
    expect(result.warnings).toEqual({ flood: false, theft: false, totalLoss: false })
  })

  it('validates ownership history usage type enum', () => {
    const data = makeValidData()
    data.ownershipHistory[0].usageType = 'commercial'
    const result = historyDataSchema.parse(data)
    expect(result.ownershipHistory[0].usageType).toBe('commercial')
  })
})
