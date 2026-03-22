import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { QuickLinks } from './quick-links'

describe('QuickLinks', () => {
  it('renders all 8 quick link items', () => {
    render(<QuickLinks />)
    expect(screen.getByText('무료배송')).toBeDefined()
    expect(screen.getByText('위클리특가')).toBeDefined()
    expect(screen.getByText('기획전')).toBeDefined()
    expect(screen.getByText('렌트특가')).toBeDefined()
    expect(screen.getByText('테마기획전')).toBeDefined()
    expect(screen.getByText('내차사기')).toBeDefined()
    expect(screen.getByText('내차팔기')).toBeDefined()
    expect(screen.getByText('안심보증')).toBeDefined()
  })

  it('renders correct hrefs for each link', () => {
    const { container } = render(<QuickLinks />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(8)
    const hrefs = Array.from(links).map(link => link.getAttribute('href'))
    expect(hrefs).toContain('/vehicles')
    expect(hrefs).toContain('/inquiry?type=sell')
  })

  it('renders circular icon containers', () => {
    const { container } = render(<QuickLinks />)
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBeGreaterThanOrEqual(8)
  })
})
