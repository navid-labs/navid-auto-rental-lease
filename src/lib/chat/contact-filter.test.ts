import { describe, expect, it } from "vitest";
import { containsContactInfo, sanitizeMessage } from "./contact-filter";

describe("containsContactInfo", () => {
  it("detects phone with dashes", () => { expect(containsContactInfo("연락처 010-1234-5678 입니다")).toBe(true); });
  it("detects phone without dashes", () => { expect(containsContactInfo("01012345678로 연락주세요")).toBe(true); });
  it("detects phone with spaces", () => { expect(containsContactInfo("010 1234 5678")).toBe(true); });
  it("detects landline", () => { expect(containsContactInfo("02-1234-5678")).toBe(true); });
  it("detects email", () => { expect(containsContactInfo("이메일은 user@example.com 입니다")).toBe(true); });
  it("allows normal messages", () => { expect(containsContactInfo("안녕하세요, 매물 문의합니다")).toBe(false); });
  it("allows price numbers", () => { expect(containsContactInfo("월 580,000원이에요")).toBe(false); });
  it("allows short numbers", () => { expect(containsContactInfo("32개월 남았어요")).toBe(false); });
});

describe("sanitizeMessage", () => {
  it("returns blocked false for clean messages", () => { expect(sanitizeMessage("안녕하세요").blocked).toBe(false); });
  it("blocks phone numbers", () => {
    const r = sanitizeMessage("010-1234-5678로 연락주세요");
    expect(r.blocked).toBe(true);
    if (r.blocked) expect(r.reason).toBe("외부 연락처 공유가 제한됩니다.");
  });
  it("blocks emails", () => { expect(sanitizeMessage("mail@test.com으로 보내주세요").blocked).toBe(true); });
});
