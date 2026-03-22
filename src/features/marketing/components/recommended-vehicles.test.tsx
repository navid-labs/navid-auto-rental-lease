import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock VehicleCard to avoid Prisma/store dependencies
vi.mock('@/features/vehicles/components/vehicle-card', () => ({
  VehicleCard: ({ vehicle }: { vehicle: { id: string } }) => (
    <div data-testid={`vehicle-card-${vehicle.id}`}>Vehicle Card</div>
  ),
}))

import { RecommendedVehiclesTabs } from './recommended-vehicles-tabs'

const mockVehicle = (id: string) =>
  ({
    id,
    trim: { generation: { carModel: { brand: { name: 'Test' } } } },
    images: [],
    dealer: { id: '1', name: 'Test', email: 'test@test.com', phone: '010' },
  }) as any

describe('RecommendedVehiclesTabs', () => {
  const popular = [mockVehicle('p1'), mockVehicle('p2')]
  const newest = [mockVehicle('n1')]
  const deals = [mockVehicle('d1'), mockVehicle('d2'), mockVehicle('d3')]

  it('renders 3 tab buttons: 인기차량, 신규입고, 특가차량', () => {
    render(<RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />)
    expect(screen.getByText('인기차량')).toBeDefined()
    expect(screen.getByText('신규입고')).toBeDefined()
    expect(screen.getByText('특가차량')).toBeDefined()
  })

  it('shows popular vehicles by default', () => {
    render(<RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />)
    expect(screen.getByTestId('vehicle-card-p1')).toBeDefined()
    expect(screen.getByTestId('vehicle-card-p2')).toBeDefined()
  })

  it('switches to newest tab on click', () => {
    render(<RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />)
    fireEvent.click(screen.getByText('신규입고'))
    expect(screen.getByTestId('vehicle-card-n1')).toBeDefined()
  })

  it('switches to deals tab on click', () => {
    render(<RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />)
    fireEvent.click(screen.getByText('특가차량'))
    expect(screen.getByTestId('vehicle-card-d1')).toBeDefined()
    expect(screen.getByTestId('vehicle-card-d2')).toBeDefined()
    expect(screen.getByTestId('vehicle-card-d3')).toBeDefined()
  })

  it('renders 더보기 link', () => {
    render(<RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />)
    const moreLink = screen.getByText(/더보기/)
    expect(moreLink).toBeDefined()
    expect(moreLink.closest('a')?.getAttribute('href')).toBe('/vehicles')
  })

  it('shows empty state when no vehicles in tab', () => {
    render(<RecommendedVehiclesTabs popular={[]} newest={[]} deals={[]} />)
    expect(screen.getByText('등록된 차량이 없습니다')).toBeDefined()
  })
})
