import { describe, expect, it } from "vitest"
import { maskPlateNumber, sanitizeListingForPublic } from "./sanitize"

describe("maskPlateNumber", () => {
  it("masks last 4 digits of a typical plate", () => {
    expect(maskPlateNumber("12가3456")).toBe("12가****")
  })

  it("masks 3-digit prefix plates", () => {
    expect(maskPlateNumber("123가4567")).toBe("123가****")
  })

  it("returns null for null input", () => {
    expect(maskPlateNumber(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(maskPlateNumber(undefined)).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(maskPlateNumber("")).toBeNull()
  })

  it("leaves the value unchanged when it lacks 4 trailing digits", () => {
    expect(maskPlateNumber("임시-ABC")).toBe("임시-ABC")
  })
})

describe("sanitizeListingForPublic", () => {
  const baseListing = {
    id: "l1",
    sellerId: "seller1",
    plateNumber: "12가3456",
    vin: "KMHL14JA5MA123456",
    monthlyPayment: 450000,
  } as const

  it("masks plate and nullifies VIN for anonymous viewer", () => {
    const sanitized = sanitizeListingForPublic(baseListing)
    expect(sanitized.plateNumber).toBe("12가****")
    expect(sanitized.vin).toBeNull()
  })

  it("masks plate and nullifies VIN for other users", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "other", isAdmin: false })
    expect(sanitized.plateNumber).toBe("12가****")
    expect(sanitized.vin).toBeNull()
  })

  it("returns original values for the owner", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "seller1", isAdmin: false })
    expect(sanitized.plateNumber).toBe("12가3456")
    expect(sanitized.vin).toBe("KMHL14JA5MA123456")
  })

  it("returns original values for admin", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "admin", isAdmin: true })
    expect(sanitized.plateNumber).toBe("12가3456")
    expect(sanitized.vin).toBe("KMHL14JA5MA123456")
  })

  it("preserves other fields untouched", () => {
    const sanitized = sanitizeListingForPublic(baseListing)
    expect(sanitized.id).toBe("l1")
    expect(sanitized.monthlyPayment).toBe(450000)
  })
})
