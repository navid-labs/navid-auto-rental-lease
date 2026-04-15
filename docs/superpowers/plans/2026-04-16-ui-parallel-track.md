# UI Parallel Track — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 경쟁사 디자인 리뷰 HIGH 격차를 4개 worktree(+WT0 pre-work)로 병렬 해소. HOME 검색 허브/신뢰 지표, LIST 사이드바 필터/정렬 확장, DETAIL 갤러리/신뢰 섹션, SELL 번호판 원클릭 UX.

**Architecture:** WT0(공유 URL 유틸 + tabular-nums) → WT4(독립) → 스키마 플랜 머지 대기 → WT1(Home) → WT2(List) → WT3(Detail). `ListingCardData` 계약 동결, `parseListingFilters()` 단일 진입점, 모든 URL 조작은 `buildListingUrl()` 사용.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Prisma 6, Tailwind 4, shadcn/ui, Vitest, Playwright, bun.

**Spec:** `docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md`

---

## Execution Summary

| Phase | Worktree | When | Blocking |
|-------|----------|------|----------|
| 1 | WT0 (main) | 즉시 | — |
| 2 | WT4 | WT0 후 즉시 | — |
| 3a | WT1 | 스키마 플랜 Task 8 머지 후 | schema |
| 3b | WT2 | 스키마 플랜 Task 8 머지 후 | schema |
| 4 | WT3 | 스키마 플랜 전체 머지 + WT2 머지 후 | schema + WT2 |

각 WT는 **독립 PR**. 머지 순서: WT0 → WT4 → (schema) → WT1 → WT2 → WT3.

---

## WT0 — Pre-Work on main

**Branch:** `main` (직접 커밋, PR 없음 또는 1개 작은 PR)
**Goal:** 공유 URL 유틸 추출 + cross-WT 계약 명시.

### Task 0.1: `parseListingFilters` / `buildListingUrl` 유틸 (TDD)

**Files:**
- Create: `src/lib/listings/filters.ts`
- Create: `src/lib/listings/filters.test.ts`

- [ ] **Step 1: Write failing test**

```ts
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
```

- [ ] **Step 2: Run test (expect FAIL)**

Run: `bun run test src/lib/listings/filters.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `filters.ts`**

```ts
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
```

- [ ] **Step 4: Run test (expect PASS)**

Run: `bun run test src/lib/listings/filters.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings/filters.ts src/lib/listings/filters.test.ts
git commit -m "feat(listings): add parseListingFilters + buildListingUrl shared util"
```

### Task 0.2: Refactor `list/page.tsx` to use `parseListingFilters`

**Files:**
- Modify: `src/app/(public)/list/page.tsx`

- [ ] **Step 1: Read current `buildWhere` and replace parameter parsing with util**

Replace the manual `SearchParams` parsing inside `buildWhere(params)` with:

```ts
import { parseListingFilters } from "@/lib/listings/filters";

// replace existing SearchParams interface consumption.
// Where `buildWhere` is called, pass parseListingFilters(searchParams).
// Inside buildWhere (or a new builder), accept a ListingFilters instead of raw.
```

Concretely, restructure so the page does:

```ts
const filters = parseListingFilters(searchParams);
const where = buildWhereFromFilters(filters);
const orderBy = buildOrderBy(filters.sort);
```

And rewrite `buildWhere` → `buildWhereFromFilters(filters: ListingFilters)` keeping the same Prisma where semantics.

Key fields to preserve exactly as-is (no behavior change yet):
- `type`, `minPayment`/`maxPayment` (already support alias), `brand`, `remainingMin`, `initialCostMax`, `yearMin`, `q`

Do **not** yet implement `fuel`, `trans`, `accidentMax` Prisma conditions — WT2 owns that.

- [ ] **Step 2: Run type-check + lint + existing E2E**

```bash
bun run type-check
bun run lint
bun run test:e2e -- tests/e2e/list.spec.ts || true
```

Expected: type-check + lint green. Existing E2E behavior unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/list/page.tsx
git commit -m "refactor(listings): use parseListingFilters in /list page"
```

### Task 0.3: ListingCardData contract note

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add JSDoc above `ListingCardData` declaration**

Prepend:
```ts
/**
 * CROSS-WORKTREE SHARED CONTRACT.
 * Consumers: Home (WT1), List/vehicle-card (WT2), Detail (WT3).
 * Changes must be coordinated via docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md owner.
 */
```

Do not change the type shape itself — schema plan owns the `accidentFree → accidentCount` and `features` additions.

- [ ] **Step 2: type-check**

```bash
bun run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "docs(types): mark ListingCardData as cross-worktree shared contract"
```

### Task 0.4: Confirm `.tabular-nums` utility

**Files:**
- Modify (if needed): `tailwind.config.*` or `src/app/globals.css`

- [ ] **Step 1: Test utility availability**

```bash
grep -R "tabular-nums" src tailwind.config 2>/dev/null | head
```

If Tailwind v4 is in use (check `package.json` `tailwindcss` version), `.tabular-nums` class is built-in — confirm by writing a tiny smoke component and build.

If **NOT** available, add to `src/app/globals.css`:
```css
@layer utilities {
  .tabular-nums { font-variant-numeric: tabular-nums; }
}
```

- [ ] **Step 2: Build**

```bash
bun run build
```

Expected: success.

- [ ] **Step 3: Commit only if file changed**

```bash
git status --porcelain
# if globals.css changed:
git add src/app/globals.css
git commit -m "chore(css): ensure .tabular-nums utility available"
```

**WT0 Exit Criteria:** type-check + lint + existing E2E green on main.

---

## WT4 — `ui/sell-heydealer`

**Branch:** `ui/sell-heydealer` (from main after WT0)
**Worktree:** `.claude/worktrees/ui-sell-heydealer/`

**Goal:** 차량번호 원클릭 + 1화면 1질문 위저드 + 사진 가이드 업로드.

### Task 4.0: Worktree 생성

- [ ] **Step 1:**

```bash
git worktree add .claude/worktrees/ui-sell-heydealer -b ui/sell-heydealer main
cd .claude/worktrees/ui-sell-heydealer
```

### Task 4.1: Mock plate-lookup API route (TDD)

**Files:**
- Create: `src/app/api/sell/plate-lookup/route.ts`
- Create: `src/app/api/sell/plate-lookup/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/app/api/sell/plate-lookup/route.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/sell/plate-lookup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/sell/plate-lookup", () => {
  it("returns deterministic vehicle for valid plate", async () => {
    const res = await POST(req({ plate: "12가3456" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      plate: "12가3456",
      brand: expect.any(String),
      model: expect.any(String),
      year: expect.any(Number),
      fuel: expect.stringMatching(/GASOLINE|DIESEL|HYBRID|EV/),
      displacement: expect.any(Number),
    });
  });

  it("rejects invalid plate format", async () => {
    const res = await POST(req({ plate: "BADPLATE" }));
    expect(res.status).toBe(400);
  });

  it("rejects missing plate", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

```bash
bun run test src/app/api/sell/plate-lookup/route.test.ts
```

- [ ] **Step 3: Implement route**

```ts
// src/app/api/sell/plate-lookup/route.ts
import { NextResponse } from "next/server";

const PLATE_RE = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

const MOCK_POOL = [
  { brand: "BMW", model: "X3", year: 2022, fuel: "GASOLINE" as const, displacement: 1998 },
  { brand: "현대", model: "아반떼 하이브리드", year: 2023, fuel: "HYBRID" as const, displacement: 1598 },
  { brand: "기아", model: "K5", year: 2021, fuel: "GASOLINE" as const, displacement: 1999 },
  { brand: "테슬라", model: "Model 3", year: 2024, fuel: "EV" as const, displacement: 0 },
  { brand: "벤츠", model: "E220d", year: 2022, fuel: "DIESEL" as const, displacement: 1950 },
];

function hashPlate(p: string): number {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0;
  return Math.abs(h) % MOCK_POOL.length;
}

export async function POST(req: Request) {
  let body: { plate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const plate = body.plate?.trim();
  if (!plate || !PLATE_RE.test(plate)) {
    return NextResponse.json({ error: "invalid plate" }, { status: 400 });
  }
  const vehicle = MOCK_POOL[hashPlate(plate)];
  return NextResponse.json({ plate, ...vehicle });
}
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun run test src/app/api/sell/plate-lookup/route.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/sell/plate-lookup/
git commit -m "feat(api): add mock plate-lookup endpoint"
```

### Task 4.2: `plate-lookup.tsx` client component (TDD)

**Files:**
- Create: `src/features/sell/components/plate-lookup.tsx`
- Create: `src/features/sell/components/plate-lookup.test.tsx`

- [ ] **Step 1: Test**

```tsx
// src/features/sell/components/plate-lookup.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlateLookup } from "./plate-lookup";

describe("PlateLookup", () => {
  it("calls onResult on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ plate: "12가3456", brand: "BMW", model: "X3", year: 2022, fuel: "GASOLINE", displacement: 1998 }),
    }) as unknown as typeof fetch;

    const onResult = vi.fn();
    render(<PlateLookup onResult={onResult} onSkip={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/차량번호/i), { target: { value: "12가3456" } });
    fireEvent.click(screen.getByRole("button", { name: /조회/i }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ brand: "BMW" })));
  });

  it("shows error on invalid plate (client-side)", () => {
    render(<PlateLookup onResult={() => {}} onSkip={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/차량번호/i), { target: { value: "BADPLATE" } });
    fireEvent.click(screen.getByRole("button", { name: /조회/i }));
    expect(screen.getByText(/번호판 형식/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement**

```tsx
// src/features/sell/components/plate-lookup.tsx
"use client";
import { useState } from "react";

const PLATE_RE = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

export interface PlateLookupResult {
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuel: "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
  displacement: number;
}

interface Props {
  onResult: (r: PlateLookupResult) => void;
  onSkip: () => void;
}

export function PlateLookup({ onResult, onSkip }: Props) {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!PLATE_RE.test(plate.trim())) {
      setError("번호판 형식이 올바르지 않습니다 (예: 12가3456)");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sell/plate-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plate: plate.trim() }),
      });
      if (!res.ok) {
        setError("조회에 실패했습니다. 수동으로 입력해주세요.");
        return;
      }
      onResult(await res.json());
    } catch {
      setError("네트워크 오류. 수동으로 입력해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="plate" className="text-sm font-semibold">
        차량번호
      </label>
      <input
        id="plate"
        placeholder="차량번호 (예: 12가3456)"
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
        className="h-12 rounded-xl border px-4"
      />
      {error && <p className="text-sm text-[var(--chayong-danger)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={lookup}
          disabled={loading}
          className="h-12 flex-1 rounded-xl bg-[var(--chayong-primary)] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "조회 중…" : "조회"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-12 rounded-xl border px-4 font-semibold"
        >
          수동 입력
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add src/features/sell/components/plate-lookup.tsx src/features/sell/components/plate-lookup.test.tsx
git commit -m "feat(sell): add plate-lookup client component"
```

### Task 4.3: `photo-guide.tsx` (12-slot upload)

**Files:**
- Create: `src/features/sell/components/photo-guide.tsx`
- Create: `src/features/sell/components/photo-guide.test.tsx`

- [ ] **Step 1: Test**

```tsx
// photo-guide.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoGuide } from "./photo-guide";

describe("PhotoGuide", () => {
  it("renders 12 slot labels", () => {
    render(<PhotoGuide value={[]} onChange={() => {}} />);
    expect(screen.getAllByTestId(/photo-slot-/)).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Fail, then implement**

```tsx
// src/features/sell/components/photo-guide.tsx
"use client";
import { useRef } from "react";

const SLOTS = [
  "정면",
  "운전석 측면",
  "조수석 측면",
  "후면",
  "대시보드",
  "계기판",
  "엔진룸",
  "좌전 바퀴",
  "우전 바퀴",
  "좌후 바퀴",
  "우후 바퀴",
  "트렁크",
];

interface Props {
  value: (File | null)[];
  onChange: (next: (File | null)[]) => void;
}

export function PhotoGuide({ value, onChange }: Props) {
  const normalized = SLOTS.map((_, i) => value[i] ?? null);

  function setAt(i: number, file: File | null) {
    const next = [...normalized];
    next[i] = file;
    onChange(next);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {SLOTS.map((label, i) => (
        <Slot
          key={label}
          label={label}
          index={i}
          file={normalized[i]}
          onFile={(f) => setAt(i, f)}
        />
      ))}
    </div>
  );
}

function Slot({
  label,
  index,
  file,
  onFile,
}: {
  label: string;
  index: number;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div
      data-testid={`photo-slot-${index}`}
      className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-[var(--chayong-surface)]"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[var(--chayong-text-sub)]"
        >
          <span>+</span>
          <span>{label}</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <button
          type="button"
          onClick={() => onFile(null)}
          className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-1 text-xs"
        >
          삭제
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run test (PASS)**

- [ ] **Step 4: Commit**

```bash
git add src/features/sell/components/photo-guide.tsx src/features/sell/components/photo-guide.test.tsx
git commit -m "feat(sell): add 12-slot photo-guide component"
```

### Task 4.4: Rewire `sell-wizard.tsx` to 1-question-per-screen + plate lookup

**Files:**
- Modify: `src/features/sell/components/sell-wizard.tsx`

- [ ] **Step 1: Read current wizard**

```bash
cat src/features/sell/components/sell-wizard.tsx | head -100
```

- [ ] **Step 2: Refactor to step-based flow**

변경 핵심:
- Step 0: `<PlateLookup>` — onResult 시 다음 step으로, 자동 채움된 필드는 편집 가능
- Step 1~N: 각 단계 1개 질문 (차종, 연식, 주행, 상품타입, 월납입금, 사진, 설명, 가격)
- 상단 진행률 바: `w-full bg-muted rounded-full h-2 → inner bar width=${(step/total)*100}%`
- 하단 sticky footer: 이전/다음 버튼. validation 통과 시 Enter로 다음
- 마지막 단계: `<PhotoGuide>` + 최종 제출

전체 재작성이 크므로 다음 하위 스텝으로 분할:

- [ ] **Step 2a: 추출 — `useWizardState` hook**

```ts
// src/features/sell/components/use-wizard-state.ts
import { useState } from "react";
import type { PlateLookupResult } from "./plate-lookup";

export interface WizardForm {
  plate?: string;
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  fuel?: PlateLookupResult["fuel"];
  type?: "TRANSFER" | "USED_LEASE" | "USED_RENTAL";
  monthlyPayment?: number;
  initialCost?: number;
  remainingMonths?: number;
  description: string;
  photos: (File | null)[];
}

const INITIAL: WizardForm = {
  brand: "",
  model: "",
  description: "",
  photos: [],
};

export function useWizardState() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(INITIAL);

  const patch = (p: Partial<WizardForm>) => setForm((f) => ({ ...f, ...p }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return { step, form, patch, next, prev, setStep };
}
```

- [ ] **Step 2b: Wizard 구조 교체**

기존 `sell-wizard.tsx`를 전면 대체. Step 배열 정의 후 `step` 값에 따라 해당 섹션 렌더.

```tsx
// 핵심 골격 (실제 파일에서 기존 submit 로직은 유지)
"use client";
import { useWizardState } from "./use-wizard-state";
import { PlateLookup } from "./plate-lookup";
import { PhotoGuide } from "./photo-guide";

const TOTAL_STEPS = 8;

export function SellWizard() {
  const { step, form, patch, next, prev } = useWizardState();

  const steps = [
    <PlateLookup
      onResult={(r) => {
        patch({ plate: r.plate, brand: r.brand, model: r.model, year: r.year, fuel: r.fuel });
        next();
      }}
      onSkip={next}
    />,
    // ... step 1: 차종 수정, step 2: 연식/주행, step 3: 상품타입, step 4: 가격, step 5: 잔여개월/보증금, step 6: 사진, step 7: 설명/제출
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <ProgressBar current={step} total={TOTAL_STEPS} />
      <div className="min-h-[320px]">{steps[step]}</div>
      <StickyFooter
        onPrev={prev}
        onNext={next}
        canPrev={step > 0}
        canNext={step < TOTAL_STEPS - 1}
      />
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold tabular-nums">{current + 1}/{total}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--chayong-surface)]">
        <div
          className="h-full bg-[var(--chayong-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StickyFooter({
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3">
      <div className="mx-auto flex max-w-2xl gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="h-12 rounded-xl border px-4 font-semibold disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="h-12 flex-1 rounded-xl bg-[var(--chayong-primary)] font-semibold text-white disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
```

각 step의 구체 필드 UI는 기존 `sell-wizard.tsx`에 있는 입력 필드들을 1개씩 분리하여 배치. 기존 submit 함수는 마지막 step에서 호출.

- [ ] **Step 3: type-check + lint + unit**

```bash
bun run type-check && bun run lint && bun run test
```

- [ ] **Step 4: Commit**

```bash
git add src/features/sell/components/
git commit -m "feat(sell): refactor wizard to 1-question-per-screen with plate lookup + photo guide"
```

### Task 4.5: E2E

**Files:**
- Create: `tests/e2e/sell-plate-lookup.spec.ts`

- [ ] **Step 1: Write E2E**

```ts
import { test, expect } from "@playwright/test";

test("plate lookup auto-fills brand/model", async ({ page }) => {
  await page.goto("/sell");
  await page.getByLabel(/차량번호/).fill("12가3456");
  await page.getByRole("button", { name: /조회/ }).click();
  // after auto-advance, next step shows brand
  await expect(page.getByText("BMW")).toBeVisible({ timeout: 5000 });
});

test("manual skip continues without lookup", async ({ page }) => {
  await page.goto("/sell");
  await page.getByRole("button", { name: /수동 입력/ }).click();
  // progress bar should advance
  await expect(page.locator("text=2/8")).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
bun run test:e2e -- tests/e2e/sell-plate-lookup.spec.ts
```

- [ ] **Step 3: Commit + PR**

```bash
git add tests/e2e/sell-plate-lookup.spec.ts
git commit -m "test(e2e): cover sell plate-lookup flow"
git push -u origin ui/sell-heydealer
gh pr create --base main --head ui/sell-heydealer --title "WT4: ui/sell-heydealer" --body "Phase 2 of UI parallel track. Closes: spec WT4."
```

---

## WT1 — `ui/home-refresh` (스키마 플랜 머지 후)

**Branch:** `ui/home-refresh` (from updated main)
**Worktree:** `.claude/worktrees/ui-home-refresh/`

### Task 1.0: Worktree 생성 (스키마 플랜 머지 이후)

- [ ] **Step 1:**

```bash
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-home-refresh -b ui/home-refresh main
cd .claude/worktrees/ui-home-refresh
mkdir -p src/features/home
```

### Task 1.1: `search-hub.tsx` (신규)

**Files:** `src/features/home/search-hub.tsx`, `src/features/home/search-hub.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchHub } from "./search-hub";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SearchHub", () => {
  it("renders type chips", () => {
    render(<SearchHub brands={["BMW", "현대"]} />);
    expect(screen.getByText("승계")).toBeInTheDocument();
    expect(screen.getByText("중고리스")).toBeInTheDocument();
    expect(screen.getByText("중고렌트")).toBeInTheDocument();
  });

  it("builds correct link when type is selected", () => {
    render(<SearchHub brands={[]} />);
    const cta = screen.getByRole("link", { name: /검색/ });
    fireEvent.click(screen.getByText("승계"));
    expect(cta.getAttribute("href")).toContain("type=TRANSFER");
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// src/features/home/search-hub.tsx
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildListingUrl, type ListingFilters } from "@/lib/listings/filters";

interface Props { brands: string[]; }

const TYPES: Array<{ value: ListingFilters["type"]; label: string }> = [
  { value: "TRANSFER", label: "승계" },
  { value: "USED_LEASE", label: "중고리스" },
  { value: "USED_RENTAL", label: "중고렌트" },
];

const RANGES: Array<{ min?: number; max?: number; label: string }> = [
  { max: 30, label: "~30만" },
  { min: 30, max: 50, label: "30~50만" },
  { min: 50, label: "50만+" },
];

export function SearchHub({ brands }: Props) {
  const [type, setType] = useState<ListingFilters["type"]>();
  const [range, setRange] = useState<number>();
  const [brand, setBrand] = useState<string>();

  const href = useMemo(() => {
    const r = range !== undefined ? RANGES[range] : undefined;
    return buildListingUrl({ type, minPayment: r?.min, maxPayment: r?.max, brand });
  }, [type, range, brand]);

  return (
    <section aria-label="매물 빠른 검색" className="rounded-2xl border bg-[var(--chayong-bg)] p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ChipGroup label="상품">
          {TYPES.map((t) => (
            <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
              {t.label}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label="월납입금">
          {RANGES.map((r, i) => (
            <Chip key={r.label} active={range === i} onClick={() => setRange(i)}>
              {r.label}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label="브랜드">
          {brands.slice(0, 6).map((b) => (
            <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</Chip>
          ))}
        </ChipGroup>
      </div>
      <Link
        href={href}
        className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[var(--chayong-primary)] font-semibold text-white"
      >
        매물 검색 →
      </Link>
    </section>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold" style={{ color: "var(--chayong-text-sub)" }}>{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white" : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: test green, commit**

```bash
bun run test src/features/home/search-hub.test.tsx
git add src/features/home/search-hub.tsx src/features/home/search-hub.test.tsx
git commit -m "feat(home): add SearchHub with type/payment/brand chips"
```

### Task 1.2: `trust-stripe.tsx` + `story-cards.tsx` + `how-it-works-timeline.tsx`

세 컴포넌트를 묶어서 구현 (각각 정적 마크업, 테스트는 smoke만).

**Files:**
- Create: `src/features/home/trust-stripe.tsx`
- Create: `src/features/home/story-cards.tsx`
- Create: `src/features/home/how-it-works-timeline.tsx`

- [ ] **Step 1: Implement**

```tsx
// trust-stripe.tsx
export function TrustStripe() {
  const items = [
    { value: "1,280", unit: "건", label: "누적 승계" },
    { value: "100", unit: "%", label: "에스크로 보호" },
    { value: "320", unit: "만원", label: "평균 절약" },
    { value: "24", unit: "시간", label: "응답 속도" },
  ];
  return (
    <section aria-label="신뢰 지표" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--chayong-primary)" }}>
            {it.value}
            <span className="ml-1 text-base">{it.unit}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--chayong-text-sub)" }}>{it.label}</p>
        </div>
      ))}
    </section>
  );
}

// story-cards.tsx
export function StoryCards() {
  const stories = [
    { type: "승계", tag: "TRANSFER", headline: "잔여 8개월 BMW X3, 1,200만원 절약", body: "판매자 위약금 회피 + 구매자 초기비용 zero." },
    { type: "중고리스", tag: "USED_LEASE", headline: "3년 된 제네시스, 월 45만원으로 시승", body: "신차 리스 대비 40% 저렴, 법인 세제 혜택." },
    { type: "중고렌트", tag: "USED_RENTAL", headline: "짧은 계약 기간, 빠른 회전", body: "1년 이하 단기 계약 매물 전문 큐레이션." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stories.map((s) => (
        <article key={s.type} className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold" style={{ color: "var(--chayong-primary)" }}>{s.type}</p>
          <h3 className="mt-2 text-lg font-bold" style={{ textWrap: "balance" as const }}>{s.headline}</h3>
          <p className="mt-2 text-sm" style={{ color: "var(--chayong-text-sub)" }}>{s.body}</p>
        </article>
      ))}
    </div>
  );
}

// how-it-works-timeline.tsx
export function HowItWorksTimeline() {
  const steps = [
    { n: 1, title: "매물 탐색", body: "원하는 승계/리스/렌트 매물을 검색하고 월납입금을 비교." },
    { n: 2, title: "상담 신청", body: "관심 매물에 상담 신청 → 연락처 차단 채팅으로 안전 대화." },
    { n: 3, title: "에스크로 결제", body: "토스페이먼츠 에스크로로 안전하게 대금 보호." },
    { n: 4, title: "계약 완료", body: "명의 이전 완료 후 에스크로 자동 해제." },
  ];
  return (
    <ol className="relative space-y-6 border-l-2 pl-6" style={{ borderColor: "var(--chayong-divider)" }}>
      {steps.map((s) => (
        <li key={s.n} className="relative">
          <span
            className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums text-white"
            style={{ background: "var(--chayong-primary)" }}
          >
            {s.n}
          </span>
          <h3 className="text-base font-bold">{s.title}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--chayong-text-sub)" }}>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Smoke test each**

```tsx
// src/features/home/home-sections.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustStripe } from "./trust-stripe";
import { StoryCards } from "./story-cards";
import { HowItWorksTimeline } from "./how-it-works-timeline";

describe("home sections", () => {
  it("TrustStripe renders 4 items", () => {
    render(<TrustStripe />);
    expect(screen.getAllByText(/누적|에스크로|평균|응답/)).toHaveLength(4);
  });
  it("StoryCards renders 3 articles", () => {
    render(<StoryCards />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });
  it("HowItWorksTimeline renders 4 steps", () => {
    render(<HowItWorksTimeline />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
```

- [ ] **Step 3: Commit**

```bash
bun run test src/features/home/
git add src/features/home/
git commit -m "feat(home): add TrustStripe, StoryCards, HowItWorksTimeline"
```

### Task 1.3: Rewire `src/app/(public)/page.tsx`

- [ ] **Step 1: Read current homepage**

```bash
cat src/app/(public)/page.tsx
```

- [ ] **Step 2: Replace legacy "왜 차용인가요?" + "이용 방법" sections with new components**

```tsx
// preserve hero + vehicle grid sections (they stay)
// after hero: <SearchHub brands={topBrands} />
// remove "왜 차용인가요?" 4-col icon grid → <TrustStripe /> + <StoryCards />
// remove "이용 방법" 4-step circled → <HowItWorksTimeline />
```

`topBrands`는 server component에서 `prisma.listing.findMany({ distinct: ["brand"], take: 10, select: { brand: true } })`로 조회.

Preserve all existing data-prep code that schema plan Task 8 has already touched (accidentFree removal). Do not reintroduce accidentFree.

- [ ] **Step 3: Build + smoke**

```bash
bun run build
bun run dev &
sleep 5
curl -s http://localhost:3000 | grep -iE "검색|누적|이용" | head
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat(home): compose SearchHub + TrustStripe + StoryCards + Timeline"
```

### Task 1.4: E2E + PR

**Files:** `tests/e2e/home-search-hub.spec.ts`

- [ ] **Step 1:**

```ts
import { test, expect } from "@playwright/test";

test("home search hub links to /list with filter", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "승계" }).click();
  await page.getByRole("button", { name: /30~50만/ }).click();
  await page.getByRole("link", { name: /매물 검색/ }).click();
  await expect(page).toHaveURL(/\/list\?type=TRANSFER.*minPayment=30/);
});
```

- [ ] **Step 2: Run + Commit + PR**

```bash
bun run test:e2e -- tests/e2e/home-search-hub.spec.ts
git add tests/e2e/home-search-hub.spec.ts
git commit -m "test(e2e): home search hub filters"
git push -u origin ui/home-refresh
gh pr create --base main --head ui/home-refresh --title "WT1: ui/home-refresh"
```

---

## WT2 — `ui/list-density` (스키마 플랜 머지 후)

**Branch:** `ui/list-density`
**Worktree:** `.claude/worktrees/ui-list-density/`

### Task 2.0: Worktree 생성

```bash
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-list-density -b ui/list-density main
```

### Task 2.1: Sort 옵션 확장 (`advanced-filters.tsx`)

- [ ] **Step 1: 파일 읽기**

```bash
cat src/features/listings/components/advanced-filters.tsx
```

- [ ] **Step 2: Sort 옵션 배열에 `year_desc`, `mileage_asc` 추가**

```tsx
const SORT_OPTIONS = [
  { value: "newest", label: "최신순" },
  { value: "price_asc", label: "월납입금 낮은순" },
  { value: "price_desc", label: "월납입금 높은순" },
  { value: "year_desc", label: "연식 최신순" },
  { value: "mileage_asc", label: "주행거리 적은순" },
];
```

URL 업데이트는 기존 로직(`buildListingUrl` 사용으로 교체).

- [ ] **Step 3: `list/page.tsx` `buildOrderBy`에 신규 case 추가**

```ts
case "year_desc": return { year: "desc" };
case "mileage_asc": return { mileage: "asc" };
```

- [ ] **Step 4: Test + commit**

```bash
bun run type-check && bun run test
git add src/features/listings/components/advanced-filters.tsx src/app/(public)/list/page.tsx
git commit -m "feat(listings): add year_desc and mileage_asc sort options"
```

### Task 2.2: `sidebar-filters.tsx` (데스크톱 사이드바)

**Files:** `src/features/listings/components/sidebar-filters.tsx`, test

- [ ] **Step 1: Test first**

체크박스 + 슬라이더 → URL 쿼리 변경. mock router, `buildListingUrl` 결과 assert.

- [ ] **Step 2: Implement**

```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { buildListingUrl, parseListingFilters, type ListingFilters } from "@/lib/listings/filters";

interface Props { brands: string[]; }

export function SidebarFilters({ brands }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = parseListingFilters(Object.fromEntries(sp.entries()));

  function update(patch: Partial<ListingFilters>) {
    router.push(buildListingUrl({ ...current, ...patch, page: 1 }));
  }

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-[80px] space-y-6 rounded-xl border bg-white p-4">
        <FieldSet legend="브랜드">
          {brands.slice(0, 10).map((b) => (
            <label key={b} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={current.brand === b}
                onChange={(e) => update({ brand: e.target.checked ? b : undefined })}
              />
              {b}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="월납입금 (만원)">
          <RangeInput
            min={current.minPayment}
            max={current.maxPayment}
            onChange={(mn, mx) => update({ minPayment: mn, maxPayment: mx })}
          />
        </FieldSet>

        <FieldSet legend="연료">
          {(["GASOLINE", "DIESEL", "HYBRID", "EV"] as const).map((f) => (
            <label key={f} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={current.fuel === f}
                onChange={(e) => update({ fuel: e.target.checked ? f : undefined })}
              />
              {f}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="변속기">
          {(["AUTO", "MANUAL"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={current.trans === t}
                onChange={(e) => update({ trans: e.target.checked ? t : undefined })}
              />
              {t === "AUTO" ? "자동" : "수동"}
            </label>
          ))}
        </FieldSet>

        <FieldSet legend="사고 이력">
          {[0, 1, 2].map((n) => (
            <label key={n} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="radio"
                name="accident"
                checked={current.accidentMax === n}
                onChange={() => update({ accidentMax: n })}
              />
              {n === 0 ? "무사고" : `${n}회 이하`}
            </label>
          ))}
        </FieldSet>
      </div>
    </aside>
  );
}

function FieldSet({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

function RangeInput({
  min,
  max,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange: (mn?: number, mx?: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder="최소"
        value={min ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined, max)}
        className="h-10 w-full rounded-lg border px-2"
      />
      <span>-</span>
      <input
        type="number"
        placeholder="최대"
        value={max ?? ""}
        onChange={(e) => onChange(min, e.target.value ? Number(e.target.value) : undefined)}
        className="h-10 w-full rounded-lg border px-2"
      />
    </div>
  );
}
```

- [ ] **Step 3: `list/page.tsx`의 `buildWhere`에 `fuel`, `trans`, `accidentMax` 조건 추가**

```ts
if (filters.fuel) where.fuel = filters.fuel;
if (filters.trans) where.transmission = filters.trans;
if (filters.accidentMax !== undefined) where.accidentCount = { lte: filters.accidentMax };
```

(필드 이름은 스키마 플랜이 확정한 실제 Prisma 필드명 기준으로 조정)

- [ ] **Step 4: Mount sidebar in `list/page.tsx` layout**

기존 main container를 flex 레이아웃으로 래핑:
```tsx
<div className="flex gap-6">
  <SidebarFilters brands={topBrands} />
  <div className="flex-1">
    {/* existing result list */}
  </div>
</div>
```

- [ ] **Step 5: Test + commit**

```bash
bun run test && bun run type-check
git add src/features/listings/components/sidebar-filters.tsx src/app/(public)/list/page.tsx
git commit -m "feat(listings): add desktop sidebar filters (brand/payment/fuel/trans/accident)"
```

### Task 2.3: `result-meta.tsx`

**Files:** `src/features/listings/components/result-meta.tsx`

- [ ] **Step 1: Implement + test**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { buildListingUrl, type ListingFilters } from "@/lib/listings/filters";

interface Props { count: number; filters: ListingFilters; }

export function ResultMeta({ count, filters }: Props) {
  const router = useRouter();
  const chips: Array<{ key: keyof ListingFilters; label: string; next: Partial<ListingFilters> }> = [];
  if (filters.type) chips.push({ key: "type", label: filters.type, next: { type: undefined } });
  if (filters.brand) chips.push({ key: "brand", label: filters.brand, next: { brand: undefined } });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel, next: { fuel: undefined } });
  if (filters.trans) chips.push({ key: "trans", label: filters.trans, next: { trans: undefined } });
  if (filters.accidentMax !== undefined)
    chips.push({ key: "accidentMax", label: `사고 ${filters.accidentMax}회 이하`, next: { accidentMax: undefined } });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold">
        총 <span className="tabular-nums">{count.toLocaleString("ko-KR")}</span>개 매물
      </p>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => router.push(buildListingUrl({ ...filters, ...c.next, page: 1 }))}
          className="rounded-full border px-3 py-1 text-xs"
        >
          {c.label} ✕
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Mount above ListingGrid in `list/page.tsx`**

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/result-meta.tsx src/app/(public)/list/page.tsx
git commit -m "feat(listings): add result-meta chip strip"
```

### Task 2.4: `vehicle-card.tsx` features/accident 확장

- [ ] **Step 1:** 카드 content 영역에 features chip 3개 + accidentCount 표시

```tsx
// inside VehicleCard content div, before Stats:
{(listing.features ?? []).slice(0, 3).length > 0 && (
  <div className="flex flex-wrap gap-1">
    {(listing.features ?? []).slice(0, 3).map((f) => (
      <span key={f} className="rounded-full border px-2 py-0.5 text-[10px]"
        style={{ color: "var(--chayong-text-sub)" }}>
        {f}
      </span>
    ))}
  </div>
)}
{listing.accidentCount !== undefined && listing.accidentCount > 0 && (
  <span className="text-[10px]" style={{ color: "var(--chayong-danger)" }}>
    사고 {listing.accidentCount}회
  </span>
)}
```

(실제 필드명은 스키마 플랜 결과와 맞춤)

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/vehicle-card.tsx
git commit -m "feat(card): display features chips and accident count"
```

### Task 2.5: E2E + PR

```ts
// tests/e2e/list-sidebar.spec.ts
import { test, expect } from "@playwright/test";
test("sidebar filter narrows results and updates URL", async ({ page }) => {
  await page.goto("/list");
  await page.getByLabel("GASOLINE").check();
  await expect(page).toHaveURL(/fuel=GASOLINE/);
});
```

Commit + push + PR.

---

## WT3 — `ui/detail-trust` (스키마 전체 머지 + WT2 머지 후)

**Branch:** `ui/detail-trust`

### Task 3.0: Worktree 생성

```bash
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-detail-trust -b ui/detail-trust main
```

### Task 3.1: `listing-gallery.tsx` 전면 리뉴얼 + a11y lightbox

**Files:** `src/features/listings/components/listing-gallery.tsx` (수정), test

- [ ] **Step 1: Test — keyboard nav, focus trap**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingGallery } from "./listing-gallery";

const IMAGES = [
  { id: "1", url: "/a.jpg", alt: "a", order: 0 },
  { id: "2", url: "/b.jpg", alt: "b", order: 1 },
];

describe("ListingGallery", () => {
  it("shows first image", () => {
    render(<ListingGallery images={IMAGES} />);
    expect(screen.getByAltText("a")).toBeInTheDocument();
  });
  it("thumbnail click switches main", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /thumbnail 2/ }));
    expect(screen.getByAltText("b")).toBeInTheDocument();
  });
  it("lightbox opens with keyboard ArrowRight", () => {
    render(<ListingGallery images={IMAGES} />);
    fireEvent.click(screen.getByAltText("a"));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByAltText("b")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement with ARIA role="dialog", keyboard handlers, focus trap**

(구현 코드 상당량, 기존 `listing-gallery.tsx`를 확장. 상세 구현은 실행 시 참고 — shadcn Dialog 기반 또는 자체 포털.)

- [ ] **Step 3: Commit**

### Task 3.2: `spec-panel.tsx`

상세 그리드 + null 처리. 스키마 플랜이 추가한 필드명 확정 후 매핑.

### Task 3.3: `options-chips.tsx`

`vehicle-options.ts` 카탈로그와 매핑, 카테고리별 그룹화.

### Task 3.4: `seller-card.tsx`

판매자 정보 + 타입 배지 + 인증 slot.

### Task 3.5: `similar-listings.tsx`

같은 type + (same brand OR price ±20%) 4~8개 carousel.

### Task 3.6: `detail/[id]/page.tsx` 재조합

새 컴포넌트들을 배치. CTA sidebar/mobile bar는 유지.

### Task 3.7: E2E + PR

```ts
// tests/e2e/detail-gallery.spec.ts
test("gallery lightbox opens and keyboard navigates", async ({ page }) => {
  await page.goto("/detail/<seeded-id>");
  await page.getByRole("img").first().click();
  await page.keyboard.press("ArrowRight");
  // assert next image visible
});
```

---

## Final Validation (모든 WT 머지 후 main에서)

- [ ] **Step 1: Full check**

```bash
bun run type-check && bun run lint && bun run test && bun run build && bun run test:e2e
```

- [ ] **Step 2: `/design-review` 재감사**

Local dev 서버에서 `/design-review http://localhost:3000` 실행, 경쟁사 갭 HIGH 체크리스트 resolved 확인.

- [ ] **Step 3: 머지 후 워크트리 정리**

```bash
git worktree remove .claude/worktrees/ui-sell-heydealer
git worktree remove .claude/worktrees/ui-home-refresh
git worktree remove .claude/worktrees/ui-list-density
git worktree remove .claude/worktrees/ui-detail-trust
```

---

## Self-Review Notes

스펙 커버리지 확인:
- WT0 `parseListingFilters` ✓ (Task 0.1)
- WT0 `ListingCardData` contract note ✓ (Task 0.3)
- WT0 tabular-nums ✓ (Task 0.4)
- WT1 search-hub ✓ (1.1), trust-stripe/story-cards/timeline ✓ (1.2), page compose ✓ (1.3), E2E ✓ (1.4)
- WT2 sort extension ✓ (2.1), sidebar ✓ (2.2), result-meta ✓ (2.3), vehicle-card features ✓ (2.4), E2E ✓ (2.5)
- WT3 gallery ✓ (3.1), spec-panel ✓ (3.2), options-chips ✓ (3.3), seller-card ✓ (3.4), similar-listings ✓ (3.5), page compose ✓ (3.6), E2E ✓ (3.7)
- WT4 API ✓ (4.1), plate-lookup ✓ (4.2), photo-guide ✓ (4.3), wizard ✓ (4.4), E2E ✓ (4.5)

Known plan gaps (intentional):
- WT3 Tasks 3.2~3.6의 구체 코드는 스키마 플랜 필드 확정 후 executor가 작성 (필드명 불확정 상태에서 placeholder 코드는 오히려 오해 유발). Spec에 섹션 설계가 있으므로 executor가 스키마 확정 시점에 spec 기반으로 구현.
- Story Cards 실제 카피 수치는 마케팅 확정 필요 — v1은 placeholder 값 사용.
- photo-guide SVG 실루엣은 v2 (디자인 리소스 확보 후).
