import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { listingInputSchema } from "@/lib/validation/listing";
import { buildListingPayload, SellWizard } from "./sell-wizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SellWizard", () => {
  it("starts at vehicle confirmation when initial vehicle is provided", () => {
    render(
      <SellWizard
        initialVehicle={{
          plate: "12가3456",
          brand: "현대",
          model: "아반떼",
          year: 2023,
          fuel: "HYBRID",
        }}
      />
    );

    expect(screen.getByText("차종을 확인해주세요")).toBeInTheDocument();
    expect(screen.queryByText("차량번호로 빠르게 조회")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("현대")).toBeInTheDocument();
    expect(screen.getByText(/조회된 연료: 하이브리드/)).toBeInTheDocument();
  });

  it("starts at manual vehicle entry when manualEntry is true", () => {
    render(<SellWizard manualEntry />);

    expect(screen.getByText(/조회되지 않아 직접 입력합니다/)).toBeInTheDocument();
    expect(screen.getByText("차종을 확인해주세요")).toBeInTheDocument();
  });

  it("builds schema-compatible payload for transfer submit", () => {
    const payload = buildListingPayload({
      plate: "12가3456",
      brand: "현대",
      model: "아반떼",
      year: 2023,
      fuel: "HYBRID",
      type: "TRANSFER",
      monthlyPayment: 450000,
      remainingMonths: 24,
      initialCost: 1000000,
      description: "",
      photos: [],
      trim: "",
      color: "",
      capitalCompany: "",
      options: [],
      imageUrls: [],
    });

    expect(payload).toMatchObject({
      brand: "현대",
      model: "아반떼",
      year: 2023,
      plateNumber: "12가3456",
      fuelType: "HYBRID",
      carryoverPremium: 1000000,
      transferFee: 0,
    });
    expect(listingInputSchema.safeParse(payload).success).toBe(true);
  });
});
