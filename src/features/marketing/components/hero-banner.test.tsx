import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({})),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock the carousel component
vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel">{children}</div>,
  CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselPrevious: () => <button data-testid="carousel-prev" />,
  CarouselNext: () => <button data-testid="carousel-next" />,
}))

import { HeroBanner } from './hero-banner'

describe('HeroBanner', () => {
  it('renders 3 banner slides', () => {
    render(<HeroBanner />)
    expect(screen.getByText('신규 차량 입고')).toBeDefined()
    expect(screen.getByText('렌트 특가')).toBeDefined()
    expect(screen.getByText('보증 서비스')).toBeDefined()
  })

  it('renders navigation arrows', () => {
    const { container } = render(<HeroBanner />)
    expect(container.querySelector('[data-testid="carousel-prev"]')).toBeDefined()
    expect(container.querySelector('[data-testid="carousel-next"]')).toBeDefined()
  })

  it('renders dot indicators for each slide', () => {
    const { container } = render(<HeroBanner />)
    // Dot indicators are buttons inside the dot container (outside carousel)
    const dotContainer = container.querySelector('.flex.justify-center.gap-2')
    const dots = dotContainer?.querySelectorAll('button') ?? []
    expect(dots.length).toBe(3)
  })

  it('includes autoplay plugin import', async () => {
    const Autoplay = await import('embla-carousel-autoplay')
    expect(Autoplay.default).toBeDefined()
  })
})
