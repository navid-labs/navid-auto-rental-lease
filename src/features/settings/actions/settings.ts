'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { promoRateSchema, defaultSettingSchema } from '../schemas/settings'
import type { PromoRateInput, DefaultSettingInput } from '../schemas/settings'

type ActionResult = { success: true } | { error: string }

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('권한이 없습니다.')
  }
  return user
}

// ─── Promo Rates ─────────────────────────────────────────

export async function getPromoRates() {
  return prisma.promoRate.findMany({
    include: { brand: { select: { id: true, name: true, nameKo: true } } },
    orderBy: { brand: { nameKo: 'asc' } },
  })
}

export async function upsertPromoRate(data: PromoRateInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = promoRateSchema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ')
    return { error: msg }
  }

  const { brandId, rate, label } = parsed.data

  await prisma.promoRate.upsert({
    where: { brandId },
    create: { brandId, rate, label },
    update: { rate, label },
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function deletePromoRate(id: string): Promise<ActionResult> {
  await requireAdmin()

  await prisma.promoRate.delete({ where: { id } })

  revalidatePath('/admin/settings')
  return { success: true }
}

// ─── Default Settings ────────────────────────────────────

export async function getDefaultSettings() {
  return prisma.defaultSetting.findMany({
    orderBy: { key: 'asc' },
  })
}

export async function upsertDefaultSetting(data: DefaultSettingInput): Promise<ActionResult> {
  await requireAdmin()

  const parsed = defaultSettingSchema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ')
    return { error: msg }
  }

  const { key, value, label } = parsed.data

  await prisma.defaultSetting.upsert({
    where: { key },
    create: { key, value, label },
    update: { value, label },
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function deleteDefaultSetting(id: string): Promise<ActionResult> {
  await requireAdmin()

  await prisma.defaultSetting.delete({ where: { id } })

  revalidatePath('/admin/settings')
  return { success: true }
}
