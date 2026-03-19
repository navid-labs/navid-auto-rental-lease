import { describe, it, expect } from 'vitest'

describe('COMP-01: Package imports', () => {
  it('embla-carousel-autoplay is importable and exports a function', async () => {
    const mod = await import('embla-carousel-autoplay')
    expect(typeof mod.default).toBe('function')
  })

  it('embla-carousel-auto-scroll is importable and exports a function', async () => {
    const mod = await import('embla-carousel-auto-scroll')
    expect(typeof mod.default).toBe('function')
  })

  it('yet-another-react-lightbox is importable and exports Lightbox', async () => {
    const mod = await import('yet-another-react-lightbox')
    expect(mod.default).toBeDefined()
  })

  it('react-intersection-observer exports useInView hook', async () => {
    const mod = await import('react-intersection-observer')
    expect(typeof mod.useInView).toBe('function')
  })
})
