import { describe, it, expect } from "vitest";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "./pagination";

describe("parsePagination", () => {
  const parse = (qs: string) => parsePagination(new URLSearchParams(qs));

  it("returns defaults on empty params", () => {
    expect(parse("")).toEqual({ page: 1, size: 20 });
  });

  it("parses valid page and size", () => {
    expect(parse("page=2&size=30")).toEqual({ page: 2, size: 30 });
  });

  it("clamps page < 1 to 1", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=-5").page).toBe(1);
  });

  it("falls back on non-int page (1.5)", () => {
    expect(parse("page=1.5").page).toBe(1);
  });

  it("falls back on non-numeric page", () => {
    expect(parse("page=abc").page).toBe(1);
  });

  it("falls back on empty string page", () => {
    expect(parse("page=").page).toBe(1);
  });

  it("falls back on Infinity", () => {
    expect(parse("page=Infinity").page).toBe(1);
  });

  it("falls back size<1 to 20", () => {
    expect(parse("size=0").size).toBe(20);
  });

  it("allows size=50 (boundary)", () => {
    expect(parse("size=50").size).toBe(50);
  });

  it("falls back size>50 to 20", () => {
    expect(parse("size=51").size).toBe(20);
  });

  it("returns first value on duplicate keys", () => {
    expect(parse("page=1&page=2").page).toBe(1);
  });
});

describe("paginationMeta", () => {
  it("totalPages=1 when total=0", () => {
    expect(paginationMeta(1, 20, 0)).toEqual({
      page: 1,
      size: 20,
      total: 0,
      totalPages: 1,
    });
  });

  it("totalPages=1 when total=20, size=20", () => {
    expect(paginationMeta(1, 20, 20).totalPages).toBe(1);
  });

  it("totalPages=2 when total=21, size=20", () => {
    expect(paginationMeta(1, 20, 21).totalPages).toBe(2);
  });
});

describe("toURLSearchParams", () => {
  it("removes undefined values", () => {
    const result = toURLSearchParams({ a: "1", b: undefined });
    expect(result.toString()).toBe("a=1");
  });

  it("removes empty strings", () => {
    const result = toURLSearchParams({ a: "1", b: "" });
    expect(result.toString()).toBe("a=1");
  });

  it("preserves all valid values", () => {
    const result = toURLSearchParams({ a: "1", b: "2" });
    expect(result.toString()).toBe("a=1&b=2");
  });
});
