import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import type { UserProfile } from '@/lib/auth/helpers';
import {
  residualValueRateSchema,
  type ResidualValueRateInput,
} from '../schemas/residual-value';

type ActionResult = { success: true } | { error: string };

/**
 * 잔가율 생성/수정 (관리자 전용)
 */
export async function upsertResidualRateMutation(
  data: ResidualValueRateInput,
  user: UserProfile
): Promise<ActionResult> {
  if (user.role !== 'ADMIN') return { error: '관리자 권한이 필요합니다.' };

  const parsed = residualValueRateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  const { brandId, carModelId, year, rate } = parsed.data;

  await prisma.residualValueRate.upsert({
    where: {
      brandId_carModelId_year: { brandId, carModelId, year },
    },
    create: { brandId, carModelId, year, rate },
    update: { rate },
  });

  revalidatePath('/admin/residual-value');
  return { success: true };
}

/**
 * 잔가율 삭제 (관리자 전용)
 */
export async function deleteResidualRateMutation(
  id: string,
  user: UserProfile
): Promise<ActionResult> {
  if (user.role !== 'ADMIN') return { error: '관리자 권한이 필요합니다.' };

  const record = await prisma.residualValueRate.findUnique({ where: { id } });
  if (!record) return { error: '잔가율을 찾을 수 없습니다.' };

  await prisma.residualValueRate.delete({ where: { id } });

  revalidatePath('/admin/residual-value');
  return { success: true };
}
