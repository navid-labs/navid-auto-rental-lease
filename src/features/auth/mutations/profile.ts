import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import type { UserProfile } from '@/lib/auth/helpers';
import { profileUpdateSchema } from '@/features/auth/schemas/auth';

export async function updateProfileMutation(formData: FormData, user: UserProfile) {
  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: '입력 정보를 확인해주세요.' };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
    },
  });

  revalidatePath('/mypage');
  return { success: true };
}
