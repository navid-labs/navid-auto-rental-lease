import { describe, expect, it } from "vitest"
import {
  listingInputSchema,
  transferListingSchema,
  leaseListingSchema,
  rentalListingSchema,
} from "./listing"

describe("listingInputSchema", () => {
  const baseValid = {
    brand: "현대",
    model: "아반떼",
    year: 2022,
    mileage: 30000,
    monthlyPayment: 450000,
    remainingMonths: 24,
    options: ["navigation", "sunroof"],
    accidentCount: 0,
  }

  describe("TRANSFER", () => {
    it("passes with required transfer fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        carryoverPremium: 2000000,
        transferFee: 100000,
      })
      expect(result.success).toBe(true)
    })

    it("fails without carryoverPremium", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        transferFee: 100000,
      })
      expect(result.success).toBe(false)
    })

    it("fails with negative carryoverPremium", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        carryoverPremium: -100,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("USED_LEASE", () => {
    it("passes with required lease fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        deposit: 5000000,
        terminationFee: 1000000,
        mileageLimit: 20000,
      })
      expect(result.success).toBe(true)
    })

    it("allows null mileageLimit", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        deposit: 5000000,
        terminationFee: 1000000,
        mileageLimit: null,
      })
      expect(result.success).toBe(true)
    })

    it("fails without deposit", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        terminationFee: 1000000,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("USED_RENTAL", () => {
    it("passes with required rental fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_RENTAL",
        deposit: 3000000,
        terminationFee: 500000,
        mileageLimit: 30000,
      })
      expect(result.success).toBe(true)
    })
  })

  describe("base validation", () => {
    it("rejects year before 1990", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        year: 1989,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects accidentCount > 99", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        accidentCount: 100,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative monthlyPayment", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        monthlyPayment: -1,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })
  })
})
