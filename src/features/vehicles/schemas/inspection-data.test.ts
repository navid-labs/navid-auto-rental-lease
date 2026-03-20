import { describe, it, expect } from 'vitest'
import { inspectionDataSchema } from './inspection-data'

const PANEL_KEYS = [
  'hood', 'frontBumper', 'rearBumper', 'trunk', 'roof',
  'frontLeftFender', 'frontRightFender', 'rearLeftFender', 'rearRightFender',
  'frontLeftDoor', 'frontRightDoor', 'rearLeftDoor', 'rearRightDoor',
  'leftRocker', 'rightRocker',
] as const

function makeValidPanels() {
  const panels: Record<string, string> = {}
  for (const key of PANEL_KEYS) {
    panels[key] = 'normal'
  }
  return panels
}

function makeValidCategory() {
  return { score: 85, totalItems: 10, passedItems: 8, warningItems: 1, failedItems: 1 }
}

function makeValidData() {
  return {
    overallScore: 88,
    overallGrade: 'A' as const,
    panels: makeValidPanels(),
    repaintCount: 2,
    replacedCount: 0,
    categories: {
      interior: makeValidCategory(),
      exterior: makeValidCategory(),
      tires: makeValidCategory(),
      consumables: makeValidCategory(),
      undercarriage: makeValidCategory(),
    },
    accidentDiagnosis: 'none' as const,
    evaluator: null,
    inspectedAt: '2026-01-15',
  }
}

describe('inspectionDataSchema', () => {
  it('parses valid data successfully', () => {
    const result = inspectionDataSchema.parse(makeValidData())
    expect(result.overallScore).toBe(88)
    expect(result.overallGrade).toBe('A')
  })

  it('fails on empty object', () => {
    expect(() => inspectionDataSchema.parse({})).toThrow()
  })

  it('validates all 15 panel keys', () => {
    const data = makeValidData()
    const result = inspectionDataSchema.parse(data)
    for (const key of PANEL_KEYS) {
      expect(result.panels[key]).toBeDefined()
    }
  })

  it('validates panel status enum values', () => {
    const data = makeValidData()
    data.panels.hood = 'repainted'
    data.panels.trunk = 'replaced'
    const result = inspectionDataSchema.parse(data)
    expect(result.panels.hood).toBe('repainted')
    expect(result.panels.trunk).toBe('replaced')
  })

  it('rejects invalid panel status', () => {
    const data = makeValidData()
    data.panels.hood = 'damaged'
    expect(() => inspectionDataSchema.parse(data)).toThrow()
  })

  it('validates evaluator as nullable object', () => {
    const data = makeValidData()
    data.evaluator = null
    const result = inspectionDataSchema.parse(data)
    expect(result.evaluator).toBeNull()
  })

  it('validates evaluator with all fields', () => {
    const data = makeValidData()
    ;(data as any).evaluator = {
      name: 'Kim',
      branch: 'Seoul',
      employeeId: 'E001',
      photoUrl: null,
      recommendation: 'Good condition',
    }
    const result = inspectionDataSchema.parse(data)
    expect(result.evaluator?.name).toBe('Kim')
    expect(result.evaluator?.photoUrl).toBeNull()
  })

  it('validates overallGrade enum values', () => {
    for (const grade of ['A_PLUS', 'A', 'B_PLUS', 'B', 'C'] as const) {
      const data = makeValidData()
      data.overallGrade = grade
      expect(() => inspectionDataSchema.parse(data)).not.toThrow()
    }
  })

  it('rejects invalid overallGrade', () => {
    const data = makeValidData()
    ;(data as any).overallGrade = 'D'
    expect(() => inspectionDataSchema.parse(data)).toThrow()
  })
})
