import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const getCurrentUser = vi.fn()
  const profileUpdate = vi.fn()
  const adminUpdateUserById = vi.fn()
  const revalidatePath = vi.fn()

  return {
    getCurrentUser,
    prisma: {
      profile: {
        update: profileUpdate,
      },
    },
    adminClient: {
      auth: {
        admin: {
          updateUserById: adminUpdateUserById,
        },
      },
    },
    adminUpdateUserById,
    profileUpdate,
    revalidatePath,
  }
})

vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: mocks.prisma,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mocks.adminClient,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

import { updateProfile, changeUserRole } from './profile'

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects if user not authenticated', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const formData = new FormData()
    formData.set('name', 'Test')

    const result = await updateProfile(formData)
    expect(result).toEqual({ error: '로그인이 필요합니다.' })
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })

  it('rejects invalid input', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' })

    const formData = new FormData()
    formData.set('name', '') // name is required, empty should fail

    const result = await updateProfile(formData)
    expect(result).toEqual({ error: '입력 정보를 확인해주세요.' })
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })

  it('updates name and phone for authenticated user', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' })
    mocks.profileUpdate.mockResolvedValue({ id: 'user-1', name: 'New Name', phone: '010-1234-5678' })

    const formData = new FormData()
    formData.set('name', 'New Name')
    formData.set('phone', '010-1234-5678')

    const result = await updateProfile(formData)
    expect(result).toEqual({ success: true })
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'New Name', phone: '010-1234-5678' },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/mypage')
  })

  it('does not allow changing role or email', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' })
    mocks.profileUpdate.mockResolvedValue({ id: 'user-1', name: 'Name' })

    const formData = new FormData()
    formData.set('name', 'Name')
    formData.set('role', 'ADMIN') // should be ignored
    formData.set('email', 'hack@evil.com') // should be ignored

    const result = await updateProfile(formData)
    expect(result).toEqual({ success: true })
    // Only name and phone should be in the update data
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Name', phone: undefined },
    })
  })
})

describe('changeUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects if caller is not authenticated', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const result = await changeUserRole('target-user', 'DEALER')
    expect(result).toEqual({ error: '권한이 없습니다.' })
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })

  it('rejects if caller is not ADMIN', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' })

    const result = await changeUserRole('target-user', 'DEALER')
    expect(result).toEqual({ error: '권한이 없습니다.' })
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })

  it('rejects invalid role values', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })

    const result = await changeUserRole('target-user', 'SUPERADMIN' as 'ADMIN')
    expect(result).toEqual({ error: '유효하지 않은 역할입니다.' })
    expect(mocks.profileUpdate).not.toHaveBeenCalled()
  })

  it('updates role in profiles table and auth metadata for valid admin', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mocks.profileUpdate.mockResolvedValue({ id: 'target-user', role: 'DEALER' })
    mocks.adminUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null })

    const result = await changeUserRole('target-user', 'DEALER')
    expect(result).toEqual({ success: true })
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { id: 'target-user' },
      data: { role: 'DEALER' },
    })
    expect(mocks.adminUpdateUserById).toHaveBeenCalledWith('target-user', {
      app_metadata: { role: 'DEALER' },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/users')
  })
})
