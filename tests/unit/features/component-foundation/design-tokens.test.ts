import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const css = readFileSync(resolve(__dirname, '../../../../src/app/globals.css'), 'utf-8')

describe('Design Tokens', () => {
  describe(':root variables', () => {
    it.each([
      ['--badge-success', 'hsl(142 71% 45%)'],
      ['--badge-warning', 'hsl(38 92% 50%)'],
      ['--badge-info', 'hsl(217 91% 60%)'],
      ['--badge-new', 'hsl(262 83% 58%)'],
      ['--card-hover', 'hsl(220 15% 96%)'],
      ['--text-price', 'hsl(217 91% 60%)'],
      ['--text-secondary', 'hsl(220 10% 45%)'],
    ])('defines %s', (varName) => {
      expect(css).toContain(varName)
    })
  })

  describe('@theme inline mappings', () => {
    it.each([
      '--color-badge-success',
      '--color-badge-warning',
      '--color-badge-info',
      '--color-badge-new',
      '--color-card-hover',
      '--color-text-price',
      '--color-text-secondary',
    ])('maps %s in @theme inline', (mapping) => {
      expect(css).toContain(mapping)
    })
  })
})
