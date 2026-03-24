import { prisma } from '@/lib/db/prisma';

export async function getPromoRatesQuery() {
  return prisma.promoRate.findMany({
    include: { brand: { select: { id: true, name: true, nameKo: true } } },
    orderBy: { brand: { nameKo: 'asc' } },
  });
}

export async function getDefaultSettingsQuery() {
  return prisma.defaultSetting.findMany({
    orderBy: { key: 'asc' },
  });
}
