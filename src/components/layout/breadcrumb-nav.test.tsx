import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { BreadcrumbNav } from './breadcrumb-nav'

describe('BreadcrumbNav', () => {
  it('always renders home link as first item', () => {
    render(<BreadcrumbNav items={[{ label: '내차사기' }]} />)
    const homeLink = screen.getByText('홈')
    expect(homeLink.closest('a')?.getAttribute('href')).toBe('/')
  })

  it('renders single item as current page (no link)', () => {
    render(<BreadcrumbNav items={[{ label: '내차사기' }]} />)
    const current = screen.getByText('내차사기')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('renders intermediate items as links', () => {
    render(
      <BreadcrumbNav
        items={[
          { label: '내차사기', href: '/vehicles' },
          { label: '현대 소나타' },
        ]}
      />
    )
    const middleLink = screen.getByText('내차사기')
    expect(middleLink.closest('a')?.getAttribute('href')).toBe('/vehicles')
    const current = screen.getByText('현대 소나타')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('renders separator between items', () => {
    const { container } = render(
      <BreadcrumbNav
        items={[
          { label: '내차사기', href: '/vehicles' },
          { label: '현대 소나타' },
        ]}
      />
    )
    // Separators are rendered as li elements with role="presentation"
    const separators = container.querySelectorAll('[role="presentation"]')
    expect(separators.length).toBeGreaterThanOrEqual(1)
  })
})
