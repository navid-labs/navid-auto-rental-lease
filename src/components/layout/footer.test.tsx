import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { Footer } from './footer'

describe('Footer', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders SNS links for Instagram, YouTube, Blog, Kakao', () => {
    render(<Footer />)
    expect(screen.getByLabelText('인스타그램')).toBeDefined()
    expect(screen.getByLabelText('유튜브')).toBeDefined()
    expect(screen.getByLabelText('블로그')).toBeDefined()
    expect(screen.getByLabelText('카카오')).toBeDefined()
  })

  it('renders SNS links with target="_blank"', () => {
    render(<Footer />)
    const instaLink = screen.getByLabelText('인스타그램')
    expect(instaLink.getAttribute('target')).toBe('_blank')
    expect(instaLink.getAttribute('rel')).toContain('noopener')
  })

  it('renders awards section', () => {
    render(<Footer />)
    expect(screen.getByText(/고객만족도 1위/)).toBeDefined()
    expect(screen.getByText(/브랜드 대상/)).toBeDefined()
  })

  it('renders app download placeholders', () => {
    render(<Footer />)
    expect(screen.getByText('App Store')).toBeDefined()
    expect(screen.getByText('Google Play')).toBeDefined()
  })

  it('preserves customer center phone number', () => {
    render(<Footer />)
    expect(screen.getByText(/1544-2277/)).toBeDefined()
  })

  it('preserves business registration info', () => {
    render(<Footer />)
    expect(screen.getByText(/사업자등록번호/)).toBeDefined()
  })
})
