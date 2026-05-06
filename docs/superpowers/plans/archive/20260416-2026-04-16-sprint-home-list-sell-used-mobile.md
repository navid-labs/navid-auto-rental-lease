# Sprint: HOME + LIST + SELL + USED + Mobile + Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차용 플랫폼 6개 영역 UI 개선 — 헤더 심플화, HOME 재구성, LIST 정렬/로딩, SELL 텍스트, /used 랜딩, 모바일 터치타겟

**Architecture:** Next.js 15 App Router 서버 컴포넌트 기반. 신규 클라이언트 컴포넌트 3개(TypeTabs, SortSelect, SellCtaBanner). DB/API 변경 없음, UI 레이어만 수정.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Prisma 6, TypeScript 5

**Spec:** `docs/superpowers/specs/2026-04-16-sprint-home-list-sell-used-mobile-design.md`

---

## File Structure

### Modified Files
| File | Responsibility |
|------|---------------|
| `src/components/layout/header.tsx` | Desktop nav — 3메뉴로 축소, max-w-7xl |
| `src/components/layout/footer.tsx` | Footer — 링크 업데이트, max-w-7xl |
| `src/app/(public)/page.tsx` | HOME — 섹션 순서, 미니카드 제거, CTA 추가 |
| `src/app/(public)/list/page.tsx` | LIST — TypeTabs 삽입, Suspense fallback 교체 |
| `src/features/listings/components/result-meta.tsx` | 정렬 드롭다운 추가 |
| `src/features/listings/components/listing-grid.tsx` | PaginationBar 터치타겟 |
| `src/features/sell/components/sell-wizard.tsx` | 가이드 텍스트 보강 |
| `src/app/(public)/used/page.tsx` | 리다이렉트 → 전용 랜딩 |
| `src/components/ui/filter-bar.tsx` | 터치타겟 44px |
| `src/features/home/search-hub.tsx` | 칩 터치타겟 |

### New Files
| File | Responsibility |
|------|---------------|
| `src/features/listings/components/type-tabs.tsx` | 전체/승계/리스/렌트 탭 (client) |
| `src/features/listings/components/sort-select.tsx` | 정렬 드롭다운 (client) |
| `src/features/listings/components/listing-skeleton.tsx` | 스켈레톤 카드 그리드 (server) |
| `src/features/home/sell-cta-banner.tsx` | 판매 유도 배너 (server) |

---

## Task 1: Header — 3메뉴 + max-w-7xl

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Update NAV_LINKS and max-width**

```tsx
// src/components/layout/header.tsx — replace NAV_LINKS array (line 6-10)
const NAV_LINKS = [
  { href: "/list", label: "매물보기" },
  { href: "/sell", label: "내 차 등록" },
  { href: "/guide", label: "이용가이드" },
];
```

Also change `max-w-6xl` to `max-w-7xl` on line 19.

- [ ] **Step 2: Verify dev server**

Run: `bun dev` (if not running)
Check: http://localhost:3000 — header shows 3 menu items, layout wider

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "refactor(header): simplify to 3 menus + max-w-7xl"
```

---

## Task 2: Footer — 링크 업데이트 + max-w-7xl

**Files:**
- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Update SERVICE_LINKS, max-width**

```tsx
// src/components/layout/footer.tsx — replace SERVICE_LINKS (line 4-9)
const SERVICE_LINKS = [
  { href: "/list", label: "매물보기" },
  { href: "/used", label: "리스·렌트 안내" },
  { href: "/sell", label: "내 차 등록" },
  { href: "/guide", label: "이용가이드" },
];
```

Change `max-w-6xl` to `max-w-7xl` on line 24.

- [ ] **Step 2: Verify footer in browser**

Check: scroll to bottom, verify 4 service links with updated labels

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "refactor(footer): update links + max-w-7xl"
```

---

## Task 3: ListingSkeleton — 스켈레톤 카드 컴포넌트

**Files:**
- Create: `src/features/listings/components/listing-skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

```tsx
// src/features/listings/components/listing-skeleton.tsx
export function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="매물 불러오는 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border bg-[var(--chayong-bg)]"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          {/* Image placeholder */}
          <div className="aspect-[4/3] w-full animate-pulse bg-[var(--chayong-surface)]" />
          {/* Content placeholder */}
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--chayong-surface)]" />
            <div className="mt-1 h-px bg-[var(--chayong-divider)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--chayong-surface)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`
Expected: no errors in listing-skeleton.tsx

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/listing-skeleton.tsx
git commit -m "feat(list): add ListingSkeleton component"
```

---

## Task 4: TypeTabs — 전체/승계/리스/렌트 탭

**Files:**
- Create: `src/features/listings/components/type-tabs.tsx`

- [ ] **Step 1: Create TypeTabs client component**

```tsx
// src/features/listings/components/type-tabs.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildListingUrl } from "@/lib/listings/filters";
import type { ListingTypeFilter } from "@/lib/listings/filters";

const TABS: Array<{ value: ListingTypeFilter | undefined; label: string }> = [
  { value: undefined, label: "전체" },
  { value: "TRANSFER", label: "승계" },
  { value: "USED_LEASE", label: "리스" },
  { value: "USED_RENTAL", label: "렌트" },
];

export function TypeTabs() {
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? undefined;

  return (
    <div
      className="mb-4 flex gap-2 overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map(({ value, label }) => {
        const isActive = currentType === value;
        return (
          <Link
            key={label}
            href={buildListingUrl({
              type: value,
              brand: searchParams.get("brand") || undefined,
              q: searchParams.get("q") || undefined,
              sort: (searchParams.get("sort") as ListingTypeFilter) || undefined,
            })}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
            style={{
              backgroundColor: isActive
                ? "var(--chayong-primary)"
                : "var(--chayong-surface)",
              color: isActive ? "#ffffff" : "var(--chayong-text-sub)",
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/type-tabs.tsx
git commit -m "feat(list): add TypeTabs component"
```

---

## Task 5: SortSelect — 정렬 드롭다운

**Files:**
- Create: `src/features/listings/components/sort-select.tsx`

- [ ] **Step 1: Create SortSelect client component**

```tsx
// src/features/listings/components/sort-select.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ListingSort } from "@/lib/listings/filters";

const SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: "newest", label: "최신순" },
  { value: "price_asc", label: "월납입금 낮은순" },
  { value: "price_desc", label: "월납입금 높은순" },
  { value: "year_desc", label: "연식 최신순" },
  { value: "mileage_asc", label: "주행거리 짧은순" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="min-h-[44px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--chayong-primary)]"
      style={{
        borderColor: "var(--chayong-border)",
        backgroundColor: "var(--chayong-bg)",
        color: "var(--chayong-text)",
      }}
      aria-label="정렬 기준"
    >
      {SORT_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/sort-select.tsx
git commit -m "feat(list): add SortSelect dropdown component"
```

---

## Task 6: ResultMeta — SortSelect 통합

**Files:**
- Modify: `src/features/listings/components/result-meta.tsx`

- [ ] **Step 1: Add SortSelect to ResultMeta layout**

Replace the entire `result-meta.tsx` content:

```tsx
// src/features/listings/components/result-meta.tsx
"use client";

import { useRouter } from "next/navigation";
import { buildListingUrl, type ListingFilters } from "@/lib/listings/filters";
import { SortSelect } from "./sort-select";

interface Props {
  count: number;
  filters: ListingFilters;
}

export function ResultMeta({ count, filters }: Props) {
  const router = useRouter();

  const chips: Array<{
    key: keyof ListingFilters;
    label: string;
    next: Partial<ListingFilters>;
  }> = [];

  if (filters.type) chips.push({ key: "type", label: filters.type, next: { type: undefined } });
  if (filters.brand) chips.push({ key: "brand", label: filters.brand, next: { brand: undefined } });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel, next: { fuel: undefined } });
  if (filters.trans) chips.push({ key: "trans", label: filters.trans, next: { trans: undefined } });
  if (filters.accidentMax !== undefined)
    chips.push({
      key: "accidentMax",
      label: filters.accidentMax === 0 ? "무사고" : `사고 ${filters.accidentMax}회 이하`,
      next: { accidentMax: undefined },
    });

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
          총{" "}
          <span className="tabular-nums" style={{ color: "var(--chayong-primary)" }}>
            {count.toLocaleString("ko-KR")}
          </span>
          개 매물
        </p>
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              router.push(buildListingUrl({ ...filters, ...c.next, page: 1 }))
            }
            className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors hover:border-[var(--chayong-primary)] hover:text-[var(--chayong-primary)]"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-sub)",
            }}
          >
            {c.label}
            <span aria-hidden="true">&times;</span>
          </button>
        ))}
      </div>
      <SortSelect />
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Verify in browser**

Check: http://localhost:3000/list — sort dropdown appears right of count, changing it updates URL

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/result-meta.tsx
git commit -m "feat(list): integrate SortSelect into ResultMeta"
```

---

## Task 7: LIST page — TypeTabs + Skeleton fallback

**Files:**
- Modify: `src/app/(public)/list/page.tsx`

- [ ] **Step 1: Add imports and TypeTabs + skeleton fallback**

Add imports at top of `list/page.tsx`:

```tsx
import { TypeTabs } from "@/features/listings/components/type-tabs";
import { ListingSkeleton } from "@/features/listings/components/listing-skeleton";
```

- [ ] **Step 2: Insert TypeTabs before ResultMeta**

In the JSX, inside `<div className="flex-1 min-w-0">`, add TypeTabs wrapped in Suspense before the existing ResultMeta Suspense:

```tsx
{/* Type tabs — 전체/승계/리스/렌트 */}
<Suspense fallback={null}>
  <TypeTabs />
</Suspense>
```

- [ ] **Step 3: Replace Suspense fallback for ListingGrid**

Replace the text fallback (lines 174-184) with:

```tsx
<Suspense fallback={<ListingSkeleton count={6} />}>
```

- [ ] **Step 4: Verify in browser**

Check: http://localhost:3000/list
- TypeTabs visible above result count
- Click "승계" → URL becomes `?type=TRANSFER`, listings filtered
- Skeleton cards show briefly on page load

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/list/page.tsx
git commit -m "feat(list): add TypeTabs + skeleton loading fallback"
```

---

## Task 8: PaginationBar — 터치타겟 44px

**Files:**
- Modify: `src/features/listings/components/listing-grid.tsx`

- [ ] **Step 1: Update pagination button sizes**

In `listing-grid.tsx`, find all `h-9 w-9` in PaginationBar (lines 66, 88, 101) and replace with `h-11 w-11`:

- Line 66 (prev button): `h-9 w-9` → `h-11 w-11`
- Line 88 (page buttons): `h-9 w-9` → `h-11 w-11`
- Line 101 (next button): `h-9 w-9` → `h-11 w-11`

- [ ] **Step 2: Verify in browser**

Check: pagination buttons visibly larger (44px)

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/listing-grid.tsx
git commit -m "fix(list): increase pagination touch targets to 44px"
```

---

## Task 9: FilterBar + SearchHub — 터치타겟

**Files:**
- Modify: `src/components/ui/filter-bar.tsx`
- Modify: `src/features/home/search-hub.tsx`

- [ ] **Step 1: FilterBar — add min-height**

In `filter-bar.tsx`, line 52 button class, add `min-h-[44px]`:

```tsx
className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[44px]"
```

- [ ] **Step 2: SearchHub — add min-height to Chip**

In `search-hub.tsx`, line 104 Chip button class, add `min-h-[44px]`:

```tsx
className={`rounded-full border px-3 py-1.5 text-sm transition min-h-[44px] ${
  active
    ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white"
    : "bg-white"
}`}
```

- [ ] **Step 3: Verify in browser (mobile viewport)**

Check: DevTools responsive mode (375px) — all chip buttons tall enough for thumb taps

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/filter-bar.tsx src/features/home/search-hub.tsx
git commit -m "fix(mobile): ensure 44px touch targets on filter chips"
```

---

## Task 10: SellCtaBanner — 판매 유도 배너

**Files:**
- Create: `src/features/home/sell-cta-banner.tsx`

- [ ] **Step 1: Create banner component**

```tsx
// src/features/home/sell-cta-banner.tsx
import Link from "next/link";

export function SellCtaBanner() {
  return (
    <section
      className="rounded-2xl px-6 py-10 text-center"
      style={{ backgroundColor: "var(--chayong-surface)" }}
    >
      <h2
        className="text-xl font-bold"
        style={{ color: "var(--chayong-text)" }}
      >
        리스·렌트 계약, 부담되시나요?
      </h2>
      <p
        className="mt-2 text-sm"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        차용에서 안전하게 승계하세요.
      </p>
      <Link
        href="/sell"
        className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        내 차 등록하기 &rarr;
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/home/sell-cta-banner.tsx
git commit -m "feat(home): add SellCtaBanner component"
```

---

## Task 11: HOME page — 섹션 재구성

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Add import**

```tsx
import { SellCtaBanner } from "@/features/home/sell-cta-banner";
```

- [ ] **Step 2: Delete "지금, 이 매물 어때요?" section**

Remove lines 186-245 (the entire `{listings.length > 0 && ( <section className="py-6">` block with the horizontal scroll mini cards).

- [ ] **Step 3: Reorder sections**

Rearrange the remaining JSX sections in this order:

```tsx
{/* 1. Hero */}
<section className="py-16">...</section>

{/* 2. Search Hub */}
<section className="py-4">
  <SearchHub brands={topBrands} />
</section>

{/* 3. Trust Stripe (moved up from position 5) */}
<section className="my-6">
  <TrustStripe />
</section>

{/* 4. 추천 매물 (header text changed) */}
<section className="py-8">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold" style={{ color: "var(--chayong-text)" }}>
        지금, 이 매물 어때요?
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
        실시간으로 매칭되는 승계 매물을 확인해보세요.
      </p>
    </div>
    <Link href="/list" className="text-sm font-medium" style={{ color: "var(--chayong-primary)" }}>
      전체보기 &gt;
    </Link>
  </div>
  {/* ... existing grid or empty state ... */}
</section>

{/* 5. Story Cards */}
<section className="py-8">...</section>

{/* 6. How It Works */}
<section className="py-10 mb-8">...</section>

{/* 7. Sell CTA Banner (new) */}
<section className="mb-8">
  <SellCtaBanner />
</section>
```

- [ ] **Step 4: Verify in browser**

Check: http://localhost:3000
- Hero → SearchHub → TrustStripe → 추천매물 → StoryCards → HowItWorks → CTA
- No horizontal scroll mini cards
- "지금, 이 매물 어때요?" heading on the grid section

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "refactor(home): reorder sections + remove mini cards + add CTA"
```

---

## Task 12: SELL wizard — 가이드 텍스트 보강

**Files:**
- Modify: `src/features/sell/components/sell-wizard.tsx`

- [ ] **Step 1: Update LISTING_TYPE_OPTIONS desc**

Replace the desc fields in LISTING_TYPE_OPTIONS (line 14-17):

```tsx
const LISTING_TYPE_OPTIONS = [
  { value: "TRANSFER" as const, label: "승계", desc: "현재 진행 중인 리스·렌트 계약을 넘기고 싶을 때" },
  { value: "USED_LEASE" as const, label: "중고 리스", desc: "만기 후 차량을 리스 조건으로 다시 내놓을 때" },
  { value: "USED_RENTAL" as const, label: "중고 렌트", desc: "만기 후 차량을 렌트 조건으로 다시 내놓을 때" },
];
```

- [ ] **Step 2: Update Step 0 subtitle**

Find step 0 subtitle (line 93) and replace:

```tsx
<p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
  번호판만 입력하면 30초 만에 차량 정보가 채워져요
</p>
```

- [ ] **Step 3: Update Step 1 subtitle**

Find step 1 subtitle (line 113) and replace:

```tsx
<p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
  자동 조회 결과가 맞는지 확인하고, 틀린 부분만 수정하세요
</p>
```

- [ ] **Step 4: Add Step 2 subtitle**

After step 2 heading `<h1>` (line 159), add subtitle:

```tsx
<p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
  정확한 정보일수록 매칭 속도가 빨라져요
</p>
```

- [ ] **Step 5: Update Step 5 subtitle**

After step 5 heading, add:

```tsx
<p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
  남은 계약 기간이 짧을수록 매칭이 빨라요
</p>
```

- [ ] **Step 6: Update Step 7 subtitle**

Replace step 7 subtitle (line 340):

```tsx
<p className="mt-1.5 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
  특이사항, 옵션, 승계 사유 등을 적으면 신뢰도가 올라가요
</p>
```

- [ ] **Step 7: Verify in browser**

Check: http://localhost:3000/sell — navigate through all 8 steps, verify updated text

- [ ] **Step 8: Commit**

```bash
git add src/features/sell/components/sell-wizard.tsx
git commit -m "feat(sell): enhance wizard guide text with benefits/timing"
```

---

## Task 13: /used — 전용 랜딩 페이지

**Files:**
- Modify: `src/app/(public)/used/page.tsx`

- [ ] **Step 1: Replace redirect with landing page**

Replace entire file:

```tsx
// src/app/(public)/used/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { VehicleCard } from "@/components/ui/vehicle-card";
import type { ListingCardData } from "@/types";

export const metadata: Metadata = {
  title: "중고 리스·렌트",
  description: "중고 리스와 렌트 매물을 월 납입금으로 비교하세요.",
};

export const dynamic = "force-dynamic";

const COMPARISON = [
  { category: "소유권", lease: "만기 시 인수 가능", rental: "반납 원칙" },
  { category: "세제 혜택", lease: "법인 비용처리 가능", rental: "법인 비용처리 가능" },
  { category: "보험·정비", lease: "개별 가입", rental: "렌트료에 포함" },
  { category: "계약 기간", lease: "24~60개월 (장기)", rental: "12~36개월 (유연)" },
  { category: "초기 비용", lease: "보증금 필요", rental: "보증금 또는 선납금" },
] as const;

const FAQS = [
  {
    q: "중고 리스란?",
    a: "이전 리스 이용자의 계약이 만료된 차량을 새로운 리스 조건으로 이용하는 것입니다. 신차 리스 대비 월 납입금이 저렴합니다.",
  },
  {
    q: "중고 렌트란?",
    a: "렌트 만기 차량을 새로운 렌트 조건으로 이용하는 것입니다. 보험·정비가 포함되어 관리 부담이 적습니다.",
  },
  {
    q: "승계와 뭐가 다른가요?",
    a: "승계는 기존 계약의 남은 기간을 그대로 이어받는 것이고, 중고 리스·렌트는 만기 차량으로 새 계약을 맺는 것입니다.",
  },
  {
    q: "세제 혜택은 어떻게 되나요?",
    a: "법인 또는 개인사업자의 경우 리스료·렌트료를 비용으로 처리할 수 있습니다. 세부 사항은 세무사와 상담하세요.",
  },
] as const;

async function getUsedListings(): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      type: { in: ["USED_LEASE", "USED_RENTAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  return listings.map((l) => ({
    id: l.id,
    type: l.type,
    brand: l.brand,
    model: l.model,
    year: l.year,
    trim: l.trim,
    mileage: l.mileage,
    monthlyPayment: l.monthlyPayment,
    initialCost: l.initialCost,
    remainingMonths: l.remainingMonths,
    isVerified: l.isVerified,
    accidentCount: l.accidentCount,
    mileageVerified: l.mileageVerified,
    viewCount: l.viewCount,
    favoriteCount: l.favoriteCount,
    primaryImage: l.images[0]?.url ?? null,
  }));
}

export default async function UsedPage() {
  const listings = await getUsedListings();

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="py-16 text-center">
        <h1
          className="text-3xl font-bold leading-tight md:text-4xl"
          style={{ color: "var(--chayong-text)" }}
        >
          중고 리스·렌트
          <br />
          <span style={{ color: "var(--chayong-primary)" }}>
            월 납입금부터 비교하세요
          </span>
        </h1>
        <p
          className="mt-4 text-base"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          새 차 리스 대비 부담 없는 월 납입금
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/list?type=USED_LEASE"
            className="inline-flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--chayong-primary)" }}
          >
            리스 매물 보기
          </Link>
          <Link
            href="/list?type=USED_RENTAL"
            className="inline-flex h-12 items-center rounded-xl border px-6 text-[15px] font-semibold transition-colors hover:bg-[var(--chayong-surface)]"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text)",
            }}
          >
            렌트 매물 보기
          </Link>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-8">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          리스 vs 렌트, 뭐가 다를까?
        </h2>
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--chayong-border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-text-sub)" }}>
                  구분
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-primary)" }}>
                  중고 리스
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--chayong-primary)" }}>
                  중고 렌트
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ category, lease, rental }) => (
                <tr
                  key={category}
                  className="border-t"
                  style={{ borderColor: "var(--chayong-divider)" }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--chayong-text)" }}>
                    {category}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--chayong-text-sub)" }}>
                    {lease}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--chayong-text-sub)" }}>
                    {rental}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Latest Listings */}
      {listings.length > 0 && (
        <section className="py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--chayong-text)" }}
            >
              최신 리스·렌트 매물
            </h2>
            <Link
              href="/list?type=USED_LEASE"
              className="text-sm font-medium"
              style={{ color: "var(--chayong-primary)" }}
            >
              전체보기 &gt;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <VehicleCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-8">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          자주 묻는 질문
        </h2>
        <div className="grid gap-4">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--chayong-divider)" }}
            >
              <h3
                className="font-semibold"
                style={{ color: "var(--chayong-text)" }}
              >
                {q}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--chayong-text-sub)" }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="my-8 rounded-2xl px-6 py-10 text-center"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          내 리스·렌트 차량을 등록해보세요
        </h2>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          무료로 등록하고, 관심 있는 구매자와 매칭되세요.
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          내 차 등록하기 &rarr;
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Verify in browser**

Check: http://localhost:3000/used
- Hero with two CTA buttons
- Comparison table
- Listings grid (if data exists)
- FAQ section
- Bottom CTA

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/used/page.tsx
git commit -m "feat(used): replace redirect with dedicated landing page"
```

---

## Task 14: Final verification

- [ ] **Step 1: Type check**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: 0 errors (or pre-existing only)

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: successful build

- [ ] **Step 4: Browser smoke test**

Check all pages:
- `/` — new section order, no mini cards, CTA at bottom
- `/list` — type tabs, sort dropdown, skeleton on load
- `/list?type=TRANSFER` — tab highlighted
- `/sell` — updated guide text
- `/used` — full landing page (not redirect)
- Mobile viewport (375px) — touch targets OK

---

## Summary

| Task | Area | Files | Est. |
|------|------|-------|------|
| 1 | Header | 1 modified | 2min |
| 2 | Footer | 1 modified | 2min |
| 3 | ListingSkeleton | 1 new | 3min |
| 4 | TypeTabs | 1 new | 3min |
| 5 | SortSelect | 1 new | 3min |
| 6 | ResultMeta + Sort | 1 modified | 3min |
| 7 | LIST page wiring | 1 modified | 3min |
| 8 | Pagination touch | 1 modified | 2min |
| 9 | Filter touch targets | 2 modified | 2min |
| 10 | SellCtaBanner | 1 new | 2min |
| 11 | HOME reorder | 1 modified | 5min |
| 12 | SELL guide text | 1 modified | 5min |
| 13 | /used landing | 1 modified | 5min |
| 14 | Verification | 0 | 5min |
