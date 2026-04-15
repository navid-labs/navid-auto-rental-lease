# 관리자 페이지 페이징 인프라 설계안 (PR-A)

- **날짜**: 2026-04-16
- **리뷰 이력**: 1차 architect/critic → 2차 critic/code-reviewer. 총 3번 스펙 수정.
- **스코프**: 공통 페이징/검증/가드 유틸 + 기존 admin 3페이지에 페이징 적용 + EscrowStatus 필터 + 에스크로 status 인덱스 + 마이너 정리
- **스코프 외**:
  - PR-B — Profile 운영 필드(`suspendedAt`, `adminNotes`) + suspend/audit 엔드포인트
  - PR-C — 유저 중심 허브(`/admin/users`, `/admin/users/[id]`) — CS 볼륨/분쟁 발생 이후 재평가
  - 기타: middleware 세션 갱신, TrustBadge 통합, 마이페이지 실데이터, 번들 최적화
- **이전 스펙 대체**: `archive-2026-04-16-admin-pipeline-design-superseded.md` (B+C+D 통합 시도)

## 1. 배경 & 목적

현재 `/admin/leads`, `/admin/listings`, `/admin/escrow`는 모든 row를 limit 없이 로드한다. 데이터가 수천 건 쌓이면 TTFB 저하 + 메모리 압박. 분쟁 관리 도구(`EscrowStatus.DISPUTED` 필터)도 없다. `LeadTable`은 클라이언트 `useState` 기반 탭 필터링을 한다 — 페이징 도입 시 서버 URL 필터와 이중 상태 충돌 위험.

이 스펙은 **최소 침습**으로 세 페이지를 페이징화하고, **공통 유틸**을 정착시키며, `LeadTable`의 클라이언트 필터링을 서버 URL로 이전한다.

## 2. 공통 유틸 3개

### 2-1. `src/lib/api/pagination.ts`

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

/** undefined 값을 제거하여 안전하게 URLSearchParams를 생성 */
export function toURLSearchParams(
  obj: Record<string, string | undefined>
): URLSearchParams {
  const entries = Object.entries(obj).filter(
    ([, v]) => v != null && v !== ""
  ) as [string, string][];
  return new URLSearchParams(entries);
}

/** 폴백 기반 파싱 — 비숫자/음수/초과/중복키는 조용히 기본값으로 (never throw) */
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

**계약**:
- `parsePagination`은 **never throw** (사용자 입력 폴백)
- `toURLSearchParams`는 `undefined` / 빈 문자열 자동 제거
  - **제약**: "빈 문자열도 의미있는 값"인 필드(향후 검색어 `?q=` 빈 값 등)가 추가되면 이 유틸을 우회해야 함. 현재 PR-A 스코프(page/size/status)에서는 모두 안전.
- `URLSearchParams.get`은 **첫 값** 반환 (중복 key `?page=1&page=2` → `"1"`) — `params.getAll`이 아닌 `get` 고정
- 유저가 직접 `?status=` (빈 문자열) URL 입력 시: `toURLSearchParams`가 선제 제거 → `validateQuery`에 status 키 없음 → optional 통과 → 전체 조회. E2E 매트릭스로 이 경로 검증.
- `totalPages`: `total=0`이어도 `1` (Math.max 보정), UI는 0건 케이스 별도 처리

### 2-2. `src/lib/api/validation.ts`

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

**용도 구분 (필수)**:
- `parsePagination` — 폴백, never throw — **page/size만**
- `validateQuery` — 엄격, 잘못된 값은 400 — **enum 필터 (status 등) 전용**
- **혼용 금지**: status를 `as LeadStatus` 직접 캐스팅하는 패턴 금지. 반드시 `validateQuery` 경유.

### 2-3. `src/lib/api/admin-guard.ts`

```ts
import { NextResponse } from "next/server";
import { requireRole, isAuthError } from "./auth-guard";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID v4만 허용 (Prisma 기본 cuid/uuid 설정과 일치) */
export function isValidUUID(id: string): boolean {
  return UUID_V4_RE.test(id);
}

export async function requireAdmin() {
  const auth = await requireRole("ADMIN");
  if (isAuthError(auth)) return auth;
  return { ok: true as const, auth };
}
```

**PR-A에선 사용처 없음** — 단위 테스트만 포함. PR-B/C에서 재사용.

## 3. 기존 페이지 3개 페이징 적용

### 3-1. 공통 패턴 (`status` 엄격 검증 포함)

```ts
import { z } from "zod";
import { LeadStatus } from "@prisma/client";
import {
  parsePagination,
  paginationMeta,
  toURLSearchParams,
} from "@/lib/api/pagination";
import { validateQuery } from "@/lib/api/validation";

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
    return <AdminErrorView message="잘못된 필터입니다." />;
  }
  // AdminErrorView contract (신규):
  //   - 파일: src/features/admin/components/admin-error-view.tsx (서버 컴포넌트)
  //   - props: { message: string }
  //   - 레이아웃: 테이블 영역에 붉은 테두리 + 메시지 + "필터 초기화" Link (basePath로 이동)
  //   - 스타일: var(--chayong-danger) 계열, 기존 admin 페이지 여백 규칙 유지

  const { page, size } = parsePagination(urlParams);
  const where = validation.data.status
    ? { status: validation.data.status }
    : undefined;

  const [leads, total] = await Promise.all([
    prisma.consultationLead.findMany({
      where,
      include: { user: { ... }, listing: { ... }, assignee: { ... } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.consultationLead.count({ where }),
  ]);

  return (
    <LeadAdminView
      leads={serialized}
      pagination={paginationMeta(page, size, total)}
      activeStatus={validation.data.status}
    />
  );
}
```

**주의**:
- `validateQuery`는 잘못된 enum 값에 400 — 서버 컴포넌트에선 `notFound()` 대신 `<AdminErrorView>` 렌더
- `as` 캐스팅 **금지**
- "전체" 필터 = `status` 파라미터 **미포함** (빈 문자열 X, `ALL` 센티넬 X, `toURLSearchParams`가 빈 문자열 자동 제거)

### 3-2. `/admin/listings/page.tsx`

동일 패턴 + `ListingStatus` enum:
- 기본 `where: { status: { in: ["PENDING", "ACTIVE", "HIDDEN"] } }` 유지
- 추가 `?status=PENDING` 식으로 좁힘 (검증된 enum만)

### 3-3. `/admin/escrow/page.tsx`

동일 패턴 + **DISPUTED 포함 전체 EscrowStatus 필터 UI**. 테이블 위에 `<StatusFilterBar>` chip.

### 3-4. `LeadTable` 클라이언트 필터 제거 (회귀 포인트)

**현재**: `lead-table.tsx`가 `useState`로 `activeTab` 유지 + 필터링.
**변경**: `activeTab` state 제거. 탭 클릭 시 `<Link href={`/admin/leads?status=${s}`}>`로 서버 URL 이동. 탭 활성 상태는 서버 props `activeStatus`에서 결정.

→ 클라이언트/서버 이중 필터 충돌 제거.

**`"use client"` 유지 근거**: 상태변경 드롭다운(`handleStatusChange`), 행별 메뉴 토글(`openMenu`) 등 인터랙션 상태는 남아 있음 — 서버 컴포넌트 전환 불가. 탭 필터 state만 제거.

### 3-5. 공용 UI 컴포넌트 2개 (서버 컴포넌트)

**`src/features/admin/components/pagination-bar.tsx`**:
- props: `pagination: PaginationMeta`, `basePath: string`, `preserveParams: Record<string, string | undefined>`
- 레이아웃: `« 첫 · 이전 · 1 2 [3] 4 5 · 다음 · 끝 »` + `전체 M건 · P/T 페이지`
- 현재 페이지 ±2 윈도우
- `preserveParams`는 `toURLSearchParams`로 안전 처리
- `page > totalPages` 직접 URL 진입 시: 서버에서 clamp 없이 Prisma에 그대로 전달 (빈 배열 반환) → 빈 테이블 렌더 + pagination-bar는 "이전"만 활성, "다음" 비활성
- status-filter-bar의 `preserveParams`는 `page`를 **명시적으로 제외** (필터 변경 시 1페이지 리셋)
- pagination-bar의 `preserveParams`는 `status` 등 모든 필터 파라미터 **포함** (페이지 이동 시 필터 보존)
- `Link href` 방식, 클라이언트 JS 불필요
- `aria-current="page"` 현재 페이지에 설정
- 키보드 Tab 이동 자연 순서, 버튼/링크는 `focus-visible` 링
- `page > totalPages` 직접 URL 진입 시 빈 결과 렌더 + "이전" 버튼만 활성

**`src/features/admin/components/status-filter-bar.tsx`**:
- props: `options: { value: string; label: string }[]`, `current?: string`, `basePath: string`
- chip 형태, 현재 값 `aria-pressed="true"`
- **"전체" chip**: `href` 에 `status` 파라미터 없음 (`/admin/escrow` 그대로)
- 기타 chip: `?status=VALUE`
- **필터 변경 시 `page` 파라미터 드롭** (항상 1페이지부터)
- **페이지 번호 클릭 시 `status` 보존** (pagination-bar가 preserveParams로 처리)

## 4. 마이너 정리 (같은 PR)

- `src/app/api/admin/leads/route.ts` — **삭제** (GET, grep 재확인 필요: 사용처 없음 확인)
- `src/features/admin/components/admin-sidebar.tsx:18` — `/admin/settings` 데드 항목 제거

## 5. 인덱스 전략

### 5-1. EscrowPayment 인덱스 **추가**

```prisma
model EscrowPayment {
  // ... existing fields
  @@index([listingId])
  @@index([buyerId])
  @@index([sellerId])
  @@index([status, createdAt])  // NEW — DISPUTED 필터 + 기본 정렬
}
```

**근거**: 이 PR이 `EscrowPayment`에 **처음으로 status 기반 필터 쿼리**를 도입. 인덱스 없으면 테이블 전체 스캔 + filesort. 데이터 1건이라도 패턴 자체가 나쁜 상태로 들어가는 건 회귀 — 이번에 함께 추가.

### 5-2. Lead/Listing 인덱스 보류

- `ConsultationLead` — 기존 `@@index([status])`, `@@index([assignedTo, status])` 활용. `createdAt desc` filesort는 MVP 규모 허용.
- `Listing` — 기존 `@@index([type, status])`, `@@index([status, isVerified])` 부분 커버. 동일 결정.

**트리거**: 해당 테이블 1,000+ 건 또는 해당 페이지 p95 > 300ms 도달 시 별도 PR로 `@@index([status, createdAt])` 추가.

### 5-3. 마이그레이션 원본 단일화 (드리프트 방지)

1. 로컬: `bunx prisma migrate dev --name add_escrow_status_index` → SQL 파일 생성
2. 생성된 SQL을 `CREATE INDEX CONCURRENTLY`로 수정 (Prisma가 기본 생성하는 `CREATE INDEX`는 테이블 락 발생)
3. 프로덕션: Supabase 대시보드 SQL Editor에서 수정된 `CONCURRENTLY` DDL 직접 실행
4. **즉시** `bunx prisma migrate resolve --applied add_escrow_status_index` 실행 — `_prisma_migrations` 테이블에 수동 기록. 다음 `migrate deploy`가 재시도하지 않도록 방지
5. 이후 `prisma migrate status` 출력이 "database schema is up to date"인지 확인

## 6. 테스트

### 6-1. 단위 테스트 (Vitest)

**`src/lib/api/pagination.test.ts`**:

| 입력 | 기대 |
|------|------|
| 빈 params | `{ page: 1, size: 20 }` |
| `page=2` | `{ page: 2, size: 20 }` |
| `page=0` | `{ page: 1 }` (클램프) |
| `page=-1` | `{ page: 1 }` |
| `page=1.5` | `{ page: 1 }` (int 실패 → 폴백) |
| `page=abc` | `{ page: 1 }` (coerce 실패 → 폴백) |
| `page=` (빈 문자열) | `{ page: 1 }` |
| `page=Infinity` | `{ page: 1 }` |
| `size=0` | `{ size: 20 }` |
| `size=50` | `{ size: 50 }` (경계 통과) |
| `size=51` | `{ size: 20 }` (max 초과 → 폴백) |
| `?page=1&page=2` | `{ page: 1 }` (첫 값) |
| `paginationMeta(1, 20, 0)` | `totalPages: 1` |
| `paginationMeta(1, 20, 20)` | `totalPages: 1` |
| `paginationMeta(1, 20, 21)` | `totalPages: 2` |
| `toURLSearchParams({ a: "1", b: undefined, c: "" })` | `"a=1"`만 |

**`src/lib/api/validation.test.ts`**:
- 유효 enum → `{ ok: true, data }`
- 무효 enum → `{ ok: false, response.status === 400 }`, body에 `error === "잘못된 요청입니다."` (details는 non-empty만 assert, 구조 의존 금지)
- optional 필드 생략 → `{ ok: true, data: {} }`

**`src/lib/api/admin-guard.test.ts`**:
- `isValidUUID`: 유효 UUID v4 → true
- v1 UUID → false (v4만 허용 명시)
- v7 UUID → false
- 짧은/긴/공백/SQL injection → false

### 6-2. E2E 시드 전략 (격리)

**결정**: `prisma/seed.ts` 건드리지 않음. E2E 전용 fixture를 **테스트 파일 내 `beforeAll`에서 Prisma로 직접 주입** + `afterAll`에서 정리.

```ts
// tests/e2e/helpers/admin-fixtures.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seedPaginationFixtures(userId: string) {
  const listings = await prisma.listing.createMany({
    data: Array.from({ length: 25 }).map((_, i) => ({
      sellerId: userId,
      type: "USED_LEASE",
      status: i < 20 ? "ACTIVE" : "PENDING",
      brand: "테스트",
      model: `모델-${i}`,
      monthlyPayment: 500000,
    })),
  });
  // 유사하게 leads 25건, escrowPayments 25건 (5건만 DISPUTED)
  return listings;
}

export async function cleanupPaginationFixtures(prefix = "테스트") {
  await prisma.listing.deleteMany({ where: { brand: prefix } });
  // leads/escrow도 테스트 식별 필드로 정리
}
```

**대안 탈락**: 별도 `DATABASE_URL_E2E` 설정은 dev 환경 복잡도 증가 + Supabase 프로젝트 추가 필요. Fixture 헬퍼 방식이 MVP에 적합.

**병렬 안전**: Playwright `fullyParallel: true` + fixture는 **고유 prefix**(`테스트-${workerIndex}-${testName}`) 사용하여 워커 간 격리.

### 6-3. E2E ADMIN 로그인 전략

현재 `admin-guard.spec.ts`는 비인증 redirect만 테스트. 페이징 테스트는 **인증된 ADMIN 세션** 필요. 접근:

1. `prisma/seed.ts`가 이미 `admin@chayong.kr` Profile 생성 — Supabase Auth에는 별도 생성 필요
2. **Playwright `globalSetup`에서 Supabase Admin API로 테스트 ADMIN 계정 보장** (`supabase.auth.admin.createUser`) — 비밀번호 고정 (`.env.test`의 `TEST_ADMIN_PASSWORD`)
3. 각 테스트 `storageState` 사용 — `globalSetup`에서 로그인 후 쿠키 저장, 테스트는 storageState 재사용
4. storageState 파일은 `.gitignore`

**`.env.test`** (신규, `.gitignore`):
```
TEST_ADMIN_EMAIL=e2e-admin@chayong.local
TEST_ADMIN_PASSWORD=...
SUPABASE_SERVICE_ROLE_KEY=...  # admin.createUser 호출에 필수
NEXT_PUBLIC_SUPABASE_URL=...
```

CI (GitHub Actions/Vercel)에도 같은 3개 secret 등록 필수.

**globalSetup idempotency 패턴**:
```ts
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
const existing = users.find(u => u.email === TEST_ADMIN_EMAIL);
if (existing) {
  await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password: TEST_ADMIN_PASSWORD,
  });
} else {
  await supabaseAdmin.auth.admin.createUser({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    email_confirm: true,
  });
}
// Profile 테이블에 ADMIN 역할 보장 (upsert)
```

### 6-4. E2E 테스트 시나리오 (`tests/e2e/admin-pagination.spec.ts`)

정상 경로:
- `/admin/listings?page=2` 접근 → 21번째부터 표시, 총 5개 row (size=20, total=25)
- `/admin/escrow?status=DISPUTED` → 5건만 표시, 다른 chip 비활성, "DISPUTED" chip `aria-pressed=true`
- `/admin/leads` 탭 클릭 → URL `?status=WAITING` 이동 (client state 아닌 서버 navigation)

필터 + 페이징 조합:
- `/admin/listings?status=PENDING&page=2` → status 보존 + 2페이지 표시
- "전체" chip 클릭 → URL에서 status 파라미터 제거
- status 필터 변경 → page=1로 리셋

실패 경로:
- `/admin/listings?page=9999` → 빈 테이블 + pagination-bar "이전"만 활성, 200 응답
- `/admin/escrow?status=INVALID` → `<AdminErrorView>` "잘못된 필터입니다." 표시 (400과 대응)
- `/admin/listings?page=abc` → page=1 폴백 (에러 없음, parsePagination 동작)
- `/admin/leads?status=` (빈 문자열) → 전체 조회 (toURLSearchParams가 제거)

접근성:
- pagination-bar Tab 순서 자연, `aria-current` 적용
- status-filter-bar `aria-pressed` 토글
- 빈 결과 시 "~~가 없습니다" + 필터 있으면 "필터 해제" Link 추가

낙관적 PATCH + 페이징 상호작용:
- 페이지 2에서 PATCH → 페이지 1 이동 → 페이지 2 복귀 → 서버 재페치 최신화

Done 자동 검증:
- `locator('a[href="/admin/settings"]').toHaveCount(0)` (사이드바 정리)
- `page.request.get('/api/admin/leads')` → 404 (라우트 삭제)

### 6-5. 기존 테스트 유지

`admin-guard.spec.ts`, `navigation`, `auth`, `sell-wizard`, `detail` 회귀 방지.

## 7. 마이그레이션 순서

1. Prisma migration — `add_escrow_status_index` 생성 (CONCURRENTLY 수정 전)
2. 공통 유틸 3개 + 단위 테스트
3. UI 컴포넌트 2개 (`pagination-bar`, `status-filter-bar`)
4. `LeadTable` 클라이언트 필터 제거 + props 리팩터
5. `/admin/leads/page.tsx` 수정 + `LeadTable` props 업데이트
6. `/admin/listings/page.tsx` 수정 + `ListingAdminTable` props
7. `/admin/escrow/page.tsx` 수정 + `EscrowAdminTable` props + DISPUTED 필터
8. 마이너 정리 — sidebar 수정, `api/admin/leads/route.ts` 삭제
9. E2E fixture 헬퍼 + globalSetup ADMIN 로그인
10. E2E 시나리오 작성 (정상/실패/접근성/조합)
11. `bun run type-check && lint && test` (unit)
12. `bun run test:e2e`
13. `bun run build`
14. 프로덕션 DB — Supabase 대시보드에서 `CREATE INDEX CONCURRENTLY idx_escrow_status_createdat ON "EscrowPayment"(status, "createdAt")` 실행 후 `migrate deploy`

## 8. 에지 케이스 매트릭스 (자동 검증 필수)

| 입력 | 기대 | 테스트 레벨 |
|------|------|-------------|
| `?page=9999` (초과) | 빈 테이블, pagination "이전"만 활성, 200 | E2E |
| `?page=0` | page=1 폴백 | Unit |
| `?page=-1` | page=1 폴백 | Unit |
| `?page=1.5` | page=1 폴백 (int 실패) | Unit |
| `?page=abc` | page=1 폴백 | Unit |
| `?size=0` | size=20 폴백 | Unit |
| `?size=50` | size=50 (경계 통과) | Unit |
| `?size=51` | size=20 폴백 | Unit |
| `?status=` (빈 문자열) | `status` 파라미터 없음으로 처리 (toURLSearchParams 제거) | Unit + E2E |
| `?status=INVALID` | `<AdminErrorView>` 400 대응 | E2E |
| `?page=1&page=2` | page=1 (첫 값) | Unit |
| `?status=DISPUTED&page=2` | 필터 + 페이지 둘 다 보존 | E2E |
| 필터 chip 변경 | page=1 리셋 | E2E |
| 페이지 번호 클릭 | status 보존 | E2E |
| "전체" chip 클릭 | URL에서 status 파라미터 제거 | E2E |
| 빈 결과 + 필터 있음 | "필터 해제" CTA 노출 | E2E |
| 낙관적 PATCH → 페이지 이동 → 복귀 | 서버 재페치 최신화 | E2E |

## 9. UX 세부

- `force-dynamic` 유지 (기존 패턴)
- pagination-bar 로딩 중 표시: 서버 렌더라 skeleton 불필요 — `loading.tsx` 추가 고려 (§11 위험에 명시)
- 빈 결과 + 필터 있음: "선택한 필터에 맞는 항목이 없습니다. [필터 해제]"
- 빈 결과 + 필터 없음: 기존 테이블 메시지 유지
- URL 동기화로 뒤로가기/북마크 지원
- 페이지 번호 표시: `총 127건 · 2/7 페이지`
- 모바일: 모바일은 기존 테이블 구조 유지 (virtualization/카드화 PR-A 밖)

## 10. 위험 요소

| 위험 | 가능성 | 완화 |
|------|--------|------|
| `searchParams` Promise 시그니처 — 기존 페이지들 props 없음, 새로 추가만 | 낮 | breaking 없음 |
| zod ^4.3.6 — 이미 설치 확인 | 낮 | `z.nativeEnum` API 안정됨 |
| `CREATE INDEX CONCURRENTLY`를 Supabase에서 실행 중 중단 시 락 | 낮 | `CONCURRENTLY`는 락 최소, 실패 시 `DROP INDEX CONCURRENTLY` 후 재시도 |
| E2E fixture 병렬 레이스 | 중 | 워커별 고유 prefix로 격리 |
| Supabase Auth 테스트 계정 관리 | 중 | `globalSetup`에서 idempotent 보장 (존재 시 재사용) |
| `LeadTable` 리팩터로 기존 동작 회귀 | 중 | 탭 → Link 이동, 기존 상태 기반 동작 전부 제거 — 기존 테스트(`admin-guard.spec.ts`) + 신규 페이징 E2E로 커버 |
| `force-dynamic` + `loading.tsx` 상호작용 | 낮 | PR-A에선 `loading.tsx` 추가 안 함. Prisma count가 느리면 후속 PR에서 도입 |

## 11. Done 정의

- [ ] **[auto]** `/admin/listings?page=2&size=10` E2E → 정확히 10 row
- [ ] **[auto]** `/admin/escrow?status=DISPUTED` E2E → 시드된 5건만, chip 활성
- [ ] **[auto]** `/admin/leads?status=INVALID` E2E → `<AdminErrorView>` 표시
- [ ] **[auto]** `locator('a[href="/admin/settings"]').toHaveCount(0)` E2E
- [ ] **[auto]** `page.request.get('/api/admin/leads')` → 404
- [ ] **[auto]** `bun run type-check` / `lint` / `test` / `test:e2e` / `build` 순차 통과
- [ ] **[manual]** EscrowPayment `@@index([status, createdAt])` 프로덕션 적용 확인 (Supabase 대시보드 index list)
- [ ] **[manual]** `LeadTable` 클라이언트 탭 state 제거 확인 — grep으로 `useState.*activeTab` 없음

## 12. 후속 스펙 트리거

- **PR-B (Profile 운영 필드)** — 다음 브레인스토밍에서 설계. 분쟁 또는 악성 유저 케이스 1건 이상 발생 시 우선순위 상승.
- **PR-C (유저 허브)** — 아래 조건 중 하나 충족 시 재평가:
  - 월 CS 케이스 > 10건
  - 유저 수 > 500명
  - 분쟁 해결이 반복 패턴화 (Dispute 전용 모델 필요 명확)
- **인덱스 2차** (Lead/Listing `@@index([status, createdAt])`) — 해당 테이블 1,000+ 건 또는 p95 > 300ms 도달 시
