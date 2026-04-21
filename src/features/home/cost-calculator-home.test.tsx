import { describe, it, expect } from "vitest";
import { estimateMonthlyPayment, estimateNewLeaseSavings } from "./cost-calculator-home";

describe("cost-calculator-home math", () => {
  it("estimateMonthlyPayment returns ~1.2% of vehicle price", () => {
    expect(estimateMonthlyPayment(50_000_000)).toBe(600_000);
    expect(estimateMonthlyPayment(30_000_000)).toBe(360_000);
  });

  it("estimateNewLeaseSavings returns ~40% gap", () => {
    const v = 50_000_000;
    const chayong = estimateMonthlyPayment(v);
    const savings = estimateNewLeaseSavings(v);
    expect(savings).toBeCloseTo(Math.round(chayong * 0.667), -3);
    expect(savings).toBeGreaterThan(0);
  });

  it("handles minimum and maximum vehicle prices", () => {
    expect(estimateMonthlyPayment(5_000_000)).toBe(60_000);
    expect(estimateMonthlyPayment(100_000_000)).toBe(1_200_000);
  });
});
