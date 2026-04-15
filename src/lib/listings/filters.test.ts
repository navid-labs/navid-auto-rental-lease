// src/lib/listings/filters.test.ts
import { describe, expect, it } from "vitest";
import { parseListingFilters, buildListingUrl } from "./filters";

describe("parseListingFilters", () => {
  it("parses existing keys", () => {
    const f = parseListingFilters({
      type: "TRANSFER",
      minPayment: "30",
      maxPayment: "50",
      brand: "BMW",
      sort: "price_asc",
      page: "2",
      q: "X3",
      remainingMin: "6",
      initialCostMax: "500",
      yearMin: "2020",
    });
    expect(f.type).toBe("TRANSFER");
    expect(f.minPayment).toBe(30);
    expect(f.maxPayment).toBe(50);
    expect(f.brand).toBe("BMW");
    expect(f.sort).toBe("price_asc");
    expect(f.page).toBe(2);
    expect(f.q).toBe("X3");
    expect(f.remainingMin).toBe(6);
    expect(f.initialCostMax).toBe(500);
    expect(f.yearMin).toBe(2020);
  });

  it("supports monthlyMin/monthlyMax aliases", () => {
    const f = parseListingFilters({ monthlyMin: "10", monthlyMax: "40" });
    expect(f.minPayment).toBe(10);
    expect(f.maxPayment).toBe(40);
  });

  it("accepts new keys: fuel, trans, accidentMax, sort extensions", () => {
    const f = parseListingFilters({
      fuel: "DIESEL",
      trans: "AUTO",
      accidentMax: "1",
      sort: "year_desc",
    });
    expect(f.fuel).toBe("DIESEL");
    expect(f.trans).toBe("AUTO");
    expect(f.accidentMax).toBe(1);
    expect(f.sort).toBe("year_desc");
  });

  it("rejects invalid type and sort", () => {
    const f = parseListingFilters({ type: "BOGUS", sort: "hacked" });
    expect(f.type).toBeUndefined();
    expect(f.sort).toBe("newest");
  });

  it("defaults page to 1", () => {
    expect(parseListingFilters({}).page).toBe(1);
  });
});

describe("buildListingUrl", () => {
  it("builds /list with params", () => {
    const url = buildListingUrl({ type: "TRANSFER", minPayment: 30, maxPayment: 50 });
    expect(url).toBe("/list?type=TRANSFER&minPayment=30&maxPayment=50");
  });

  it("omits empty values", () => {
    const url = buildListingUrl({ type: "TRANSFER", brand: "" });
    expect(url).toBe("/list?type=TRANSFER");
  });

  it("returns /list when no filters", () => {
    expect(buildListingUrl({})).toBe("/list");
  });
});
