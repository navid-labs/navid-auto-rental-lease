import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Bun.password globally since vitest runs in happy-dom (not Bun runtime)
const mockBunPasswordVerify = vi.fn()
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    defaultSetting: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

// Set up global Bun mock before importing the module under test
;(globalThis as Record<string, unknown>).Bun = {
  password: {
    verify: mockBunPasswordVerify,
    hash: vi.fn(),
  },
}

import { verifySettingsPasswordMutation } from '@/features/settings/mutations/auth'

// A realistic argon2id hash prefix for testing detection logic
const FAKE_ARGON2_HASH = '$argon2id$v=19$m=65536,t=2,p=1$fakesaltvalue$fakehashvalue'

describe('verifySettingsPasswordMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when password is empty string', async () => {
    const result = await verifySettingsPasswordMutation('')
    expect(result).toEqual({ error: '비밀번호를 입력해주세요.' })
  })

  it('returns error when password is wrong against a hashed stored value', async () => {
    mockBunPasswordVerify.mockResolvedValue(false)
    mockPrisma.defaultSetting.findUnique.mockResolvedValue({
      key: 'settings_password',
      value: FAKE_ARGON2_HASH,
    })

    const result = await verifySettingsPasswordMutation('wrongpassword')
    expect(result).toEqual({ error: '비밀번호가 일치하지 않습니다.' })
    expect(mockBunPasswordVerify).toHaveBeenCalledWith('wrongpassword', FAKE_ARGON2_HASH)
  })

  it('returns success when password matches the argon2 hash', async () => {
    mockBunPasswordVerify.mockResolvedValue(true)
    mockPrisma.defaultSetting.findUnique.mockResolvedValue({
      key: 'settings_password',
      value: FAKE_ARGON2_HASH,
    })

    const result = await verifySettingsPasswordMutation('testpass')
    expect(result).toEqual({ success: true })
    expect(mockBunPasswordVerify).toHaveBeenCalledWith('testpass', FAKE_ARGON2_HASH)
  })

  it('handles backwards compatibility -- plaintext stored passwords still work', async () => {
    // Stored value is plaintext (no $argon2 prefix)
    mockPrisma.defaultSetting.findUnique.mockResolvedValue({
      key: 'settings_password',
      value: 'admin1234',
    })

    const result = await verifySettingsPasswordMutation('admin1234')
    expect(result).toEqual({ success: true })
    // Bun.password.verify should NOT be called for plaintext
    expect(mockBunPasswordVerify).not.toHaveBeenCalled()
  })

  it('uses Bun.password.verify for argon2 hashes (stored value starts with $argon2)', async () => {
    mockBunPasswordVerify.mockResolvedValue(true)
    mockPrisma.defaultSetting.findUnique.mockResolvedValue({
      key: 'settings_password',
      value: FAKE_ARGON2_HASH,
    })

    await verifySettingsPasswordMutation('testpass')

    expect(mockBunPasswordVerify).toHaveBeenCalledWith('testpass', FAKE_ARGON2_HASH)
  })

  it('falls back to DEFAULT_PASSWORD when no record exists in DB', async () => {
    mockPrisma.defaultSetting.findUnique.mockResolvedValue(null)

    const result = await verifySettingsPasswordMutation('admin1234')
    expect(result).toEqual({ success: true })
  })

  it('rejects wrong password when no record exists in DB', async () => {
    mockPrisma.defaultSetting.findUnique.mockResolvedValue(null)

    const result = await verifySettingsPasswordMutation('wrongpass')
    expect(result).toEqual({ error: '비밀번호가 일치하지 않습니다.' })
  })
})
