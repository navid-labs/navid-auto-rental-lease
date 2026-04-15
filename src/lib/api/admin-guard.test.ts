import { describe, it, expect } from "vitest";
import { isValidUUID } from "./admin-guard";

describe("isValidUUID", () => {
  it("accepts valid v4 UUID (lowercase)", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts valid v4 UUID (uppercase)", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects v1 UUID (time-based)", () => {
    expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
  });

  it("rejects v7 UUID", () => {
    expect(isValidUUID("018f6f3c-80cb-7000-8000-000000000000")).toBe(false);
  });

  it("rejects short string", () => {
    expect(isValidUUID("550e8400")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects whitespace-padded UUID", () => {
    expect(isValidUUID(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(false);
  });

  it("rejects SQL injection attempt", () => {
    expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
  });
});
