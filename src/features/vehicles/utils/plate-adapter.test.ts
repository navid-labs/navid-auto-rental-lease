import { describe, it, expect } from 'vitest'
import { MockPlateProvider, lookupPlate } from './plate-adapter'

describe('MockPlateProvider', () => {
  const provider = new MockPlateProvider()

  it('returns vehicle data for valid Korean plate (2-digit prefix)', async () => {
    const result = await provider.lookup('12가1234')
    expect(result).not.toBeNull()
    expect(result?.brand).toBeDefined()
    expect(result?.model).toBeDefined()
    expect(result?.year).toBeGreaterThan(0)
  })

  it('returns vehicle data for valid Korean plate (3-digit prefix)', async () => {
    const result = await provider.lookup('123가1234')
    expect(result).not.toBeNull()
    expect(result?.brand).toBeDefined()
  })

  it('returns null for invalid plate format', async () => {
    const result = await provider.lookup('invalid')
    expect(result).toBeNull()
  })

  it('returns null for empty string', async () => {
    const result = await provider.lookup('')
    expect(result).toBeNull()
  })

  it('returns null for plate with wrong structure', async () => {
    const result = await provider.lookup('ABC-1234')
    expect(result).toBeNull()
  })
})

describe('lookupPlate', () => {
  it('uses MockPlateProvider by default', async () => {
    const result = await lookupPlate('12가1234')
    expect(result).not.toBeNull()
    expect(result?.brand).toBeDefined()
  })

  it('returns null for invalid plate', async () => {
    const result = await lookupPlate('invalid')
    expect(result).toBeNull()
  })
})
