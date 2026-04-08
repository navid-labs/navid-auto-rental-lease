import { describe, expect, it } from "vitest";
import {
  calcTotalAcquisitionCost,
  calcRemainingPayments,
  calcTotalEffectiveCost,
  checkIsVerified,
} from "./calculations";

describe("calcTotalAcquisitionCost", () => {
  it("sums initialCost and transferFee", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 0, transferFee: 300000 })).toBe(300000);
  });
  it("handles zero values", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 0, transferFee: 0 })).toBe(0);
  });
  it("handles large values", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 5000000, transferFee: 300000 })).toBe(5300000);
  });
});

describe("calcRemainingPayments", () => {
  it("multiplies monthly payment by remaining months", () => {
    expect(calcRemainingPayments({ monthlyPayment: 580000, remainingMonths: 32 })).toBe(18560000);
  });
  it("handles 0 months", () => {
    expect(calcRemainingPayments({ monthlyPayment: 580000, remainingMonths: 0 })).toBe(0);
  });
});

describe("calcTotalEffectiveCost", () => {
  it("sums acquisition cost and remaining payments", () => {
    const result = calcTotalEffectiveCost({
      initialCost: 0, transferFee: 300000, monthlyPayment: 580000, remainingMonths: 32,
    });
    expect(result).toBe(18860000);
  });
});

describe("checkIsVerified", () => {
  const fullListing = {
    brand: "현대", model: "싼타페", year: 2023, trim: "프레스티지",
    mileage: 23456, color: "화이트", imageCount: 3,
  };
  it("returns true when all fields present", () => {
    expect(checkIsVerified(fullListing)).toBe(true);
  });
  it("returns false when brand is null", () => {
    expect(checkIsVerified({ ...fullListing, brand: null })).toBe(false);
  });
  it("returns false when no images", () => {
    expect(checkIsVerified({ ...fullListing, imageCount: 0 })).toBe(false);
  });
  it("returns false when mileage is null", () => {
    expect(checkIsVerified({ ...fullListing, mileage: null })).toBe(false);
  });
});
