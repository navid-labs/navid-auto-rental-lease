'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'
import {
  residualValueRateSchema,
  type ResidualValueRateInput,
} from '../schemas/residual-value'

const DEFAULT_RESIDUAL_RATE = 0.4

type ActionResult = { success: true } | { error: string }

/**
 * 특정 브랜드/모델/연식의 잔가율 조회
 * DB에 없으면 기본값 40% 반환
 */
export async function getResidualRate(
  brandId: string,
  carModelId: string,
  year: number
): Promise<number> {
  const record = await prisma.residualValueRate.findUnique({
    where: {
      brandId_carModelId_year: { brandId, carModelId, year },
    },
  })

  return record ? record.rate.toNumber() : DEFAULT_RESIDUAL_RATE
}

/**
 * 잔가율 목록 조회 (관리자 테이블용)
 * brandId 필터 선택적
 */
export async function getResidualRates(brandId?: string) {
  const where = brandId ? { brandId } : {}

  const rates = await prisma.residualValueRate.findMany({
    where,
    include: {
      brand: { select: { name: true } },
      carModel: { select: { name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { carModel: { name: 'asc' } }, { year: 'desc' }],
  })

  return rates.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    brandName: r.brand.name,
    carModelId: r.carModelId,
    carModelName: r.carModel.name,
    year: r.year,
    rate: r.rate.toNumber(),
  }))
}

/**
 * 잔가율 생성/수정 (관리자 전용)
 */
export async function upsertResidualRate(
  data: ResidualValueRateInput
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '관리자 권한이 필요합니다.' }

  const parsed = residualValueRateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' }
  }

  const { brandId, carModelId, year, rate } = parsed.data

  await prisma.residualValueRate.upsert({
    where: {
      brandId_carModelId_year: { brandId, carModelId, year },
    },
    create: { brandId, carModelId, year, rate },
    update: { rate },
  })

  revalidatePath('/admin/residual-value')
  return { success: true }
}

/**
 * 잔가율 삭제 (관리자 전용)
 */
export async function deleteResidualRate(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '관리자 권한이 필요합니다.' }

  const record = await prisma.residualValueRate.findUnique({ where: { id } })
  if (!record) return { error: '잔가율을 찾을 수 없습니다.' }

  await prisma.residualValueRate.delete({ where: { id } })

  revalidatePath('/admin/residual-value')
  return { success: true }
}
