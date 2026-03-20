import { describe, it, expect } from 'vitest'
import { calculateGrade, gradeToLabel, gradeToColor } from './diagnosis-grade'
import type { DiagnosisGrade } from './diagnosis-grade'

describe('calculateGrade', () => {
  it('returns A_PLUS for score >= 90', () => {
    expect(calculateGrade(95)).toBe('A_PLUS')
    expect(calculateGrade(90)).toBe('A_PLUS')
    expect(calculateGrade(100)).toBe('A_PLUS')
  })

  it('returns A for score >= 80 and < 90', () => {
    expect(calculateGrade(85)).toBe('A')
    expect(calculateGrade(80)).toBe('A')
    expect(calculateGrade(89)).toBe('A')
  })

  it('returns B_PLUS for score >= 70 and < 80', () => {
    expect(calculateGrade(75)).toBe('B_PLUS')
    expect(calculateGrade(70)).toBe('B_PLUS')
    expect(calculateGrade(79)).toBe('B_PLUS')
  })

  it('returns B for score >= 60 and < 70', () => {
    expect(calculateGrade(65)).toBe('B')
    expect(calculateGrade(60)).toBe('B')
    expect(calculateGrade(69)).toBe('B')
  })

  it('returns C for score < 60', () => {
    expect(calculateGrade(50)).toBe('C')
    expect(calculateGrade(0)).toBe('C')
    expect(calculateGrade(59)).toBe('C')
  })
})

describe('gradeToLabel', () => {
  it('maps A_PLUS to A+', () => {
    expect(gradeToLabel('A_PLUS')).toBe('A+')
  })

  it('maps B_PLUS to B+', () => {
    expect(gradeToLabel('B_PLUS')).toBe('B+')
  })

  it('maps simple grades directly', () => {
    expect(gradeToLabel('A')).toBe('A')
    expect(gradeToLabel('B')).toBe('B')
    expect(gradeToLabel('C')).toBe('C')
  })
})

describe('gradeToColor', () => {
  it('returns green classes for A_PLUS', () => {
    expect(gradeToColor('A_PLUS')).toContain('text-green-600')
  })

  it('returns blue classes for A', () => {
    expect(gradeToColor('A')).toContain('text-blue-600')
  })

  it('returns yellow classes for B_PLUS', () => {
    expect(gradeToColor('B_PLUS')).toContain('text-yellow-600')
  })

  it('returns orange classes for B', () => {
    expect(gradeToColor('B')).toContain('text-orange-600')
  })

  it('returns red classes for C', () => {
    expect(gradeToColor('C')).toContain('text-red-600')
  })
})
