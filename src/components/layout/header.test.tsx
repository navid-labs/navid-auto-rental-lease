import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { HeaderSearch } from './header-search'
import { MegaMenu } from './mega-menu'

describe('HeaderSearch', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders search input with placeholder', () => {
    render(<HeaderSearch />)
    expect(screen.getByPlaceholderText(/차량 검색/)).toBeDefined()
  })

  it('navigates to /vehicles with keyword on Enter', () => {
    render(<HeaderSearch />)
    const input = screen.getByPlaceholderText(/차량 검색/)
    fireEvent.change(input, { target: { value: '소나타' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/vehicles?keyword=%EC%86%8C%EB%82%98%ED%83%80')
  })

  it('does not navigate on empty keyword', () => {
    render(<HeaderSearch />)
    const input = screen.getByPlaceholderText(/차량 검색/)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders search button with aria-label', () => {
    render(<HeaderSearch />)
    expect(screen.getByLabelText('검색')).toBeDefined()
  })
})

describe('MegaMenu', () => {
  it('renders all navigation categories', () => {
    render(<MegaMenu />)
    expect(screen.getByText('내차사기')).toBeDefined()
    expect(screen.getByText('내차팔기')).toBeDefined()
    expect(screen.getByText('렌트/구독')).toBeDefined()
    expect(screen.getByText('금융서비스')).toBeDefined()
    expect(screen.getByText('고객센터')).toBeDefined()
  })

  it('renders correct href for each category link', () => {
    render(<MegaMenu />)
    const buyLink = screen.getByText('내차사기').closest('a')
    expect(buyLink?.getAttribute('href')).toBe('/vehicles')
  })
})
