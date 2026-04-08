type AcquisitionInput = { initialCost: number; transferFee: number };
type RemainingInput = { monthlyPayment: number; remainingMonths: number };
type EffectiveCostInput = AcquisitionInput & RemainingInput;
type VerificationInput = {
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  mileage: number | null;
  color: string | null;
  imageCount: number;
};

export function calcTotalAcquisitionCost(input: AcquisitionInput): number {
  return input.initialCost + input.transferFee;
}

export function calcRemainingPayments(input: RemainingInput): number {
  return input.monthlyPayment * input.remainingMonths;
}

export function calcTotalEffectiveCost(input: EffectiveCostInput): number {
  return calcTotalAcquisitionCost(input) + calcRemainingPayments(input);
}

export function checkIsVerified(input: VerificationInput): boolean {
  return (
    input.brand !== null &&
    input.model !== null &&
    input.year !== null &&
    input.trim !== null &&
    input.mileage !== null &&
    input.color !== null &&
    input.imageCount >= 1
  );
}
