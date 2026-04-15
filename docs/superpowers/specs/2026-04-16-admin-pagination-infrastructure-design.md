# 관리자 페이지 페이징 인프라 설계안 (PR-A)

- **날짜**: 2026-04-16
- **스코프**: 공통 페이징/검증/가드 유틸 + 기존 admin 3페이지에 페이징 적용 + EscrowStatus 필터 + 마이너 정리
- **스코프 외**:
  - PR-B — Profile 운영 필드(`suspendedAt`, `adminNotes`) + suspend/audit 엔드포인트
  - PR-C — 유저 중심 허브(`/admin/users`, `/admin/users/[id]`) — CS 볼륨/분쟁 발생 이후 재평가
  - 기타: middleware 세션 갱신, TrustBadge 통합, 마이페이지 실데이터, 번들 최적화
- **이전 스펙 대체**: `2026-04-16-admin-pipeline-design.md` (B+C+D 통합 시도) — architect/critic 리뷰로 스코프 과다 확인, PR-A로 축소

## 1. 배경 & 목적

현재 `/admin/leads`, `/admin/listings`, `/admin/escrow`는 모든 row를 limit 없이 로드한다 (각 `page.tsx`에서 `prisma.*.findMany` 직호출). 데이터가 수천 건 쌓이면 TTFB 저하 + 메모리 압박이 발생한다. 분쟁 관리 도구(`EscrowStatus.DISPUTED` 필터)도 없다.

이 스펙은 **최소 침습**으로 세 페이지에 페이징을 더하고, 이후 스펙들이 재사용할 **공통 유틸(페이징/검증/가드)** 을 정착시킨다. 유저 허브/분쟁 모델 같은 큰 결정은 의도적으로 분리한다.

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

/** 폴백 기반 파싱 — 비숫자/음수/초과는 조용히 기본값으로 */
export function parsePagination(params: URLSearchParams): Pagination {
  const parsed = paginationSchema.safeParse({
    page: params.get("page") ?? undefined,
    size: params.get("size") ?? undefined,
  });
  return parsed.success ? parsed.data : { page: 1, size: 20 };
}

export function paginationMeta(page: number, size: number, total: number): PaginationMeta {
  return { page, size, total, totalPages: Math.max(1, Math.ceil(total / size)) };
}
```

**계약**:
- 모든 페이지 API/서버 컴포넌트가 공용
- `page`/`size`는 URLSearchParams 기반 (API route와 Next 15 server component의 `await searchParams` 결과 모두 수용)
- **COUNT는 항상 실행** — `totalPages` 계산이 admin UX에서 필수. skip 휴리스틱은 PR-C에서 재평가.
- 404 대응 없음 (빈 결과는 `{ data: [], pagination: { total: 0, totalPages: 1 } }`)

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

**용도 구분**: `parsePagination`은 **사용자 입력 폴백**(잘못된 page=abc도 1로 기본값), `validateQuery`는 **엄격 검증**(status=INVALID_ENUM → 400). 두 함수 용도가 다름을 각 호출부에서 명시.

### 2-3. `src/lib/api/admin-guard.ts`

`requireRole("ADMIN")`을 이미 `auth-guard.ts`가 제공하므로 **신규 추상화 없음**. 단, 이후 스펙에서 동적 `[id]` 라우트를 다룰 때 재사용할 얇은 유틸만 준비:

```ts
import { NextResponse } from "next/server";
import { requireRole, isAuthError } from "./auth-guard";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export async function requireAdmin() {
  const auth = await requireRole("ADMIN");
  if (isAuthError(auth)) return auth;
  return { ok: true as const, auth };
}
```

**현재 PR-A에선 사용처 없음** — 선행 배포 후 PR-B/C에서 활용. 유틸만 두고 단위 테스트 포함.

## 3. 기존 페이지 3개 페이징 적용

### 3-1. `/admin/leads/page.tsx`

**현재**: `findMany` 전체 로드, include 3개(user/listing/assignee), `orderBy: createdAt desc`.
**변경**:
- `searchParams: Promise<{ page?: string; status?: string }>` 시그니처
- `await searchParams` + `parsePagination(new URLSearchParams(…))`
- status 필터는 `validateQuery` + `LeadStatus` enum 스키마
- `Promise.all([findMany, count])` 병렬

```ts
// /admin/leads/page.tsx
export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams(sp as Record<string, string>);
  const { page, size } = parsePagination(params);

  const where = sp.status ? { status: sp.status as LeadStatus } : undefined;
  const [leads, total] = await Promise.all([
    prisma.consultationLead.findMany({
      where,
      include: { user: { … }, listing: { … }, assignee: { … } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.consultationLead.count({ where }),
  ]);

  return <LeadAdminView data={serialized} pagination={paginationMeta(page, size, total)} status={sp.status} />;
}
```

### 3-2. `/admin/listings/page.tsx`

동일 패턴. `where: { status: { in: ["PENDING", "ACTIVE", "HIDDEN"] } }` 유지, 추가 `status` 쿼리 파라미터로 좁힘 가능.

### 3-3. `/admin/escrow/page.tsx`

동일 패턴 + **DISPUTED 필터 추가**. 현재 escrow 페이지에 status 필터 UI 자체가 없음:
- URL `?status=DISPUTED` 등 쿼리 파라미터
- 테이블 위에 `StatusFilterBar` 컴포넌트 (chip 형태)
- `EscrowStatus` enum 전체 + "전체" 옵션

### 3-4. 공용 UI 컴포넌트 2개

**`src/features/admin/components/pagination-bar.tsx` (NEW)**:
- props: `pagination: PaginationMeta`, `basePath`, `preserveParams?: Record<string, string>`
- 레이아웃: `이전 · 1 2 3 ... N · 다음` + "전체 M건" 텍스트
- 현재 페이지 ±2개 + 첫/끝 페이지 표시
- `Link href=` 방식 (client router 불필요)

**`src/features/admin/components/status-filter-bar.tsx` (NEW)**:
- props: `options: { value: string; label: string }[]`, `current?: string`, `basePath: string`
- chip 형태, 현재 값 강조
- Link 방식 (페이지 리셋: `?status=X`로 이동 시 page 파라미터 드롭)

두 컴포넌트 서버 컴포넌트로 구현 (client 상태 불필요).

## 4. 마이너 정리 (같은 PR)

- `src/app/api/admin/leads/route.ts` — **삭제** (GET, 사용처 없음 — sidebar:15 label만 참조 확인, fetch 호출 없음)
- `src/features/admin/components/admin-sidebar.tsx:18` — `/admin/settings` 데드 항목 제거

## 5. 테스트

### 5-1. 단위 (Vitest)

**`src/lib/api/pagination.test.ts`** (신규):
- 기본값 (빈 params → page=1, size=20)
- 클램프: `page=0` → 1, `size=100` → 50
- 비숫자: `page=abc` → 1 (폴백)
- `paginationMeta`: total=0 → totalPages=1, total=25+size=10 → totalPages=3

**`src/lib/api/validation.test.ts`** (신규):
- 유효 enum → `{ ok: true, data }`
- 무효 enum → `{ ok: false, response.status === 400 }`

**`src/lib/api/admin-guard.test.ts`** (신규):
- `isValidUUID`: 유효 UUID v4, 소문자 v4, 대문자 v4 → true
- 잘못된 형식 (짧음, 공백, SQL injection 시도) → false

### 5-2. E2E (Playwright)

**`tests/e2e/admin-pagination.spec.ts`** (신규, ADMIN 시드 계정 전제):
- `/admin/listings?page=2` 접근 → 21번째부터 표시
- `/admin/escrow?status=DISPUTED` → 분쟁 건만
- `/admin/escrow?status=INVALID` → 빈 결과 또는 400 (`validateQuery` 동작 확인)
- `/admin/leads` 20건 초과 시드 → "다음" 버튼 클릭 → URL `?page=2`

### 5-3. 기존 유지

`admin-auth.spec.ts`, `navigation`, `auth`, `sell-wizard` 회귀 방지만.

## 6. 마이그레이션 순서

1. 공통 유틸 3개 + 단위 테스트 (`pagination.ts`, `validation.ts`, `admin-guard.ts`)
2. UI 컴포넌트 2개 (`pagination-bar`, `status-filter-bar`)
3. `/admin/leads/page.tsx` 수정 + 해당 테이블 props 시그니처 업데이트
4. `/admin/listings/page.tsx` 수정
5. `/admin/escrow/page.tsx` 수정 + DISPUTED 필터 UI
6. 마이너 정리 — 사이드바 수정, `api/admin/leads/route.ts` 삭제
7. E2E 추가 (시드 계정 필요 — `prisma/seed.ts`에 ADMIN 유저 + 25+ leads/listings/escrow 생성)
8. `bun run type-check && bun run lint && bun run test && bun run test:e2e`
9. `bun run build` 성공

## 7. 인덱스 전략 — **이번엔 추가 안 함**

기존 인덱스가 PR-A 쿼리를 커버하는지 검증:

| 쿼리 | 기존 인덱스 | 필요 추가 |
|------|-------------|-----------|
| `ConsultationLead.findMany({ orderBy: createdAt desc, skip, take })` | `@@index([status])`, `@@index([assignedTo, status])` | createdAt 정렬만 하는 무필터 쿼리는 인덱스 없이 full scan. 단, **데이터 규모 ~100건 이하 MVP 단계라 허용**. |
| `Listing.findMany({ where: { status: { in } }, orderBy: createdAt desc })` | `@@index([type, status])`, `@@index([status, isVerified])` | 부분 커버됨. createdAt DESC는 filesort. 허용. |
| `EscrowPayment.findMany({ where: { status }, orderBy: createdAt desc })` | `@@index([buyerId])`, `@@index([sellerId])` | **status 필터에 인덱스 없음** — 신규 `@@index([status, createdAt])` 추가 고려. MVP 규모면 보류. |

**결정**: PR-A에선 인덱스 추가 보류. 데이터 1000+ 건 도달 시 별도 PR로 `@@index([status, createdAt])` × 3 추가.

## 8. 성능 & UX 세부

- `force-dynamic` 유지 (기존 패턴)
- 페이징 바: 현재/전체 + 이전/다음 + 첫/끝 (5개 페이지 번호 window)
- 상태 필터 변경 시 페이지 파라미터 드롭 (항상 1페이지부터)
- URL 동기화로 뒤로가기/북마크 지원
- 빈 결과: 기존 테이블의 "~~가 없습니다" 메시지 유지

## 9. 위험 요소

| 위험 | 완화 |
|------|------|
| `searchParams` Promise 시그니처 변경 — 기존 시그니처 없음 (페이지들은 props 안 받음) | 새로 추가만, breaking 없음 |
| zod ^4.3.6 런타임 동작 — 이미 설치 ✅ | 기존 사용처 검색 후 API 변경 확인 |
| `EscrowStatus` enum import — `@prisma/client`에서 export됨 | 기존 `LeadStatus` import 패턴 재사용 |
| 공용 컴포넌트가 `Link` 기반이라 관리자 JS 비활성 환경도 동작 | 추가 검증 불필요 |
| 마이너 정리 (파일 삭제/sidebar 변경)로 인한 회귀 | 해당 라우트/링크 grep으로 사용처 0건 재확인 |

## 10. 수용 조건 (Done 정의)

- [ ] 3개 관리자 페이지가 `?page=N&status=X` 기반으로 동작
- [ ] 페이지 당 기본 20건, size 파라미터로 최대 50건까지
- [ ] 에스크로 페이지에 `DISPUTED` 포함 전체 상태 필터
- [ ] `bun run type-check` / `lint` / `test` / `test:e2e` / `build` 전부 통과
- [ ] sidebar에서 `/admin/settings` 제거됨
- [ ] `GET /api/admin/leads` 라우트 파일 삭제됨

## 11. 후속 스펙 트리거

- **PR-B (Profile 운영 필드)** — 다음 브레인스토밍에서 설계. 분쟁 또는 악성 유저 케이스 1건 이상 발생 시 우선순위 상승.
- **PR-C (유저 허브)** — 아래 조건 중 하나 충족 시 재평가:
  - 월 CS 케이스 > 10건
  - 유저 수 > 500명
  - 분쟁 해결이 반복 패턴화 (Dispute 전용 모델 필요 명확)
