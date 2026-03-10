'use server'

import { prisma } from '@/lib/db/prisma'

const DEFAULT_PASSWORD = 'admin1234'

export async function verifySettingsPassword(
  password: string
): Promise<{ success: true } | { error: string }> {
  if (!password) {
    return { error: '비밀번호를 입력해주세요.' }
  }

  // Check if custom password exists in DefaultSetting
  const record = await prisma.defaultSetting.findUnique({
    where: { key: 'settings_password' },
  })

  const correctPassword = record?.value ?? DEFAULT_PASSWORD

  if (password !== correctPassword) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  return { success: true }
}
