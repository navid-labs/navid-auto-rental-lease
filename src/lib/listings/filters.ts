// src/lib/listings/filters.ts
export type ListingTypeFilter = "TRANSFER" | "USED_LEASE" | "USED_RENTAL";
export type ListingSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";
export type FuelFilter = "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
export type TransFilter = "AUTO" | "MANUAL";

/**
 * CROSS-WORKTREE SHARED CONTRACT.
 * Changes must go through docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md owner.
 */
export interface ListingFilters {
  type?: ListingTypeFilter;
  minPayment?: number;
  maxPayment?: number;
  brand?: string;
  sort: ListingSort;
  page: number;
  q?: string;
  remainingMin?: number;
  initialCostMax?: number;
  yearMin?: number;
  fuel?: FuelFilter;
  trans?: TransFilter;
  accidentMax?: number;
}

const TYPES: ListingTypeFilter[] = ["TRANSFER", "USED_LEASE", "USED_RENTAL"];
const SORTS: ListingSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "mileage_asc",
];
const FUELS: FuelFilter[] = ["GASOLINE", "DIESEL", "HYBRID", "EV"];
const TRANSMISSIONS: TransFilter[] = ["AUTO", "MANUAL"];

type RawInput = Record<string, string | undefined> | URLSearchParams;

function get(raw: RawInput, key: string): string | undefined {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  return raw[key];
}

function asPositiveInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseListingFilters(raw: RawInput): ListingFilters {
  const type = get(raw, "type");
  const sort = get(raw, "sort");
  const fuel = get(raw, "fuel");
  const trans = get(raw, "trans");

  return {
    type: TYPES.includes(type as ListingTypeFilter)
      ? (type as ListingTypeFilter)
      : undefined,
    minPayment: asPositiveInt(get(raw, "minPayment") ?? get(raw, "monthlyMin")),
    maxPayment: asPositiveInt(get(raw, "maxPayment") ?? get(raw, "monthlyMax")),
    brand: get(raw, "brand") || undefined,
    sort: SORTS.includes(sort as ListingSort) ? (sort as ListingSort) : "newest",
    page: asPositiveInt(get(raw, "page")) ?? 1,
    q: get(raw, "q") || undefined,
    remainingMin: asPositiveInt(get(raw, "remainingMin")),
    initialCostMax: asPositiveInt(get(raw, "initialCostMax")),
    yearMin: asPositiveInt(get(raw, "yearMin")),
    fuel: FUELS.includes(fuel as FuelFilter) ? (fuel as FuelFilter) : undefined,
    trans: TRANSMISSIONS.includes(trans as TransFilter)
      ? (trans as TransFilter)
      : undefined,
    accidentMax: asPositiveInt(get(raw, "accidentMax")),
  };
}

export function buildListingUrl(filters: Partial<ListingFilters>): string {
  const params = new URLSearchParams();
  const push = (k: string, v: string | number | undefined | null) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  };
  push("type", filters.type);
  push("minPayment", filters.minPayment);
  push("maxPayment", filters.maxPayment);
  push("brand", filters.brand);
  if (filters.sort && filters.sort !== "newest") push("sort", filters.sort);
  if (filters.page && filters.page > 1) push("page", filters.page);
  push("q", filters.q);
  push("remainingMin", filters.remainingMin);
  push("initialCostMax", filters.initialCostMax);
  push("yearMin", filters.yearMin);
  push("fuel", filters.fuel);
  push("trans", filters.trans);
  push("accidentMax", filters.accidentMax);
  const qs = params.toString();
  return qs ? `/list?${qs}` : "/list";
}
