import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import type { UserProfile } from '@/lib/auth/helpers';
import { promoRateSchema, defaultSettingSchema } from '../schemas/settings';
import type { PromoRateInput, DefaultSettingInput } from '../schemas/settings';

type ActionResult = { success: true } | { error: string };

function requireAdmin(user: UserProfile): void {
  if (user.role !== 'ADMIN') {
    throw new Error('권한이 없습니다.');
  }
}

// ─── Promo Rates ─────────────────────────────────────────

export async function upsertPromoRateMutation(
  data: PromoRateInput,
  user: UserProfile
): Promise<ActionResult> {
  requireAdmin(user);

  const parsed = promoRateSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return { error: msg };
  }

  const { brandId, rate, label } = parsed.data;

  await prisma.promoRate.upsert({
    where: { brandId },
    create: { brandId, rate, label },
    update: { rate, label },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function deletePromoRateMutation(
  id: string,
  user: UserProfile
): Promise<ActionResult> {
  requireAdmin(user);

  await prisma.promoRate.delete({ where: { id } });

  revalidatePath('/admin/settings');
  return { success: true };
}

// ─── Default Settings ────────────────────────────────────

export async function upsertDefaultSettingMutation(
  data: DefaultSettingInput,
  user: UserProfile
): Promise<ActionResult> {
  requireAdmin(user);

  const parsed = defaultSettingSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return { error: msg };
  }

  const { key, value, label } = parsed.data;

  await prisma.defaultSetting.upsert({
    where: { key },
    create: { key, value, label },
    update: { value, label },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function deleteDefaultSettingMutation(
  id: string,
  user: UserProfile
): Promise<ActionResult> {
  requireAdmin(user);

  await prisma.defaultSetting.delete({ where: { id } });

  revalidatePath('/admin/settings');
  return { success: true };
}
