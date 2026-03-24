import { calculateQuote, estimateMonthlyRental } from '@/lib/finance';
import type { QuoteInput } from '@/lib/finance';
import { quoteParamsSchema } from '../schemas/quote-schema';
import type {
  InventoryVehicleForQuote,
  QuoteParams,
  QuoteGenerationResult,
  VehicleQuoteResult,
} from '../types/quote';

export async function generateQuoteMutation(
  vehicles: InventoryVehicleForQuote[],
  params: QuoteParams
): Promise<QuoteGenerationResult> {
  const parsed = quoteParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(
      `견적 파라미터 오류: ${parsed.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  const validParams = parsed.data;

  const results: VehicleQuoteResult[] = vehicles.map((vehicle) => {
    // 실질 가격 = 차량가 - 보조금 - (차량가 * 프로모션율)
    const effectivePrice =
      vehicle.vehiclePrice -
      (vehicle.subsidyAmount ?? 0) -
      vehicle.vehiclePrice * (vehicle.promotionRate ?? 0);

    // 리스 견적
    const quoteInput: QuoteInput = {
      vehiclePrice: effectivePrice,
      vehicleCategory: vehicle.vehicleCategory,
      fuelType: vehicle.fuelType,
      isImport: vehicle.isImport,
      brand: vehicle.brand,
      leasePeriodMonths: validParams.leasePeriodMonths,
      residualMethod: validParams.residualMethod,
      residualRate: validParams.residualRate,
      depositRate: validParams.depositRate,
      advancePayment: validParams.advancePayment,
      creditGroup: validParams.creditGroup,
    };

    const leaseResult = calculateQuote(quoteInput);

    // 렌탈 추정 (단순 균등 분할)
    const monthlyRental = estimateMonthlyRental(
      effectivePrice,
      validParams.leasePeriodMonths
    );

    return {
      vehicle,
      leaseResult,
      rentalEstimate: {
        monthlyPayment: monthlyRental,
        totalPayment: monthlyRental * validParams.leasePeriodMonths,
      },
      effectivePrice,
    };
  });

  return {
    params: validParams,
    vehicles: results,
    generatedAt: new Date(),
  };
}
