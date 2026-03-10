import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
  mockPrisma: {
    defaultSetting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    promoRate: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { promoRateSchema, defaultSettingSchema } from '@/features/settings/schemas/settings'
import { verifySettingsPassword } from '@/features/settings/actions/settings-auth'
import { upsertPromoRate } from '@/features/settings/actions/settings'

describe('promoRateSchema', () => {
  it('validates valid data (brandId UUID, rate 0-1, optional label)', () => {
    const result = promoRateSchema.safeParse({
      brandId: '11111111-1111-4111-a111-111111111111',
      rate: 0.05,
      label: '현대 프로모션',
    })
    expect(result.success).toBe(true)
  })

  it('validates data without optional label', () => {
    const result = promoRateSchema.safeParse({
      brandId: '11111111-1111-4111-a111-111111111111',
      rate: 0.5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid rate > 1', () => {
    const result = promoRateSchema.safeParse({
      brandId: '11111111-1111-4111-a111-111111111111',
      rate: 1.5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })

  it('rejects invalid rate < 0', () => {
    const result = promoRateSchema.safeParse({
      brandId: '11111111-1111-4111-a111-111111111111',
      rate: -0.1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid brandId (not UUID)', () => {
    const result = promoRateSchema.safeParse({
      brandId: 'not-a-uuid',
      rate: 0.05,
    })
    expect(result.success).toBe(false)
  })
})

describe('defaultSettingSchema', () => {
  it('validates valid key/value/label', () => {
    const result = defaultSettingSchema.safeParse({
      key: 'default_rate',
      value: '0.084',
      label: '기본 금리',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty key', () => {
    const result = defaultSettingSchema.safeParse({
      key: '',
      value: '0.084',
      label: '기본 금리',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty value', () => {
    const result = defaultSettingSchema.safeParse({
      key: 'default_rate',
      value: '',
      label: '기본 금리',
    })
    expect(result.success).toBe(false)
  })
})

describe('verifySettingsPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for wrong password', async () => {
    mockPrisma.defaultSetting.findUnique.mockResolvedValue(null)
    const result = await verifySettingsPassword('wrongpass')
    expect(result).toEqual({ error: '비밀번호가 일치하지 않습니다.' })
  })

  it('accepts default password when no custom password set', async () => {
    mockPrisma.defaultSetting.findUnique.mockResolvedValue(null)
    const result = await verifySettingsPassword('admin1234')
    expect(result).toEqual({ success: true })
  })

  it('accepts custom password from DB', async () => {
    mockPrisma.defaultSetting.findUnique.mockResolvedValue({
      key: 'settings_password',
      value: 'custom123',
    })
    const result = await verifySettingsPassword('custom123')
    expect(result).toEqual({ success: true })
  })

  it('returns error for empty password', async () => {
    const result = await verifySettingsPassword('')
    expect(result).toEqual({ error: '비밀번호를 입력해주세요.' })
  })
})

describe('upsertPromoRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin users', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' })
    await expect(
      upsertPromoRate({
        brandId: '11111111-1111-4111-a111-111111111111',
        rate: 0.05,
      })
    ).rejects.toThrow('권한이 없습니다.')
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    await expect(
      upsertPromoRate({
        brandId: '11111111-1111-4111-a111-111111111111',
        rate: 0.05,
      })
    ).rejects.toThrow('권한이 없습니다.')
  })
})
