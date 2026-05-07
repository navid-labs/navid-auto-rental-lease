import { describe, it, expect } from "vitest";
import { sanitizeNextPath } from "./redirect";

describe("sanitizeNextPath", () => {
  it("returns the path when it is a same-origin internal path", () => {
    expect(sanitizeNextPath("/listings/abc")).toBe("/listings/abc");
    expect(sanitizeNextPath("/my")).toBe("/my");
  });

  it("falls back to '/' when missing or invalid", () => {
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("")).toBe("/");
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/");
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("http://chayong.kr/x")).toBe("/");
  });

  it("rejects protocol-relative or non-slash starts", () => {
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/");
    expect(sanitizeNextPath("about")).toBe("/");
  });
});
