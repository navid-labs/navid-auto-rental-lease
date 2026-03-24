import { prisma } from '@/lib/db/prisma';

const DEFAULT_RESIDUAL_RATE = 0.4;

/**
 * 특정 브랜드/모델/연식의 잔가율 조회
 * DB에 없으면 기본값 40% 반환
 */
export async function getResidualRateQuery(
  brandId: string,
  carModelId: string,
  year: number
): Promise<number> {
  const record = await prisma.residualValueRate.findUnique({
    where: {
      brandId_carModelId_year: { brandId, carModelId, year },
    },
  });

  return record ? record.rate.toNumber() : DEFAULT_RESIDUAL_RATE;
}

/**
 * 잔가율 목록 조회 (관리자 테이블용)
 * brandId 필터 선택적
 */
export async function getResidualRatesQuery(brandId?: string) {
  const where = brandId ? { brandId } : {};

  const rates = await prisma.residualValueRate.findMany({
    where,
    include: {
      brand: { select: { name: true } },
      carModel: { select: { name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { carModel: { name: 'asc' } }, { year: 'desc' }],
  });

  return rates.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    brandName: r.brand.name,
    carModelId: r.carModelId,
    carModelName: r.carModel.name,
    year: r.year,
    rate: r.rate.toNumber(),
  }));
}
