# UI Parallel Track — Design Spec (v2, post-review)

**Date:** 2026-04-16
**Scope:** 경쟁사 디자인 리뷰(2026-04-16 Obsidian Vault) 기반, HOME/LIST/DETAIL/SELL 4개 페이지의 디자인 완성도 격차 해소.
**Execution:** WT0 선행 정비 후, 4개 git worktree로 병렬 실행. 각 페이지 독립 브랜치 + 독립 PR.

**Review history:**
- v1 (2026-04-16): 초안
- v2 (2026-04-16): 2개 에이전트 리뷰 반영 — 파일 경로 실제 구조로 교정, URL 쿼리 키 실제 스키마에 맞춤, VehicleCard 크로스-WT 계약 명시, 머지 순서 재정립, WT0 pre-work 추가

## Context

- 경쟁사 벤치마크(엔카/KB차차차/K카/헤이딜러) 대비 차용 UI 격차가 페이지별로 다름:
  - HOME: 검색 허브 부재, 신뢰 지표 부재, AI slop 패턴(4-col icon-in-circle grid) 2연속
  - LIST: 사이드바 필터 부재, 정렬 옵션 3개만(`newest|price_asc|price_desc`), 카드 상세 정보 빈약
  - DETAIL: 다중 이미지 갤러리 없음(단일 이미지만), 성능점검/옵션태그/판매자프로필 부재
  - SELL: 차량번호 자동조회 부재(헤이딜러 핵심), 전체 폼 한 화면 방식
- 동시 실행 중인 **백엔드 2개 플랜**:
  - `docs/superpowers/plans/2026-04-16-listing-schema-extension.md` — Prisma 필드 확장 + `accidentFree → accidentCount` 전환 + Zod 검증 + 시드 (다른 세션 실행 중, Task 4 파괴적 마이그레이션)
  - `docs/superpowers/plans/2026-04-16-admin-pagination-infrastructure.md` — `/admin/*` 페이징 (PR-A, worktree `admin-pagination-pr-a`에서 실행 중)
- 이 UI 트랙은 두 플랜의 **파일 소유권을 침범하지 않거나**, 불가피한 충돌은 **명시적 rebase 순서**로 관리한다.

## Source of Truth

- `~/development/claude_volt/Research/Competitors/2026-04-16-used-car-platforms/chayong-gap-analysis.md` — 페이지별 HIGH/MED/POLISH 매트릭스
- `~/development/claude_volt/Research/Competitors/2026-04-16-used-car-platforms/design-system-comparison.md` — 색/타이포/밀도 비교
- `~/development/claude_volt/Research/Competitors/2026-04-16-used-car-platforms/chayong-quick-wins.md` — QW-1~QW-12 액션 아이템

## Goals

1. HOME/LIST/SELL에 대해 **스키마 플랜과 독립**으로 경쟁사 수준 디자인 완성도 확보.
2. DETAIL은 스키마 플랜 Task 8 완료 후 **새 필드(옵션/성능점검) 실데이터로 구현**.
3. 모든 병렬 UI 작업은 **독립 PR** 단위로 리뷰·머지 가능하게 구성.

## Non-Goals

- 백엔드 스키마/마이그레이션 변경 (스키마 플랜 영역)
- Admin 페이지 UI (PR-A Pagination 영역)
- 실제 KOTSA API 연동 (차량번호 자동조회는 mock → 나중 별도 플랜)
- 신규 디자인 토큰 대폭 추가 (기존 `--chayong-*` vars 유지, 최소 utility만 확장)
- localStorage 기반 SELL draft/resume (원안에 있었으나 WT4 Phase 2로 분리, 이 스펙에는 미포함)

## Architecture

### 실제 리포 파일 구조 (검증됨)

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # HOME
│   │   ├── list/page.tsx               # LIST (URL 쿼리 스키마 원천)
│   │   └── detail/[id]/page.tsx        # DETAIL
│   └── api/sell/plate-lookup/          # (WT4가 신규 생성)
├── components/ui/
│   ├── vehicle-card.tsx                # HOME + LIST 공유 카드 (ListingCardData 소비자)
│   ├── price-display.tsx
│   ├── trust-badge.tsx
│   └── share-button.tsx
├── features/
│   ├── home/                           # (WT1이 신규 생성)
│   ├── listings/
│   │   └── components/
│   │       ├── advanced-filters.tsx    # WT2 수정 (sort 키 확장)
│   │       ├── listing-grid.tsx        # grid-cols-2 md:grid-cols-2 lg:grid-cols-3 (이미 3-col)
│   │       ├── listing-gallery.tsx     # WT3 전면 리뉴얼 대상 (현존)
│   │       ├── listing-cta-sidebar.tsx # WT3 보조 수정 (현존)
│   │       ├── mobile-cta-bar.tsx      # WT3 보조 수정 (현존)
│   │       └── listing-cost-calculator.tsx
│   └── sell/
│       └── components/
│           └── sell-wizard.tsx         # WT4 리디자인
├── lib/
│   ├── listings/
│   │   └── filters.ts                  # (WT0 신규 — URL 쿼리 파싱 공유 유틸)
│   └── catalog/
│       └── vehicle-options.ts          # (스키마 플랜 307fe9c로 이미 머지됨)
└── types/
    └── index.ts                        # ListingCardData (크로스-WT 공유 계약)
```

### URL 쿼리 계약 (실제 `list/page.tsx` 스키마)

**기존 키 (유지)**:
- `type`: `TRANSFER | USED_LEASE | USED_RENTAL`
- `minPayment` / `maxPayment`: 월납입금 하/상한 (만원 단위, alias `monthlyMin`/`monthlyMax` 호환 유지)
- `brand`: 부분 일치 검색
- `sort`: 현재 `newest | price_asc | price_desc`
- `page`: 페이지 번호
- `q`: 풀텍스트 검색
- `remainingMin`, `initialCostMax`, `yearMin`: 고급 필터

**신규 키 (WT2 도입)**:
- `sort` 확장값: `year_desc | mileage_asc`
- `fuel`: 연료 타입 (`GASOLINE | DIESEL | HYBRID | EV`)
- `trans`: 변속기 (`AUTO | MANUAL`)
- `accidentMax`: 사고 횟수 상한 (스키마 플랜 Task 8 이후 실동작, 그전엔 파라미터만 받고 무시)

**공유 유틸 (WT0 pre-work 신규)**:
- `src/lib/listings/filters.ts` export `parseListingFilters(searchParams)` + `buildListingUrl(filters)`
- WT1의 Home Search Hub와 WT2의 LIST 사이드바는 반드시 이 유틸만 사용. URL 키 재발명 금지.

### 파일 소유권 매트릭스 (교정)

| 파일 | 스키마 플랜 | PR-A | WT0 | WT1 Home | WT2 List | WT3 Detail | WT4 Sell |
|---|---|---|---|---|---|---|---|
| `prisma/schema.prisma` | ✅ | ✅ (인덱스) | — | — | — | — | — |
| `src/types/index.ts` (ListingCardData) | ✅ (accidentFree 제거, features 추가) | — | ❌ frozen | 읽기만 | 읽기만 | 읽기만 | — |
| `src/app/(public)/page.tsx` | touch (accidentFree map 제거) | — | — | ✅ 전면 리뉴얼 | — | — | — |
| `src/app/(public)/list/page.tsx` | touch | — | touch (searchParams 분기 `parseListingFilters`로 교체) | — | ✅ | — | — |
| `src/app/(public)/detail/[id]/page.tsx` | touch | — | — | — | — | ✅ 전면 리뉴얼 | — |
| `src/components/ui/vehicle-card.tsx` | — (accidentFree JSX 사용 안 함) | — | — | 읽기만 | ✅ (확장 표시) | — | — |
| `src/features/home/*` (신규 디렉터리) | — | — | — | ✅ | — | — | — |
| `src/features/listings/components/advanced-filters.tsx` | — | — | — | — | ✅ (sort 옵션 확장) | — | — |
| `src/features/listings/components/listing-grid.tsx` | — | — | — | — | touch (result-meta 배치) | — | — |
| `src/features/listings/components/sidebar-filters.tsx` (신규) | — | — | — | — | ✅ | — | — |
| `src/features/listings/components/result-meta.tsx` (신규) | — | — | — | — | ✅ | — | — |
| `src/features/listings/components/listing-gallery.tsx` | — | — | — | — | — | ✅ 전면 리뉴얼 | — |
| `src/features/listings/components/spec-panel.tsx` (신규) | — | — | — | — | — | ✅ | — |
| `src/features/listings/components/options-chips.tsx` (신규) | — | — | — | — | — | ✅ | — |
| `src/features/listings/components/seller-card.tsx` (신규) | — | — | — | — | — | ✅ | — |
| `src/features/listings/components/similar-listings.tsx` (신규) | — | — | — | — | — | ✅ | — |
| `src/features/listings/components/listing-cta-sidebar.tsx` | — | — | — | — | — | touch (월납입금 강조 유지) | — |
| `src/features/listings/components/mobile-cta-bar.tsx` | — | — | — | — | — | touch | — |
| `src/features/sell/components/sell-wizard.tsx` | — | — | — | — | — | — | ✅ |
| `src/features/sell/components/plate-lookup.tsx` (신규) | — | — | — | — | — | — | ✅ |
| `src/features/sell/components/photo-guide.tsx` (신규) | — | — | — | — | — | — | ✅ |
| `src/app/api/sell/plate-lookup/route.ts` (신규) | — | — | — | — | — | — | ✅ |
| `src/lib/listings/filters.ts` (신규) | — | — | ✅ | 읽기만 | 읽기만 | — | — |
| `src/app/globals.css` or Tailwind config | — | — | ✅ (`tabular-nums` utility) | 읽기만 | 읽기만 | 읽기만 | — |

**크로스-WT 공유 계약**:
- `ListingCardData` (types/index.ts): 스키마 플랜이 `accidentFree → accidentCount`, `features: string[]` 추가. WT1/WT2는 **읽기만**, 변경 금지.
- `parseListingFilters(searchParams)` (lib/listings/filters.ts): WT0가 정의, WT1/WT2가 소비. 시그니처 변경은 WT0 후속 commit으로만.
- `vehicle-card.tsx`: WT2만 수정 권한. WT1의 Home 재구성에서 `<VehicleCard />` 렌더 위치/개수는 변경 가능하나 **props 추가 요구 금지**.

**원칙**: `(public)/page.tsx`, `list/page.tsx`의 `accidentFree` 참조 제거는 스키마 플랜 Task 8 책임. UI WT는 그 구역을 건드리지 않거나, 섹션 통째 교체로 자연 흡수.

## Pre-Work: WT0 (main 직접 커밋, ~1시간)

스키마 플랜과 PR-A가 `main`에 머지되는 타이밍과 무관하게 WT0는 **지금 바로 착수 가능**. main 브랜치에 소수 유틸만 추가. 이 커밋 뒤 4개 WT 분기.

### WT0 내용

1. **`src/lib/listings/filters.ts` 신규 생성**
   - `parseListingFilters(searchParams: URLSearchParams | Record<string, string | undefined>): ListingFilters`
   - `buildListingUrl(filters: Partial<ListingFilters>): string` (→ `/list?...`)
   - `ListingFilters` 타입 export
   - 기존 `list/page.tsx` `buildWhere` 로직에서 파라미터 파싱 부분을 이 유틸로 분리
   - 신규 키 `fuel`, `trans`, `accidentMax`, `sort=year_desc|mileage_asc` 받기만(값 검증), 실적용은 WT2.

2. **`list/page.tsx` 리팩터 (최소)**
   - `buildWhere` 직접 파싱 → `parseListingFilters()` 호출 후 사용
   - 동작 변화 없음 (검증: 기존 E2E 통과)

3. **Tailwind `tabular-nums` utility 확보**
   - `tailwind.config` 또는 globals.css에 `font-variant-numeric: tabular-nums` utility 클래스 보장 (`.tabular-nums` — Tailwind v4 기본 포함이면 no-op 확인만)

4. **Shared contract note**
   - `src/types/index.ts`의 `ListingCardData` 선언 위에 주석 추가:
     ```ts
     /**
      * CROSS-WORKTREE SHARED CONTRACT.
      * Changes must go through docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md owner.
      * Consumers: Home, List, Detail, vehicle-card.
      */
     ```

### WT0 Exit Criteria
- `bun run type-check` green
- `bun run lint` green
- 기존 `tests/e2e/*` green
- 단일 커밋: `refactor(listings): extract parseListingFilters + ListingCardData contract note`

## Design per Worktree

### WT1: `ui/home-refresh`

**Branch:** `ui/home-refresh` (from main after WT0)
**Worktree:** `.claude/worktrees/ui-home-refresh/`

**Goal:** HOME을 AI slop 탈출 + 검색 허브 + 신뢰 지표 톤으로 재구성.

**섹션 단위 교체안**:

1. **Hero 하단 검색 허브 (신규)**
   - 3개 필터 그룹: 상품 타입 chip / 월납입금 range slider / 인기 브랜드 chip
   - 결과: `buildListingUrl({ type, minPayment, maxPayment, brand })` → `/list?type=TRANSFER&minPayment=...&maxPayment=...`
   - 모바일: 세로 스택, 데스크톱: 가로 3-column
   - 파일: `src/features/home/search-hub.tsx`

2. **기존 "왜 차용인가요?" 4-col icon-in-circle grid → Trust Stripe + Story Cards**
   - Trust Stripe (가로 바): "누적 승계 N건" / "에스크로 보호 100%" / "평균 절약 ₩M" / "연락처 차단 채팅" — 숫자 `.tabular-nums`, 정적 카피 (후에 analytics 연결)
   - Story Cards (3개, 세로 배치): 각 상품별 실제 시나리오 ("잔여 8개월 BMW X3 승계로 1,200만원 절약" 톤). 카피는 마케팅 수준 작성 필요(유저 확인).
   - 파일: `src/features/home/trust-stripe.tsx`, `src/features/home/story-cards.tsx`

3. **기존 "이용 방법" 4-step circled numbers → Timeline with Illustrations**
   - 수직 타임라인 4단계, 각 단계에 짧은 실제 스크린샷/일러스트 플레이스홀더 (v1은 회색 블록 + 캡션으로 충분)
   - 파일: `src/features/home/how-it-works-timeline.tsx`

4. **글로벌 폴리싱**
   - H1 `text-wrap: balance`, 본문 `text-pretty`
   - 가격/카운트 요소 `.tabular-nums` 적용
   - 히어로 이미지 `loading="eager"` + priority
   - VehicleCard props 추가 요구 **금지** (기존 `ListingCardData` 그대로 사용)

**파일**:
- Create: `src/features/home/search-hub.tsx`, `src/features/home/trust-stripe.tsx`, `src/features/home/story-cards.tsx`, `src/features/home/how-it-works-timeline.tsx`
- Modify: `src/app/(public)/page.tsx` (섹션 교체)

**스키마 의존성**: 없음. 단, `(public)/page.tsx`를 스키마 플랜도 건드리므로 **스키마 플랜 Task 8이 먼저 main에 머지된 이후 WT1 분기** 권장.

**Rebase risk**: MEDIUM → LOW (스키마 머지 후 분기 시)

### WT2: `ui/list-density`

**Branch:** `ui/list-density` (from main after schema plan Task 8 merged)
**Worktree:** `.claude/worktrees/ui-list-density/`

**Goal:** LIST 페이지를 엔카/KB 수준 탐색 도구로 상향.

**⚠ 착수 조건**: 스키마 플랜 Task 8(accidentFree → accidentCount, features 배열) 머지 후. 그 전에는 차단. (리뷰어 판단: placeholder 모드는 이중 rebase 비용 발생, 비권장)

**변경 요점**:

1. **Desktop 사이드바 필터 (신규)**
   - 좌측 고정 280px, `sticky top-*` (헤더 높이 감안)
   - 체크박스 그룹: 브랜드(동적, Prisma distinct 상위 10개 + "더보기" 모달), 차종(enum이 있으면), 연료(`fuel`), 변속기(`trans`), 사고횟수(`accidentMax`: 0/1/2+), 지역(미정 — 시드에 region 필드 없으면 v2)
   - 슬라이더: 월납입금(`minPayment`/`maxPayment`), 연식(`yearMin`), 주행거리(미정 — mileageMax 신규 제안, WT2 내부에서 결정)
   - 모바일: 기존 상단 chip 유지 + "상세필터" 버튼 → 바텀시트 (shadcn Sheet)
   - `buildListingUrl()` 사용
   - 파일: `src/features/listings/components/sidebar-filters.tsx` (신규)

2. **정렬 드롭다운 확장**
   - 기존 `newest | price_asc | price_desc` + 신규 `year_desc | mileage_asc`
   - `advanced-filters.tsx` 내부에서 옵션 추가 (sort select는 이미 존재)
   - URL `sort` 파라미터 그대로
   - 파일: `src/features/listings/components/advanced-filters.tsx` (수정)

3. **카드 정보 밀도 상향**
   - `vehicle-card.tsx`에 옵션 태그 chip 3개 노출 (ListingCardData.features 배열 상위 3개)
   - 사고이력 표시: `accidentCount >= 1`이면 "사고이력" 배지, 아니면 TrustBadge 유지
   - 파일: `src/components/ui/vehicle-card.tsx` (수정)

4. **상단 메타 바**
   - "총 N개 매물" + 선택된 필터 chip 삭제 가능 형태
   - 파일: `src/features/listings/components/result-meta.tsx` (신규)

5. **그리드 유지**
   - 현재 `grid-cols-2 md:grid-cols-2 lg:grid-cols-3` — 이미 3-col. 변경 없음.

**파일**:
- Create: `src/features/listings/components/sidebar-filters.tsx`, `src/features/listings/components/result-meta.tsx`
- Modify: `src/features/listings/components/advanced-filters.tsx`, `src/features/listings/components/listing-grid.tsx`(result-meta 마운트), `src/components/ui/vehicle-card.tsx`, `src/app/(public)/list/page.tsx` (buildWhere에 신규 키 반영)

**스키마 의존성**: HARD (Task 8 대기)

### WT3: `ui/detail-trust`

**Branch:** `ui/detail-trust` (from main after schema plan fully merged)
**Worktree:** `.claude/worktrees/ui-detail-trust/`

**Goal:** DETAIL 페이지에 중고차 신뢰 루프 완성 (갤러리/성능점검/옵션/판매자).

**⚠ 착수 조건**: 스키마 플랜 전체 머지(Task 10 최종 검증 완료) 후.

**섹션 단위 재구성**:

1. **Multi-image Gallery — `listing-gallery.tsx` 전면 리뉴얼**
   - 현재: 단일 이미지 placeholder
   - 대표 이미지 (16:9, 우측 상단 공유/찜) + 썸네일 스트립 (가로 스크롤) + 풀스크린 lightbox (keyboard ←/→/Esc, ARIA dialog)
   - 이미지 0장 → 차용 로고 placeholder, 1장 → 단일, 2+ → 썸네일 활성
   - a11y 테스트 포함 (키보드 네비, focus trap)
   - 파일: `src/features/listings/components/listing-gallery.tsx` (수정)

2. **Spec Panel (신규)**
   - 연식/주행/연료/변속기/배기량/색상 6-grid — 크고 가독성 높은 타이포
   - 성능·상태 점검 섹션 (스키마 플랜 신규 필드: `accidentCount`, `conditionNotes`, `inspectedAt` 등): 값이 null일 때 "정보 없음" 안내
   - 파일: `src/features/listings/components/spec-panel.tsx`

3. **Options Chip Group (신규)**
   - `src/lib/catalog/vehicle-options.ts`(기머지, 커밋 307fe9c) 카탈로그와 `ListingCardData.features` 매핑
   - import path 확인: `import { VEHICLE_OPTIONS } from "@/lib/catalog/vehicle-options"` (실제 export 이름은 해당 파일 참조)
   - 카테고리별(안전/편의/내외장) 그룹화, `data-category` 속성
   - 파일: `src/features/listings/components/options-chips.tsx`

4. **Seller Card (신규) — 판매자 신뢰 강화**
   - 이름 / 타입 배지(개인/딜러) / 가입 기간 / 등록 매물 수 / 응답 속도 (있을 때)
   - 딜러의 경우 인증 배지 슬롯 + "전화 인증됨" / "사업자 확인됨" placeholder (실제 verification 플로우는 별도 플랜 주제)
   - 개인의 경우 "개인 판매자" 배지 + "에스크로 필수" 안내
   - 파일: `src/features/listings/components/seller-card.tsx`

5. **Similar Listings Section (신규)**
   - 하단 "비슷한 매물" 4~8개 carousel
   - 조건: 같은 `type` AND (같은 `brand` OR `monthlyPayment` ±20%)
   - 파일: `src/features/listings/components/similar-listings.tsx`

6. **CTA 유지 + 보조 수정**
   - 우측 sticky (1024px+) `listing-cta-sidebar.tsx`, 모바일 `mobile-cta-bar.tsx`
   - 월납입금/총취득비용 강조 유지 (차용 강점)
   - 새 Spec Panel과의 시각적 위계 조정 정도 (큰 변경 없음)
   - 파일: `src/features/listings/components/listing-cta-sidebar.tsx`, `src/features/listings/components/mobile-cta-bar.tsx` (touch only)

**파일**:
- Create: `src/features/listings/components/spec-panel.tsx`, `src/features/listings/components/options-chips.tsx`, `src/features/listings/components/seller-card.tsx`, `src/features/listings/components/similar-listings.tsx`
- Modify: `src/features/listings/components/listing-gallery.tsx` (전면), `src/app/(public)/detail/[id]/page.tsx` (섹션 재조합), `src/features/listings/components/listing-cta-sidebar.tsx`(touch), `src/features/listings/components/mobile-cta-bar.tsx`(touch)

**스키마 의존성**: HARD (전체 머지 대기)

### WT4: `ui/sell-heydealer`

**Branch:** `ui/sell-heydealer` (from main, 즉시 착수 가능 — WT0 완료 후)
**Worktree:** `.claude/worktrees/ui-sell-heydealer/`

**Goal:** SELL 위저드에 차량번호 원클릭 등록 + 1화면 1질문 UX 도입.

**변경 요점**:

1. **Step 0: 차량번호 입력 (신규)**
   - 한국 번호판 정규식 `^[0-9]{2,3}[가-힣][0-9]{4}$`
   - mock lookup API `src/app/api/sell/plate-lookup/route.ts` (신규): POST body `{ plate: string }` → 200 `{ brand, model, year, fuel, displacement }` 고정 더미 응답 (5개 케이스 중 plate 해시로 선택)
   - **Mock 응답 계약 (고정)**:
     ```json
     {
       "plate": "12가3456",
       "brand": "BMW",
       "model": "X3",
       "year": 2022,
       "fuel": "GASOLINE",
       "displacement": 1998
     }
     ```
   - 성공 시 다음 단계 필드 자동 채움 (유저는 수정 가능)
   - 실패/오류 시 "수동 입력으로 계속" 버튼
   - 파일: `src/features/sell/components/plate-lookup.tsx`, `src/app/api/sell/plate-lookup/route.ts`

2. **1화면 1질문 모드 (리디자인)**
   - 현재 전체 폼 제시 → 단계별 Q&A 카드 (헤이딜러 톤)
   - 진행률 인디케이터 상단 큰 바 (X/N, 현재 단계 강조)
   - 각 단계 "다음" 버튼은 sticky footer
   - 키보드 Enter로 다음 단계 (validation 통과 시)
   - 파일: `src/features/sell/components/sell-wizard.tsx` (수정)

3. **사진 가이드 업로드 (신규)**
   - 12장 위치별 슬롯 (외부 정면/측면×2/후면/실내 대시/계기판/엔진룸/바퀴×4/트렁크)
   - **v1 범위**: 슬롯별 회색 placeholder + 라벨 "정면", "운전석 측면" 등. SVG 실루엣은 v2 (디자인 리소스 확보 후)
   - 업로드된 이미지는 슬롯별 preview + 삭제 버튼
   - 파일: `src/features/sell/components/photo-guide.tsx`

**Out of scope (WT4 Phase 2, 별도 스펙)**:
- localStorage draft/resume — 구현 복잡도 및 멀티탭 동시성 이슈, 본 스펙 미포함
- 실제 KOTSA API 연동 — 별도 백엔드 플랜

**파일**:
- Create: `src/features/sell/components/plate-lookup.tsx`, `src/features/sell/components/photo-guide.tsx`, `src/app/api/sell/plate-lookup/route.ts`
- Modify: `src/features/sell/components/sell-wizard.tsx`

**스키마 의존성**: 없음

**Rebase risk**: NONE (다른 플랜과 파일 중복 0)

## Testing Strategy

### 유닛 (vitest)
- `parseListingFilters` / `buildListingUrl`: 기존 키, 신규 키, 빈 값, 잘못된 sort 값 fallback
- `plate-lookup`: 정규식 검증, mock API 200/400/500 응답 처리
- `advanced-filters`: 신규 sort 옵션 5개 선택 → URL 변경 확인
- `sidebar-filters`: 체크박스/슬라이더 → querystring 변환
- `options-chips`: `vehicle-options` 카탈로그 매핑 정확성, 빈 features 처리
- `spec-panel`: null 필드 "정보 없음" 렌더링 (전이 기간 테스트)

### E2E (Playwright)
- `tests/e2e/home-search-hub.spec.ts` — chip 클릭 → `/list?type=TRANSFER&minPayment=...` 이동 + 결과 필터 확인
- `tests/e2e/list-sidebar-filters.spec.ts` — 사이드바 체크 → URL 변경 → 매물 수 변화
- `tests/e2e/detail-gallery.spec.ts` — 썸네일 클릭 메인 교체, lightbox 열림/닫힘, 키보드 네비
- `tests/e2e/sell-plate-lookup.spec.ts` — 번호판 입력 → mock 응답 → 자동 채움 확인

### Visual Regression (수동)
- 각 WT 머지 전 `/design-review` 스킬로 해당 페이지 재감사 (로컬 localhost)

### 접근성 (WT3 필수)
- gallery lightbox: keyboard ←/→/Esc, focus trap, ARIA role="dialog"
- sidebar-filters: label 연결, fieldset/legend

## Execution Order (교정)

### Phase 1 — Pre-work
- **WT0**: main 직접 커밋, 1시간 이내. 모든 WT의 전제.

### Phase 2 — Parallel (스키마 플랜 Task 8 전)
- **WT4** (`ui/sell-heydealer`): 즉시 착수 (스키마 무관)

### Phase 3 — 스키마 플랜 main 머지 후
- **WT1** (`ui/home-refresh`): `(public)/page.tsx` accidentFree 제거 commit 위에서 분기
- **WT2** (`ui/list-density`): accidentCount/features 필드 실데이터로 구현

### Phase 4 — 스키마 플랜 완전 종료 + WT2 머지 후
- **WT3** (`ui/detail-trust`): 전체 스키마 + features 카드 표시 패턴 확정된 후 분기

**PR 머지 순서 (권장)**:
WT0 → WT4 → (스키마 플랜 머지) → WT1 → WT2 → (WT2 머지) → WT3

**근거**:
- WT0는 단독 리팩터, 리스크 zero
- WT4는 파일 독립, 스키마 무관, 진행 중 병렬로 리뷰 가능
- 스키마 플랜 머지 전엔 WT1/WT2/WT3 착수 안 함 → accidentFree 이중 수정 회피
- WT1은 (public)/page.tsx 전면 리뉴얼, 스키마 머지 후 clean base
- WT2는 WT1의 Home Search Hub가 의존하는 URL 스키마 확정 이후 머지 (contract 안정화)
- WT3는 최종 진입

## PR Strategy

- 각 WT draft PR 먼저 오픈
- 섹션 단위 commit (squash 가능하게 유지)
- `/review` 또는 `gstack review`로 main 대상 pre-land 검토
- 리뷰어(사용자) 승인 → squash-merge

## Success Criteria

- WT0 + 4개 WT 각각 독립 PR로 main 머지
- `/design-review` 재감사 시 경쟁사 갭 분석의 HIGH 항목 해결 상태:
  - "DETAIL 다중 이미지 갤러리 없음" → 있음
  - "LIST 사이드바 필터 없음" → 있음
  - "SELL 차량번호 자동조회 없음" → mock 수준이나 UX 동작
  - "HOME 검색 허브 없음" → 있음
- 기존 E2E green + 신규 E2E 4개 green
- AI slop 감지: "낮음 → 매우 낮음"
- `ListingCardData` 계약 변경 0건 (WT 작업 중)

## Open Questions

1. WT3의 `sidebar-filters` 지역 필터(`region`) — 현재 Listing 스키마에 region 필드 없음. 스키마 플랜이 추가 안 하면 WT2 v1에서 제외.
2. Story Cards(WT1)의 실제 카피 — "1,200만원 절약" 같은 숫자는 실제 기준? 마케팅 서명 필요.
3. photo-guide.tsx(WT4)의 SVG 실루엣 — v1은 회색 박스 + 라벨, v2에 실루엣 별도. 이 결정 확정 필요.

## References

- `docs/superpowers/plans/2026-04-16-listing-schema-extension.md`
- `docs/superpowers/plans/2026-04-16-admin-pagination-infrastructure.md`
- `~/development/claude_volt/Research/Competitors/2026-04-16-used-car-platforms/*`
- `src/app/(public)/list/page.tsx:17-73` — URL 쿼리 원천
- `src/components/ui/vehicle-card.tsx` — 카드 계약
- `src/lib/catalog/vehicle-options.ts` — 옵션 카탈로그 (기머지 307fe9c)
