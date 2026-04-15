# 관리자 파이프라인 허브 설계안

- **날짜**: 2026-04-16
- **스펙 범위**: B (유저 허브) + C (4탭 파이프라인) + D (페이징 계약)
- **제외 범위**: middleware 세션 갱신, TrustBadge 통합, 마이페이지 실데이터, 번들 최적화 (각각 후속 스펙)
- **선행**: 크리틱 에이전트 리뷰 반영 (2026-04-16)

## 1. 배경 & 목적

관리자 운영은 두 축으로 나뉜다: (1) **객체 중심** — "대기 중인 승인 전체", (2) **유저 중심** — "이 사람은 누구이며 어떤 활동을 했는가". 현재 admin은 객체 중심 뷰(`/admin/leads`, `/admin/listings`, `/admin/escrow`)만 있고 유저 중심 뷰가 없어 CS/분쟁 대응 시 유저의 전체 컨텍스트를 파악하기 어렵다.

이 스펙은 유저 중심 허브(`/admin/users`, `/admin/users/[id]`)를 신설하고, 기존 객체 중심 페이지에 페이징을 적용해 규모 확장성을 확보한다.

## 2. 아키텍처

### 2-1. 페이지 구조

```
/admin
  ├─ /admin/page.tsx           (대시보드 — 변경 없음)
  ├─ /admin/users              (NEW — 유저 목록 + 검색 + 페이징)
  ├─ /admin/users/[id]         (NEW — 유저 상세 + 4개 탭)
  ├─ /admin/leads              (페이징 추가)
  ├─ /admin/listings           (페이징 추가)
  └─ /admin/escrow             (페이징 + DISPUTED 필터 추가)
```

### 2-2. 두 축의 병존

객체 중심 페이지와 유저 중심 허브는 **병존**한다 (대체 아님). 업무 패턴이 교차하므로 상호 링크로 양방향 연결한다:

- 기존 테이블의 유저명 셀 → `/admin/users/[userId]` 링크
- 유저 상세 탭의 각 객체 → 기존 상세/수정 액션으로 연결

### 2-3. 유저 상세 탭 구성

탭은 실제 스키마 관계를 그대로 반영한다 (`transactions` 같은 가상 합성 엔터티 금지):

| 탭 | 데이터 소스 | 쿼리 |
|----|-------------|------|
| 매물 | `Listing` | `where: { sellerId }` |
| 상담 | `ConsultationLead` | `where: { userId }` |
| 채팅 | `ChatRoom` | `where: { OR: [{ buyerId }, { sellerId }] }` |
| 결제 | `EscrowPayment` | `where: { OR: [{ buyerId }, { sellerId }] }` |

**거래 완료의 단일 정의**: `EscrowPayment.status === "RELEASED"`.

**Disputes 탭 없음** — Dispute 전용 모델이 없으므로 placeholder 탭은 데드 UI다. 분쟁은 결제 탭 내부 `status=DISPUTED` 필터 칩으로 처리하고, 전용 워크플로우는 후속 스펙에서 별도로 설계한다.

### 2-4. 데이터 흐름

- `/admin/users` 목록: 서버 컴포넌트에서 Prisma 직접 호출 (API 라우트 불필요)
- `/admin/users/[id]` 상세 기본 로드: Profile + `_count` 7종만
- 탭 컨텐츠: 클라이언트에서 `GET /api/admin/users/[id]/{listings|leads|chat-rooms|escrow}?page=N` lazy fetch
- 기존 `/admin/{leads|listings|escrow}` 페이지: 서버 컴포넌트에서 `searchParams.page` 읽어 페이징

## 3. 페이징 계약

### 3-1. Offset 기반

관리자 UX는 "3페이지로 점프", "전체 N건" 표시가 필수. Cursor는 인피니트 스크롤용으로 부적합.

### 3-2. 공통 유틸 `src/lib/api/pagination.ts`

```ts
export type PaginationParams = { page: number; size: number };
export type PaginationMeta = {
  page: number;
  size: number;
  total: number | null;
  totalPages: number | null;
};

export function parsePagination(searchParams: URLSearchParams): PaginationParams;
export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta
): { data: T[]; pagination: PaginationMeta };
```

**계약**:
- `page < 1` → 1로 클램프
- `size > 50` → 50으로 클램프
- `size < 1` 또는 누락 → 기본 20
- 비숫자/음수 입력 → 기본값 폴백 (never throw) — 내부적으로 `paginationSchema.safeParse` 사용하지만 실패 시 기본값 반환
- 엄격 검증이 필요한 라우트(상태 enum 등)는 `validateSearchParams` 별도 사용 → 400 응답

### 3-3. COUNT 전략

| 상황 | 전략 |
|------|------|
| 첫 페이지 + 결과 < size | COUNT 생략, `total = rows.length` |
| 그 외 | `Promise.all([findMany, count])` 병렬 |
| 검색어 있음 | 항상 COUNT 실행 (페이지 수 표시) |

### 3-4. 검색 전략 (유저 허브)

단일 검색창에서 email/name/phone OR 매치:

| 필드 | 방식 | 인덱스 |
|------|------|--------|
| email | `startsWith` (대소문자 무시) | `@unique` 재사용 |
| name | `contains` (대소문자 무시) | Profile 규모 작음 → 초기 무인덱스 |
| phone | `contains` | 동일 |

클라이언트 debounce 300ms, 2자 미만 입력 시 검색 비활성, URL `?q=`로 동기화.

### 3-5. 응답 형태

모든 페이징 API 일관 포맷:

```json
{
  "data": [...],
  "pagination": { "page": 1, "size": 20, "total": 127, "totalPages": 7 }
}
```

Date는 ISO string, relation은 `select`로 필드 명시 (과도한 payload 차단).

## 4. 데이터 모델 & 인덱스

### 4-1. Prisma 스키마 변경

성능 크리티컬한 복합 인덱스 7개 추가:

```prisma
model ConsultationLead {
  @@index([userId, createdAt])
  @@index([status, createdAt])
}

model ChatRoom {
  @@index([buyerId, updatedAt])
  @@index([sellerId, updatedAt])
}

model EscrowPayment {
  @@index([buyerId, createdAt])
  @@index([sellerId, createdAt])
  @@index([status, createdAt])
}
```

**근거**: 모든 쿼리가 `WHERE fk ORDER BY ts DESC LIMIT N` 패턴. 복합 인덱스 없으면 full scan + filesort.

**마이그레이션**:
- 개발/프리뷰: `bun run db:push`
- 프로덕션: Supabase 대시보드에서 `CREATE INDEX CONCURRENTLY` (락 없이)

### 4-2. 유저 상세 기본 로드

```ts
// /admin/users/[id]/page.tsx (Server Component)
const [profile, counts] = await Promise.all([
  prisma.profile.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
  }),
  prisma.profile.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          listings: true,
          leads: true,
          chatRoomsAsBuyer: true,
          chatRoomsAsSeller: true,
          escrowAsBuyer: true,
          escrowAsSeller: true,
          favorites: true,
        },
      },
    },
  }),
]);
```

첫 렌더 예산: < 200ms. 7개 `_count`는 복합 인덱스로 각 인덱스 스캔, 병렬 실행.

## 5. API 라우트 & 보안

### 5-1. 신규 API (4개)

| 경로 | 메서드 | 용도 |
|------|--------|------|
| `/api/admin/users/[id]/listings` | GET | 매물 탭 |
| `/api/admin/users/[id]/leads` | GET | 상담 탭 |
| `/api/admin/users/[id]/chat-rooms` | GET | 채팅 탭 |
| `/api/admin/users/[id]/escrow` | GET | 결제 탭 |

### 5-2. 3중 검증 가드 — `src/lib/api/admin-guard.ts` (NEW)

```ts
export async function requireAdminForUser(userId: string) {
  const auth = await requireRole("ADMIN");         // (1) 인증 + ADMIN 역할
  if (isAuthError(auth)) return auth;

  if (!isValidUUID(userId)) {                      // (2) UUID 형식
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const exists = await prisma.profile.findUnique({ // (3) 존재 확인
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return { auth, userId };
}
```

**IDOR 원칙**: 모든 서브 라우트가 **각자** `requireAdminForUser` 호출. 부모 레이아웃의 인증에 의존하지 않는다.

### 5-3. 표준 라우트 템플릿

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requireAdminForUser(id);
    if (guard instanceof NextResponse) return guard;

    const { page, size } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * size;
    const where = { sellerId: id };

    const [data, total] = await Promise.all([
      prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(data, {
        page, size, total, totalPages: Math.ceil(total / size),
      })
    );
  } catch (error) {
    console.error("GET /api/admin/users/[id]/listings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
```

### 5-4. Zod 입력 검증 — `src/lib/api/validation.ts` (NEW)

```ts
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
});
```

`parsePagination`이 내부적으로 사용. 기존 파이프라인 페이지의 status 필터도 enum zod 스키마로 검증.

### 5-5. 에러 처리 표준

| 상황 | 상태 | 응답 |
|------|------|------|
| 인증 실패 | 401 | `{ error: "인증이 필요합니다." }` |
| 권한 부족 | 403 | `{ error: "권한이 없습니다." }` |
| 잘못된 입력 | 400 | `{ error, details? }` |
| 유저 없음 | 404 | `{ error: "User not found" }` |
| 서버 오류 | 500 | `{ error: "서버 오류가 발생했습니다." }` + `console.error` |

### 5-6. Rate Limiting

초기엔 생략 (admin 사용자 수 소수, 외부 노출 없음). SWR 캐싱 + 300ms debounce로 자연스럽게 제어. 후속 스펙에서 `@upstash/ratelimit` 도입 여지.

### 5-7. 기존 라우트 정리

- `GET /api/admin/leads/route.ts` — **삭제** (사용처 없음, 응답 형태 불일치)
- `PATCH /api/admin/{leads|listings|escrow}/[id]/route.ts` — **유지** (이미 잘 구현됨)

## 6. UX 설계

### 6-1. 유저 목록 (`/admin/users`)

| 컬럼 | 내용 |
|------|------|
| 이름/이메일 | 2줄 (이름 bold + email muted), 이름 없으면 email만 |
| 역할 뱃지 | BUYER/SELLER/DEALER/ADMIN 색상 구분 |
| 활동 요약 | "매물 3 · 상담 1 · 결제 0" (단순 텍스트, 딥링크 없음 — `상세 →` 버튼이 유일한 진입점) |
| 가입일 | 상대 시간 + 툴팁 절대 시간 |
| 액션 | `상세 →` 버튼 (행 전체 클릭 금지 — 실수 방지) |

**검색/상태**:
- Debounce 300ms, 2자 이상 활성
- URL `?q=` 동기화
- "검색 결과 N건 / 전체 M건"
- Skeleton rows + shimmer
- 0건 → "일치하는 유저 없음" + 검색 리셋 CTA

### 6-2. 유저 상세 (`/admin/users/[id]`)

**헤더**: 이름/역할 뱃지/이메일/전화/가입일(상대+절대).

**탭 네비게이션**:
- 카운트 뱃지: `매물 (3)` 등
- 카운트 0이면 탭 비활성 (회색, 클릭 불가) — 빈 탭 방황 방지
- 활성 탭: `var(--chayong-primary)` underline
- URL `?tab=listings` 동기화, shallow routing

**탭 컨텐츠**:
- 초기 진입: 기본 탭(매물) 서버 사이드 렌더 → TTFB 빠름
- 탭 전환: `useSWR` + suspense → skeleton 즉시 표시
- 캐시 키: `/api/admin/users/${id}/${tab}?page=${page}` — 되돌아갈 때 재요청 없음
- `revalidateOnFocus: true` — 다른 탭에서 변경된 데이터 반영

### 6-3. 접근성 & 반응형

- 탭 ARIA: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`
- 키보드: ←/→ 전환, Enter/Space 활성
- 포커스 링: `focus-visible:ring-2 ring-[var(--chayong-primary)]`
- 모바일: 테이블을 카드형으로 전환 (`md:table-row` / `max-md:block`)
- 한국어 overflow: `truncate` + `title` 속성

### 6-4. 데이터 Freshness

- admin 페이지 `force-dynamic` 유지
- PATCH 액션 후: optimistic update + `router.refresh()` (현재 optimistic만 있음 → 보강)

## 7. 최적화

| 이슈 | 처리 |
|------|------|
| 초기 7개 `_count` 쿼리 | 복합 인덱스 → 각 <10ms, 병렬 |
| 탭 전환 리렌더 | SWR 캐시 + shallow routing |
| 대량 매물 보유 셀러 | 탭 내부 페이징 size=20 + 총 개수 |
| 중복 Profile 조회 | 페이지 컴포넌트 `React.cache()` 래핑 |
| COUNT 병목 | 섹션 3-3 skipCount 휴리스틱 |
| 목록 N+1 | `_count`를 Prisma select로 한 번만 |
| 테이블 렌더 (50행 × 4탭) | virtualization 불필요 (50행 이내) |
| 번들 크기 | 탭 컨텐츠 컴포넌트는 `next/dynamic` |

**성능 예산**:
- `/admin/users`: TTFB < 300ms, LCP < 1.2s
- `/admin/users/[id]`: TTFB < 200ms, LCP < 1.0s
- 탭 전환: < 400ms (네트워크 + 렌더)

## 8. 테스트 전략

### 8-1. 단위 테스트 (Vitest)

- `src/lib/api/pagination.test.ts`: parsePagination 클램프/파싱, paginatedResponse, zod schema
- `src/lib/api/admin-guard.test.ts`: 비ADMIN 403, 비로그인 401, invalid UUID 400, 없는 유저 404, 정상 케이스 (Prisma mock)

### 8-2. E2E 테스트 (Playwright) — `tests/e2e/admin-pipeline.spec.ts`

1. **유저 목록 페이징/검색**: 20건 표시, 2페이지 점프, URL 동기화, 검색 debounce
2. **유저 상세 탭 전환**: 기본 탭, URL `?tab=`, 0카운트 탭 비활성
3. **IDOR 가드**: 비ADMIN 403, 비로그인 401, invalid UUID 400, 없는 UUID 404
4. **기존 페이지 페이징**: `/admin/leads?page=2`, `/admin/escrow?status=DISPUTED`

### 8-3. 기존 테스트 유지

`admin-auth.spec.ts`, 네비/인증/판매 플로우 회귀 방지.

## 9. 마이너 정리 (같은 PR)

- `src/features/admin/components/admin-sidebar.tsx` — `/admin/settings` 데드 링크 제거
- `src/app/api/admin/leads/route.ts` — 파일 삭제 (GET 사용처 없음)
- 기존 테이블 컴포넌트 3개 — 유저명 셀에 `<Link href="/admin/users/{userId}">` 추가

## 10. 마이그레이션 순서

1. Prisma 스키마 — 인덱스 7개 추가 → `bun run db:push`
2. 공통 유틸 — `pagination.ts`, `validation.ts`, `admin-guard.ts` + 단위 테스트
3. 유저 허브 페이지 — `/admin/users/page.tsx`, `/admin/users/[id]/page.tsx`
4. 탭 API 4개 — `/api/admin/users/[id]/{listings,leads,chat-rooms,escrow}/route.ts`
5. 탭 클라이언트 컴포넌트 — SWR + 스켈레톤
6. 기존 페이지 페이징 — `/admin/leads/page.tsx` 외 2개 수정
7. 마이너 정리 — 사이드바, 데드 라우트 삭제, 테이블 링크 추가
8. 테스트 추가 → `type-check + lint + test + test:e2e` 전부 통과
9. 프로덕션 DB 인덱스 — `CREATE INDEX CONCURRENTLY` (Supabase 대시보드)
10. `bun run build` 성공 확인

## 11. 위험 요소

| 위험 | 가능성 | 완화 |
|------|--------|------|
| 프로덕션 인덱스 생성 락 | 중 | `CREATE INDEX CONCURRENTLY` 필수 |
| Prisma relation 이름 불일치 | 중 | `bun run db:generate` 후 타입 체크 조기 발견 |
| SWR + `force-dynamic` 상호작용 | 낮 | 서버 컴포넌트 + 탭만 SWR로 격리 |
| Breaking change (GET 제거) | 낮 | 사용처 없음 확인 |
| Zod 번들 크기 | 낮 | 기존 사용 여부 확인 후 도입 |

## 12. 스코프 제외 (후속 스펙)

- **A** middleware 세션 갱신 — P0 fix
- **E** TrustBadge 상세 통합
- **F** 마이페이지 실데이터
- **G** 번들 최적화 전반
- Dispute 전용 모델 + 워크플로우
- Admin audit log
- 읽기 전용 ADMIN 역할 (RBAC granularity)
- CSV export
- Profile 정지/소프트 삭제 필드
