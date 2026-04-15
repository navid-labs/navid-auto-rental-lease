# Admin Pagination Infrastructure (PR-A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 3개 페이지(`/admin/leads|listings|escrow`)에 URL 기반 페이징과 상태 필터를 추가하고, 재사용 가능한 공통 유틸/UI 컴포넌트를 정착시킨다.

**Architecture:** 서버 컴포넌트 `searchParams`(Next 15 async Promise) 기반 — URL이 유일한 상태 소스. zod로 enum status 엄격 검증, 숫자 파라미터는 폴백 파싱. `LeadTable`의 클라이언트 탭 state는 제거하고 `<Link>` 네비게이션으로 이전해서 클라이언트/서버 이중 필터 충돌을 없앤다.

**Tech Stack:** Next.js 15 App Router, Prisma 6 + Supabase Postgres, zod ^4.3.6, Vitest, Playwright, shadcn/ui + Tailwind.

**Spec:** `docs/superpowers/specs/2026-04-16-admin-pagination-infrastructure-design.md`

---

## File Structure

**신규 파일 (공통 인프라)**:
- `src/lib/api/pagination.ts` — `parsePagination`, `paginationMeta`, `toURLSearchParams`
- `src/lib/api/validation.ts` — `validateQuery`
- `src/lib/api/admin-guard.ts` — `isValidUUID`, `requireAdmin` (PR-A 미사용, 선행 배포)
- `src/lib/api/pagination.test.ts`
- `src/lib/api/validation.test.ts`
- `src/lib/api/admin-guard.test.ts`

**신규 파일 (UI 컴포넌트)**:
- `src/features/admin/components/pagination-bar.tsx`
- `src/features/admin/components/status-filter-bar.tsx`
- `src/features/admin/components/admin-error-view.tsx`

**수정 파일**:
- `prisma/schema.prisma` — `EscrowPayment` `@@index([status, createdAt])` 추가
- `src/features/admin/components/lead-table.tsx` — `useState(activeTab)` 제거, 탭을 `Link` 기반 서버 네비게이션으로
- `src/app/admin/leads/page.tsx` — `searchParams` + 페이징 + status 검증
- `src/app/admin/listings/page.tsx` — `searchParams` + 페이징 + status 검증
- `src/app/admin/escrow/page.tsx` — `searchParams` + 페이징 + DISPUTED 필터
- `src/features/admin/components/admin-sidebar.tsx` — `/admin/settings` 링크 제거

**삭제 파일**:
- `src/app/api/admin/leads/route.ts` — 사용처 없는 GET 라우트

**E2E 인프라**:
- `.env.test` (신규, `.gitignore` 추가)
- `tests/e2e/helpers/admin-fixtures.ts` (신규) — Prisma 시드/정리 헬퍼
- `tests/e2e/helpers/global-setup.ts` (신규) — Supabase Admin API로 테스트 유저 보장 + storageState 생성
- `playwright.config.ts` — `globalSetup` 연결 + `storageState` 기본값
- `tests/e2e/admin-pagination.spec.ts` (신규) — 페이징/필터 시나리오

---

## Task 1: Prisma — `EscrowPayment` status 인덱스 추가

**Files:**
- Modify: `prisma/schema.prisma:237-239`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_add_escrow_status_index/migration.sql`

- [ ] **Step 1: `schema.prisma`에 인덱스 추가**

`EscrowPayment` 모델 마지막에 `@@index([status, createdAt])` 한 줄 추가:

```prisma
model EscrowPayment {
  // ... existing fields
  @@index([listingId])
  @@index([buyerId])
  @@index([sellerId])
  @@index([status, createdAt])
}
```

- [ ] **Step 2: 마이그레이션 생성**

Run: `bunx prisma migrate dev --name add_escrow_status_index --create-only`
Expected: `prisma/migrations/<timestamp>_add_escrow_status_index/migration.sql` 생성

- [ ] **Step 3: SQL에 `CONCURRENTLY` 추가**

`migration.sql`을 열어 자동 생성된 `CREATE INDEX ...` 줄을 다음으로 교체:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EscrowPayment_status_createdAt_idx"
ON "EscrowPayment"("status", "createdAt");
```

- [ ] **Step 4: 로컬 적용**

Run: `bunx prisma migrate dev`
Expected: "Database schema is up to date!" + Prisma client 재생성

- [ ] **Step 5: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add EscrowPayment (status, createdAt) index"
```

---

## Task 2: `pagination.ts` 유틸 + 테스트 (TDD)

**Files:**
- Create: `src/lib/api/pagination.test.ts`
- Create: `src/lib/api/pagination.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/api/pagination.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test src/lib/api/pagination.test.ts`
Expected: FAIL — "Cannot find module './pagination'"

- [ ] **Step 3: `pagination.ts` 구현**

`src/lib/api/pagination.ts`:

```ts
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
export type PaginationMeta = {
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

/** undefined 또는 빈 문자열 값을 제거하여 안전하게 URLSearchParams 생성 */
export function toURLSearchParams(
  obj: Record<string, string | undefined>
): URLSearchParams {
  const entries = Object.entries(obj).filter(
    ([, v]) => v != null && v !== ""
  ) as [string, string][];
  return new URLSearchParams(entries);
}

/** 폴백 기반 파싱 — 비숫자/음수/초과는 기본값으로 (never throw) */
export function parsePagination(params: URLSearchParams): Pagination {
  const parsed = paginationSchema.safeParse({
    page: params.get("page") ?? undefined,
    size: params.get("size") ?? undefined,
  });
  return parsed.success ? parsed.data : { page: 1, size: 20 };
}

export function paginationMeta(
  page: number,
  size: number,
  total: number
): PaginationMeta {
  return {
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/lib/api/pagination.test.ts`
Expected: 15개 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/pagination.ts src/lib/api/pagination.test.ts
git commit -m "feat(api): add pagination utility with zod-based parsing"
```

---

## Task 3: `validation.ts` 유틸 + 테스트 (TDD)

**Files:**
- Create: `src/lib/api/validation.test.ts`
- Create: `src/lib/api/validation.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/api/validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateQuery } from "./validation";

const schema = z.object({
  status: z.enum(["A", "B"]).optional(),
  name: z.string().optional(),
});

describe("validateQuery", () => {
  it("returns ok=true with parsed data on valid input", () => {
    const result = validateQuery(schema, new URLSearchParams("status=A"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("A");
  });

  it("returns ok=true with empty object when all optional fields missing", () => {
    const result = validateQuery(schema, new URLSearchParams(""));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({});
  });

  it("returns ok=false with 400 response on invalid enum", async () => {
    const result = validateQuery(schema, new URLSearchParams("status=INVALID"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("잘못된 요청입니다.");
      expect(body.details).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test src/lib/api/validation.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: `validation.ts` 구현**

`src/lib/api/validation.ts`:

```ts
import { z } from "zod";
import { NextResponse } from "next/server";

export function validateQuery<T>(
  schema: z.ZodType<T>,
  params: URLSearchParams
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const raw = Object.fromEntries(params);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "잘못된 요청입니다.", details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/lib/api/validation.test.ts`
Expected: 3개 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/validation.ts src/lib/api/validation.test.ts
git commit -m "feat(api): add validateQuery for strict zod schema checks"
```

---

## Task 4: `admin-guard.ts` 유틸 + 테스트 (TDD)

**Files:**
- Create: `src/lib/api/admin-guard.test.ts`
- Create: `src/lib/api/admin-guard.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/api/admin-guard.test.ts`:

```ts
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

  it("rejects whitespace", () => {
    expect(isValidUUID(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(false);
  });

  it("rejects SQL injection attempt", () => {
    expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test src/lib/api/admin-guard.test.ts`
Expected: FAIL

- [ ] **Step 3: `admin-guard.ts` 구현**

`src/lib/api/admin-guard.ts`:

```ts
import { requireRole, isAuthError } from "./auth-guard";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID v4 형식만 허용 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_RE.test(id);
}

/** ADMIN 역할 요구 — PR-B/C에서 동적 라우트에 재사용 */
export async function requireAdmin() {
  const auth = await requireRole("ADMIN");
  if (isAuthError(auth)) return auth;
  return { ok: true as const, auth };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test src/lib/api/admin-guard.test.ts`
Expected: 8개 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/admin-guard.ts src/lib/api/admin-guard.test.ts
git commit -m "feat(api): add admin-guard with UUID v4 validation"
```

---

## Task 5: `AdminErrorView` 컴포넌트

**Files:**
- Create: `src/features/admin/components/admin-error-view.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/admin/components/admin-error-view.tsx`:

```tsx
import Link from "next/link";

export function AdminErrorView({
  message,
  resetHref,
}: {
  message: string;
  resetHref?: string;
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col items-center gap-3"
      style={{
        backgroundColor: "#FEF2F2",
        border: "1px solid var(--chayong-danger)",
        color: "var(--chayong-danger)",
      }}
    >
      <p className="font-medium">{message}</p>
      {resetHref && (
        <Link
          href={resetHref}
          className="text-sm underline"
          style={{ color: "var(--chayong-danger)" }}
        >
          필터 초기화
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors (빈 환경에선 기존 빌드 통과)

- [ ] **Step 3: 커밋**

```bash
git add src/features/admin/components/admin-error-view.tsx
git commit -m "feat(admin): add AdminErrorView server component"
```

---

## Task 6: `PaginationBar` 컴포넌트

**Files:**
- Create: `src/features/admin/components/pagination-bar.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/admin/components/pagination-bar.tsx`:

```tsx
import Link from "next/link";
import { toURLSearchParams, type PaginationMeta } from "@/lib/api/pagination";

type Props = {
  pagination: PaginationMeta;
  basePath: string;
  preserveParams?: Record<string, string | undefined>;
};

const WINDOW = 2;

function buildHref(
  basePath: string,
  page: number,
  preserveParams: Record<string, string | undefined>
): string {
  const params = toURLSearchParams({
    ...preserveParams,
    page: page === 1 ? undefined : String(page),
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function PaginationBar({ pagination, basePath, preserveParams = {} }: Props) {
  const { page, total, totalPages } = pagination;

  const start = Math.max(1, page - WINDOW);
  const end = Math.min(totalPages, page + WINDOW);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const linkClass = (active: boolean, disabled: boolean) =>
    [
      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
      active
        ? "font-semibold"
        : disabled
        ? "pointer-events-none opacity-50"
        : "hover:bg-[var(--chayong-surface)]",
    ].join(" ");

  const linkStyle = (active: boolean) => ({
    borderColor: "var(--chayong-divider)",
    backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
    color: active ? "var(--chayong-primary)" : "var(--chayong-text)",
  });

  return (
    <nav
      aria-label="페이지네이션"
      className="flex items-center justify-between gap-4 py-4"
    >
      <p className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
        총 {total.toLocaleString("ko-KR")}건 · {page}/{totalPages} 페이지
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(basePath, 1, preserveParams)}
          className={linkClass(false, !hasPrev)}
          style={linkStyle(false)}
          aria-label="첫 페이지"
        >
          «
        </Link>
        <Link
          href={buildHref(basePath, Math.max(1, page - 1), preserveParams)}
          className={linkClass(false, !hasPrev)}
          style={linkStyle(false)}
          aria-label="이전 페이지"
        >
          이전
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(basePath, p, preserveParams)}
            aria-current={p === page ? "page" : undefined}
            className={linkClass(p === page, false)}
            style={linkStyle(p === page)}
          >
            {p}
          </Link>
        ))}
        <Link
          href={buildHref(basePath, Math.min(totalPages, page + 1), preserveParams)}
          className={linkClass(false, !hasNext)}
          style={linkStyle(false)}
          aria-label="다음 페이지"
        >
          다음
        </Link>
        <Link
          href={buildHref(basePath, totalPages, preserveParams)}
          className={linkClass(false, !hasNext)}
          style={linkStyle(false)}
          aria-label="끝 페이지"
        >
          »
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/features/admin/components/pagination-bar.tsx
git commit -m "feat(admin): add PaginationBar with aria + preserveParams"
```

---

## Task 7: `StatusFilterBar` 컴포넌트

**Files:**
- Create: `src/features/admin/components/status-filter-bar.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/admin/components/status-filter-bar.tsx`:

```tsx
import Link from "next/link";
import { toURLSearchParams } from "@/lib/api/pagination";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  current?: string;
  basePath: string;
  /** 보존할 추가 파라미터 — page는 내부에서 자동 제외 */
  preserveParams?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  value: string | undefined,
  preserveParams: Record<string, string | undefined>
): string {
  // page는 항상 드롭 (필터 변경 시 1페이지 리셋)
  const { page: _page, ...rest } = preserveParams;
  void _page;
  const params = toURLSearchParams({
    ...rest,
    status: value,
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function StatusFilterBar({
  options,
  current,
  basePath,
  preserveParams = {},
}: Props) {
  const chips = [{ value: undefined, label: "전체" }, ...options.map((o) => ({
    value: o.value,
    label: o.label,
  }))];

  return (
    <div className="flex gap-2 flex-wrap pb-4" role="group" aria-label="상태 필터">
      {chips.map((chip) => {
        const active = chip.value === current || (chip.value === undefined && !current);
        return (
          <Link
            key={chip.value ?? "__all__"}
            href={buildHref(basePath, chip.value, preserveParams)}
            aria-pressed={active}
            className="text-sm px-3 py-1.5 rounded-full border transition-colors"
            style={{
              borderColor: active ? "var(--chayong-primary)" : "var(--chayong-divider)",
              backgroundColor: active
                ? "var(--chayong-primary-light)"
                : "var(--chayong-bg)",
              color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/features/admin/components/status-filter-bar.tsx
git commit -m "feat(admin): add StatusFilterBar with aria-pressed chips"
```

---

## Task 8: `LeadTable` 클라이언트 필터 제거 + props 리팩터

**Files:**
- Modify: `src/features/admin/components/lead-table.tsx`

- [ ] **Step 1: 컴포넌트 재작성**

기존 `useState(activeTab)` 기반 탭 필터를 서버 URL 기반 `<Link>` 네비게이션으로 교체. `localLeads`/`openMenu` state는 인터랙션에 필요하므로 유지.

전체 파일을 다음으로 교체:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { toURLSearchParams } from "@/lib/api/pagination";

type Lead = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  note: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null };
  listing: { id: string; brand: string | null; model: string | null };
  assignee: { id: string; name: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  WAITING: "대기",
  CONSULTING: "상담중",
  CONTRACTED: "계약완료",
  CANCELED: "취소",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  WAITING: { bg: "#FFF7ED", color: "var(--chayong-warning)" },
  CONSULTING: { bg: "var(--chayong-primary-light)", color: "var(--chayong-primary)" },
  CONTRACTED: { bg: "#ECFDF5", color: "var(--chayong-success)" },
  CANCELED: { bg: "var(--chayong-surface)", color: "var(--chayong-text-caption)" },
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

const TABS = [
  { status: undefined, label: "전체" },
  { status: "WAITING", label: "대기" },
  { status: "CONSULTING", label: "상담중" },
  { status: "CONTRACTED", label: "계약완료" },
];

async function updateLeadStatus(id: string, status: string) {
  await fetch(`/api/admin/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

function buildTabHref(status: string | undefined): string {
  const params = toURLSearchParams({ status });
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export function LeadTable({
  leads,
  activeStatus,
}: {
  leads: Lead[];
  activeStatus?: string;
}) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    await updateLeadStatus(id, status);
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    setOpenMenu(null);
  };

  return (
    <div>
      {/* Tabs — server navigation */}
      <div
        className="flex gap-0 border-b mb-4"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {TABS.map(({ status, label }) => {
          const active = status === activeStatus;
          return (
            <Link
              key={status ?? "__all__"}
              href={buildTabHref(status)}
              aria-current={active ? "page" : undefined}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderBottomColor: active ? "var(--chayong-primary)" : "transparent",
                color: active ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--chayong-surface)" }}>
              {["매물", "고객", "타입", "상태", "담당자", "생성일", "액션"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: "var(--chayong-text-sub)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {localLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {activeStatus ? "선택한 필터에 맞는 리드가 없습니다." : "리드가 없습니다."}
                </td>
              </tr>
            ) : (
              localLeads.map((lead, i) => {
                const colors = STATUS_COLORS[lead.status] ?? STATUS_COLORS.CANCELED;
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderTop: i > 0 ? `1px solid var(--chayong-divider)` : undefined,
                      backgroundColor: "var(--chayong-bg)",
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--chayong-text)" }}>
                      {lead.listing.brand && lead.listing.model
                        ? `${lead.listing.brand} ${lead.listing.model}`
                        : "정보 미입력"}
                    </td>
                    <td className="px-4 py-3">
                      <p style={{ color: "var(--chayong-text)" }}>
                        {lead.user.name ?? lead.user.email}
                      </p>
                      {lead.user.phone && (
                        <p
                          className="text-xs"
                          style={{ color: "var(--chayong-text-caption)" }}
                        >
                          {lead.user.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "var(--chayong-surface)",
                          color: "var(--chayong-text-sub)",
                        }}
                      >
                        {TYPE_LABELS[lead.type] ?? lead.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--chayong-text-sub)" }}
                    >
                      {lead.assignee?.name ?? "미배정"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--chayong-text-caption)" }}
                    >
                      {new Date(lead.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === lead.id ? null : lead.id)
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: "var(--chayong-divider)",
                          color: "var(--chayong-text-sub)",
                          backgroundColor: "var(--chayong-bg)",
                        }}
                      >
                        상태 변경
                      </button>
                      {openMenu === lead.id && (
                        <div
                          className="absolute right-4 top-10 rounded-lg shadow-lg z-10 py-1 min-w-[120px]"
                          style={{
                            backgroundColor: "var(--chayong-bg)",
                            border: "1px solid var(--chayong-divider)",
                          }}
                        >
                          {Object.entries(STATUS_LABELS)
                            .filter(([k]) => k !== lead.status)
                            .map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => handleStatusChange(lead.id, k)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--chayong-surface)] transition-colors"
                                style={{ color: "var(--chayong-text)" }}
                              >
                                {v}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: grep으로 `useState.*activeTab` 제거 확인**

Run: `grep -rn "activeTab" src/features/admin/components/lead-table.tsx`
Expected: 출력 없음 (0 matches)

- [ ] **Step 3: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 4: 커밋**

```bash
git add src/features/admin/components/lead-table.tsx
git commit -m "refactor(admin): remove LeadTable client activeTab state"
```

---

## Task 9: `/admin/leads/page.tsx` 페이징 적용

**Files:**
- Modify: `src/app/admin/leads/page.tsx`

- [ ] **Step 1: 페이지 재작성**

전체 파일을 교체:

```tsx
import { z } from "zod";
import { LeadStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { LeadTable } from "@/features/admin/components/lead-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "상담 리드" };

const leadsQuerySchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(leadsQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          상담 리드
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/leads" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.ConsultationLeadWhereInput | undefined = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [leads, total] = await Promise.all([
    prisma.consultationLead.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, brand: true, model: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.consultationLead.count({ where }),
  ]);

  const serialized = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        상담 리드
      </h1>
      <LeadTable leads={serialized} activeStatus={validation.data.status} />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/leads"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 3: 수동 스모크 테스트**

Run: `bun dev`
- 브라우저에서 ADMIN 로그인 후 `/admin/leads` 접근 → 리드 목록 표시
- `/admin/leads?status=WAITING` → 필터링된 리드
- `/admin/leads?status=INVALID` → `<AdminErrorView>` 표시
- Ctrl+C로 dev 서버 종료

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/leads/page.tsx
git commit -m "feat(admin): paginate and filter /admin/leads"
```

---

## Task 10: `/admin/listings/page.tsx` 페이징 적용

**Files:**
- Modify: `src/app/admin/listings/page.tsx`

- [ ] **Step 1: 페이지 재작성**

```tsx
import { z } from "zod";
import { ListingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { ListingAdminTable } from "@/features/admin/components/listing-admin-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { StatusFilterBar } from "@/features/admin/components/status-filter-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "매물 관리" };

const ADMIN_VISIBLE_STATUSES: ListingStatus[] = ["PENDING", "ACTIVE", "HIDDEN"];

const listingsQuerySchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

const FILTER_OPTIONS = [
  { value: "PENDING", label: "승인대기" },
  { value: "ACTIVE", label: "활성" },
  { value: "HIDDEN", label: "숨김" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(listingsQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          매물 관리
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/listings" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.ListingWhereInput = validation.data.status
    ? { status: validation.data.status }
    : { status: { in: ADMIN_VISIBLE_STATUSES } };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.listing.count({ where }),
  ]);

  const serialized = listings.map((l) => ({
    id: l.id,
    type: l.type,
    status: l.status,
    brand: l.brand,
    model: l.model,
    isVerified: l.isVerified,
    createdAt: l.createdAt.toISOString(),
    seller: l.seller,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        매물 관리
      </h1>
      <StatusFilterBar
        options={FILTER_OPTIONS}
        current={validation.data.status}
        basePath="/admin/listings"
      />
      <ListingAdminTable listings={serialized} />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/listings"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/listings/page.tsx
git commit -m "feat(admin): paginate and filter /admin/listings"
```

---

## Task 11: `/admin/escrow/page.tsx` 페이징 + DISPUTED 필터

**Files:**
- Modify: `src/app/admin/escrow/page.tsx`

- [ ] **Step 1: 페이지 재작성**

```tsx
import { z } from "zod";
import { EscrowStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";
import { EscrowAdminTable } from "@/features/admin/components/escrow-admin-table";
import { PaginationBar } from "@/features/admin/components/pagination-bar";
import { StatusFilterBar } from "@/features/admin/components/status-filter-bar";
import { AdminErrorView } from "@/features/admin/components/admin-error-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "에스크로 관리" };

const escrowQuerySchema = z.object({
  status: z.nativeEnum(EscrowStatus).optional(),
  page: z.string().optional(),
  size: z.string().optional(),
});

const FILTER_OPTIONS = [
  { value: "PENDING", label: "미결제" },
  { value: "PAID", label: "결제완료" },
  { value: "RELEASED", label: "지급완료" },
  { value: "REFUNDED", label: "환불" },
  { value: "DISPUTED", label: "분쟁" },
];

export default async function AdminEscrowPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const urlParams = toURLSearchParams(sp);

  const validation = validateQuery(escrowQuerySchema, urlParams);
  if (!validation.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
          에스크로 관리
        </h1>
        <AdminErrorView message="잘못된 필터입니다." resetHref="/admin/escrow" />
      </div>
    );
  }

  const { page, size } = parsePagination(urlParams);
  const where: Prisma.EscrowPaymentWhereInput | undefined = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [escrows, total] = await Promise.all([
    prisma.escrowPayment.findMany({
      where,
      include: {
        listing: { select: { id: true, brand: true, model: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.escrowPayment.count({ where }),
  ]);

  const serialized = escrows.map((e) => ({
    id: e.id,
    status: e.status,
    totalAmount: e.totalAmount,
    paidAt: e.paidAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    listing: e.listing,
    buyer: e.buyer,
    seller: e.seller,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--chayong-text)" }}>
        에스크로 관리
      </h1>
      <StatusFilterBar
        options={FILTER_OPTIONS}
        current={validation.data.status}
        basePath="/admin/escrow"
      />
      <EscrowAdminTable escrows={serialized} />
      <PaginationBar
        pagination={paginationMeta(page, size, total)}
        basePath="/admin/escrow"
        preserveParams={{ status: validation.data.status }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/escrow/page.tsx
git commit -m "feat(admin): paginate /admin/escrow with DISPUTED filter"
```

---

## Task 12: 마이너 정리 — sidebar + 데드 라우트 삭제

**Files:**
- Modify: `src/features/admin/components/admin-sidebar.tsx:18`
- Delete: `src/app/api/admin/leads/route.ts`

- [ ] **Step 1: 사용처 grep으로 데드 라우트 확인**

Run: `grep -rn "api/admin/leads[\"']\|/api/admin/leads[\"']" src/ tests/ | grep -v "/\[id\]" | grep -v "route.ts"`
Expected: 출력 없음 (GET /api/admin/leads 호출처 0건)

- [ ] **Step 2: sidebar에서 `/admin/settings` 라인 제거**

`src/features/admin/components/admin-sidebar.tsx`의 line 18 (`{ href: "/admin/settings", ... }`) 전체 삭제. 쉼표 정리 포함.

- [ ] **Step 3: GET 라우트 파일 삭제**

Run: `rm src/app/api/admin/leads/route.ts`

- [ ] **Step 4: 타입 체크 + 빌드**

Run: `bun run type-check && bun run build 2>&1 | tail -20`
Expected: 0 errors, build 성공

- [ ] **Step 5: 커밋**

```bash
git add -A src/features/admin/components/admin-sidebar.tsx src/app/api/admin/leads/
git commit -m "chore(admin): remove /admin/settings link + unused GET route"
```

---

## Task 13: E2E 인프라 — `.env.test` + fixture 헬퍼

**Files:**
- Create: `.env.test` (gitignore)
- Modify: `.gitignore`
- Create: `tests/e2e/helpers/admin-fixtures.ts`

- [ ] **Step 1: `.gitignore`에 `.env.test`, storageState 추가**

`.gitignore` 파일 끝에 추가:

```
# E2E
.env.test
tests/e2e/.auth/
```

- [ ] **Step 2: `.env.test` 생성 (개발자 수동 값 채움)**

```bash
cat > .env.test <<'EOF'
TEST_ADMIN_EMAIL=e2e-admin@chayong.local
TEST_ADMIN_PASSWORD=<생성된 강력한 비밀번호>
SUPABASE_SERVICE_ROLE_KEY=<Supabase 프로젝트 → Settings → API → service_role key>
NEXT_PUBLIC_SUPABASE_URL=<동일 Settings → URL>
EOF
```

- [ ] **Step 3: fixture 헬퍼 작성**

`tests/e2e/helpers/admin-fixtures.ts`:

```ts
import { PrismaClient, type EscrowStatus } from "@prisma/client";

const prisma = new PrismaClient();

export type FixturePrefix = string;

export async function seedListings(
  sellerId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.listing.createMany({
    data: Array.from({ length: count }).map((_, i) => ({
      sellerId,
      type: "USED_LEASE" as const,
      status: i < 20 ? ("ACTIVE" as const) : ("PENDING" as const),
      brand: prefix,
      model: `모델-${i}`,
      monthlyPayment: 500000,
    })),
  });
}

export async function seedLeads(
  userId: string,
  listingId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.consultationLead.createMany({
    data: Array.from({ length: count }).map((_, i) => ({
      userId,
      listingId,
      status: i < 15 ? ("WAITING" as const) : ("CONSULTING" as const),
      note: `${prefix}-lead-${i}`,
      type: "USED_LEASE" as const,
    })),
  });
}

export async function seedEscrows(
  buyerId: string,
  sellerId: string,
  listingId: string,
  prefix: FixturePrefix,
  count = 25
) {
  return prisma.escrowPayment.createMany({
    data: Array.from({ length: count }).map((_, i) => {
      const status: EscrowStatus =
        i < 5 ? "DISPUTED" : i < 15 ? "PAID" : "RELEASED";
      return {
        buyerId,
        sellerId,
        listingId,
        status,
        totalAmount: 1000000 + i,
        paidAt: new Date(),
        releasedAt: status === "RELEASED" ? new Date() : null,
      };
    }),
  });
}

export async function cleanupByPrefix(prefix: FixturePrefix) {
  await prisma.consultationLead.deleteMany({
    where: { note: { startsWith: prefix } },
  });
  await prisma.escrowPayment.deleteMany({
    where: { listing: { brand: prefix } },
  });
  await prisma.listing.deleteMany({ where: { brand: prefix } });
}
```

- [ ] **Step 4: 헬퍼 import 검증**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 5: 커밋**

```bash
git add .gitignore tests/e2e/helpers/admin-fixtures.ts
git commit -m "test(e2e): add Prisma fixture helpers with cleanup by prefix"
```

**참고**: `.env.test`는 커밋 안 됨 — 개발자가 수동으로 값 채운 후 로컬에서만 사용.

---

## Task 14: E2E 인프라 — `globalSetup` + Playwright 연결

**Files:**
- Create: `tests/e2e/helpers/global-setup.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: `globalSetup` 작성**

`tests/e2e/helpers/global-setup.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { chromium, type FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const STORAGE_PATH = path.join(__dirname, "..", ".auth", "admin.json");

export default async function globalSetup(config: FullConfig) {
  const {
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL,
  } = process.env;

  if (
    !TEST_ADMIN_EMAIL ||
    !TEST_ADMIN_PASSWORD ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !NEXT_PUBLIC_SUPABASE_URL
  ) {
    throw new Error(
      "Missing .env.test: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  const supabaseAdmin = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1) idempotent — 유저 존재 시 비밀번호 업데이트, 없으면 생성
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === TEST_ADMIN_EMAIL);
  let userId: string;
  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: TEST_ADMIN_PASSWORD,
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
  }

  // 2) Profile 테이블에 ADMIN 역할 upsert
  const prisma = new PrismaClient();
  await prisma.profile.upsert({
    where: { id: userId },
    update: { role: "ADMIN" },
    create: {
      id: userId,
      email: TEST_ADMIN_EMAIL,
      role: "ADMIN",
    },
  });
  await prisma.$disconnect();

  // 3) 브라우저로 로그인 후 storageState 저장
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
  await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(?!login)/, { timeout: 15000 });

  await page.context().storageState({ path: STORAGE_PATH });
  await browser.close();
}
```

- [ ] **Step 2: `playwright.config.ts` 수정**

```ts
import { defineConfig, devices } from '@playwright/test'
import * as path from 'node:path'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: path.join(__dirname, 'tests/e2e/helpers/global-setup.ts'),
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: path.join(__dirname, 'tests/e2e/.auth/admin.json'),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

- [ ] **Step 3: 기존 `admin-guard.spec.ts` 비인증 테스트 회귀 방지**

`tests/e2e/admin-guard.spec.ts`는 `context.clearCookies()`로 비인증 상태를 강제로 만들기 때문에 storageState 기본값과 호환. 변경 불필요.

- [ ] **Step 4: `.env.test` 값 채운 후 globalSetup 수동 검증**

Run (로컬, dev 서버 별도 터미널에서 `bun dev`):
```bash
bunx playwright test tests/e2e/admin-guard.spec.ts --project=chromium
```
Expected: 기존 5개 테스트 PASS (storageState 적용 + clearCookies 호환 확인)

- [ ] **Step 5: `@supabase/supabase-js`, `dotenv` 설치 확인**

Run: `grep -E '"@supabase/supabase-js"|"dotenv"' package.json`
Expected: `@supabase/supabase-js` 존재. `dotenv` 없으면:

```bash
bun add -D dotenv
```

- [ ] **Step 6: 커밋**

```bash
git add tests/e2e/helpers/global-setup.ts playwright.config.ts package.json bun.lock 2>/dev/null || true
git commit -m "test(e2e): add globalSetup with Supabase admin bootstrap + storageState"
```

---

## Task 15: E2E 시나리오 — 페이징/필터/에지 케이스

**Files:**
- Create: `tests/e2e/admin-pagination.spec.ts`

- [ ] **Step 1: 시나리오 작성**

`tests/e2e/admin-pagination.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import {
  seedListings,
  seedLeads,
  seedEscrows,
  cleanupByPrefix,
} from "./helpers/admin-fixtures";

const prisma = new PrismaClient();

test.describe("Admin pagination & filters", () => {
  let workerPrefix: string;
  let adminProfileId: string;

  test.beforeAll(async ({}, testInfo) => {
    workerPrefix = `테스트-w${testInfo.workerIndex}`;
    const admin = await prisma.profile.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("ADMIN Profile not found — globalSetup failed?");
    adminProfileId = admin.id;

    await seedListings(adminProfileId, workerPrefix, 25);

    const buyer = await prisma.profile.findFirst({ where: { role: "BUYER" } });
    const seededListings = await prisma.listing.findMany({
      where: { brand: workerPrefix },
      take: 1,
    });
    if (buyer && seededListings[0]) {
      await seedLeads(buyer.id, seededListings[0].id, workerPrefix, 25);
      await seedEscrows(buyer.id, adminProfileId, seededListings[0].id, workerPrefix, 25);
    }
  });

  test.afterAll(async () => {
    await cleanupByPrefix(workerPrefix);
    await prisma.$disconnect();
  });

  // Done criteria [auto]
  test("listings page 2 with size 10 shows exactly 10 rows", async ({ page }) => {
    await page.goto("/admin/listings?page=2&size=10");
    await expect(page.locator("tbody > tr")).toHaveCount(10);
  });

  test("escrow DISPUTED filter shows seeded disputed rows only", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED");
    const chip = page.getByRole("link", { name: "분쟁" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("tbody > tr")).toHaveCount(5);
  });

  test("leads INVALID status shows AdminErrorView", async ({ page }) => {
    await page.goto("/admin/leads?status=INVALID");
    await expect(page.getByText("잘못된 필터입니다.")).toBeVisible();
    await expect(page.getByRole("link", { name: "필터 초기화" })).toBeVisible();
  });

  test("sidebar does not link to /admin/settings", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('a[href="/admin/settings"]')).toHaveCount(0);
  });

  test("GET /api/admin/leads returns 404", async ({ request }) => {
    const res = await request.get("/api/admin/leads");
    expect(res.status()).toBe(404);
  });

  // Happy path
  test("listings?page=9999 renders empty table + prev-only pagination", async ({ page }) => {
    await page.goto("/admin/listings?page=9999");
    await expect(page.locator("tbody > tr")).toHaveCount(1); // empty state row
  });

  test("listings page=abc falls back silently to page=1", async ({ page }) => {
    await page.goto("/admin/listings?page=abc");
    await expect(page.locator("tbody > tr").first()).toBeVisible();
  });

  test("leads empty status param shows all leads", async ({ page }) => {
    await page.goto("/admin/leads?status=");
    // 전체 chip active (서버 컴포넌트는 Link 첫 탭 active)
    await expect(page.getByRole("link", { name: "전체" }).first()).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  // Filter + pagination combination
  test("escrow DISPUTED + page=1 preserves filter across pagination", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED&page=1");
    const chip = page.getByRole("link", { name: "분쟁" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  test("changing filter resets page to 1", async ({ page }) => {
    await page.goto("/admin/escrow?status=PAID&page=2");
    await page.getByRole("link", { name: "분쟁" }).click();
    await expect(page).toHaveURL(/status=DISPUTED/);
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("전체 chip removes status param", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED");
    await page.getByRole("link", { name: "전체" }).click();
    await expect(page).toHaveURL(/\/admin\/escrow(\?.*)?$/);
    await expect(page).not.toHaveURL(/status=/);
  });

  // Accessibility
  test("pagination bar has aria-current on active page", async ({ page }) => {
    await page.goto("/admin/listings?page=2&size=10");
    const active = page.locator('nav[aria-label="페이지네이션"] [aria-current="page"]');
    await expect(active).toHaveText("2");
  });
});
```

- [ ] **Step 2: E2E 실행**

Run (dev 서버 가동 중):
```bash
bunx playwright test tests/e2e/admin-pagination.spec.ts --project=chromium
```
Expected: 모든 테스트 PASS

- [ ] **Step 3: 전체 E2E 회귀 확인**

Run: `bun run test:e2e`
Expected: 기존 + 신규 모두 PASS

- [ ] **Step 4: 커밋**

```bash
git add tests/e2e/admin-pagination.spec.ts
git commit -m "test(e2e): add admin pagination, filter, and edge case scenarios"
```

---

## Task 16: 최종 통합 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 품질 게이트**

Run: `bun run type-check && bun run lint && bun run test && bun run build`
Expected: 전부 PASS, 0 errors

- [ ] **Step 2: `activeTab` 잔존 확인**

Run: `grep -rn "activeTab" src/ tests/`
Expected: 출력 없음 (0 matches)

- [ ] **Step 3: 에지 케이스 매트릭스 수동 스모크 (로컬)**

`bun dev` 실행 후 브라우저에서 각 URL 직접 확인:
- `/admin/listings?page=9999` → 빈 테이블
- `/admin/leads?status=INVALID` → AdminErrorView
- `/admin/escrow?status=DISPUTED` → chip active + 필터링

Done 정의 (§11) `[auto]` 6개 전부 E2E로 검증됐음을 Task 15로 확인.

- [ ] **Step 4: 프로덕션 인덱스 배포 지시서 작성**

파일 불필요 — 배포 담당자에게 전달할 지시:

```
프로덕션 배포 시 순서:
1. 먼저 Supabase 대시보드 SQL Editor에서 실행:
   CREATE INDEX CONCURRENTLY IF NOT EXISTS "EscrowPayment_status_createdAt_idx"
   ON "EscrowPayment"("status", "createdAt");

2. 다음을 로컬에서 실행 (_prisma_migrations 동기화):
   bunx prisma migrate resolve --applied add_escrow_status_index

3. 이후 `prisma migrate status` → "Database schema is up to date!" 확인

4. 일반 배포 (Vercel etc) 진행
```

- [ ] **Step 5: 최종 커밋 (필요 시)**

이 단계에서 코드 변경 없음. 스킵.

---

## Self-Review

**1. Spec coverage**

| Spec 섹션 | 구현 Task |
|-----------|-----------|
| §2-1 `pagination.ts` | Task 2 |
| §2-2 `validation.ts` | Task 3 |
| §2-3 `admin-guard.ts` | Task 4 |
| §3 기존 페이지 3개 페이징 | Task 9, 10, 11 |
| §3-4 LeadTable 필터 제거 | Task 8 |
| §3-5 pagination-bar, status-filter-bar | Task 6, 7 |
| §3-1 AdminErrorView | Task 5 |
| §4 마이너 정리 | Task 12 |
| §5-1 EscrowPayment 인덱스 | Task 1 |
| §5-3 마이그레이션 단일화 | Task 1 + Task 16 (배포 지시서) |
| §6-1 단위 테스트 | Task 2, 3, 4 |
| §6-2 E2E 시드 헬퍼 | Task 13 |
| §6-3 ADMIN 로그인 전략 | Task 14 |
| §6-4 E2E 시나리오 | Task 15 |
| §8 에지 케이스 매트릭스 | Task 15 (대부분) + Task 2 (unit 폴백) |
| §11 Done 정의 [auto] | Task 15, 16 |

**2. Placeholder scan**
- "TBD" / "TODO" 없음 ✅
- "appropriate handling" / "similar to" 없음 ✅
- 모든 step에 실제 코드 또는 실행 명령 포함 ✅

**3. Type consistency**
- `Pagination`, `PaginationMeta` 타입 이름 전 Task 일관 (Task 2 정의, Task 6-11 import) ✅
- `parsePagination`, `paginationMeta`, `toURLSearchParams` 함수명 일관 ✅
- `PaginationBar`, `StatusFilterBar`, `AdminErrorView` 컴포넌트명 일관 ✅
- `validateQuery` 반환 형태 `{ ok, data | response }` Task 3에서 정의, Task 9-11에서 `validation.ok` 분기로 일관 사용 ✅

---

## Execution Handoff

플랜 완성 후 `docs/superpowers/plans/2026-04-16-admin-pagination-infrastructure.md`에 저장됨.

**두 가지 실행 옵션**:

**1. Subagent-Driven (권장)** — 각 Task마다 fresh 서브에이전트 디스패치 + Task 사이 리뷰 체크포인트
**2. Inline Execution** — 현재 세션에서 executing-plans로 배치 실행 + 체크포인트 리뷰

어느 쪽?
