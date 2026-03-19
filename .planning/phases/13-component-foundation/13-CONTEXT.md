# Phase 13: Component Foundation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

모든 페이지 작업 전 공통 디자인 시스템과 의존성을 확립하여 일관된 K Car 스타일 기반 마련. 신규 패키지 설치, shadcn 컴포넌트 추가, 디자인 토큰 업데이트, 한국어 유틸리티 보강.

</domain>

<decisions>
## Implementation Decisions

### 색상 팔레트 전략
- 기존 Navy primary (#0F172A) + Blue accent (#3B82F6) 팔레트 **유지**
- K Car의 Red 기조로 전환하지 않음 — 자사 브랜딩 차별화 유지
- K Car에서 가져오는 것은 **레이아웃/구조/컴포넌트 패턴**만
- COMP-03은 K Car 레이아웃에 필요한 보조 토큰 추가로 재해석 (예: 배지 색상, 상태 색상, 카드 배경 변형)

### 디자인 톤
- **하이브리드 접근**: 히어로/랜딩은 glassmorphism + dark hero 유지, 검색/상세/목록 등 정보 밀도 높은 페이지는 K Car 스타일 플랫 디자인 적용
- 기존 DESIGN-SPEC.md의 glassmorphism card, dark hero 패턴은 보존
- 신규 K Car 레이아웃 토큰 추가: 카드 간격, 사이드바 폭, 필터 패딩 등

### 패키지 설치 (COMP-01)
- Kakao Maps SDK **제외** (v3.0으로 보류, REQUIREMENTS.md Out of Scope과 일치)
- 설치 대상 4개: Embla Carousel plugins (autoplay, auto-scroll), YARL lightbox, react-intersection-observer
- 기존 Embla Carousel이 이미 있으면 plugins만 추가

### shadcn/ui 컴포넌트 (COMP-02)
- 13개 전부 Phase 13에서 **선설치** — 후속 phase에서 바로 사용 가능
- 대상: Accordion, Tabs, Carousel, Collapsible, Progress, Pagination, Popover, ScrollArea, Avatar, Breadcrumb, ToggleGroup, RadioGroup, DropdownMenu
- 기존 16개 컴포넌트와 충돌 여부 확인 후 추가

### 한국어 유틸리티 (COMP-04)
- `formatKRW()`, `formatDate()` — 이미 `src/lib/utils/format.ts`에 존재, 변경 불필요
- `getKoreanVehicleName()` 신규 추가 — DB의 brand/model/generation/trim/year 조합으로 한국어 차량명 생성
- `formatKoreanDate()` — 기존 `formatDate()`와 중복 확인 후 필요시 alias 또는 확장

### Claude's Discretion
- `getKoreanVehicleName()` 포맷 결정 — 기존 코드의 Vehicle 모델 필드와 K Car 표시 방식을 분석하여 최적 포맷 결정
- 보조 디자인 토큰의 구체적 값 (배지 색상, K Car 레이아웃 spacing)
- shadcn 컴포넌트 커스터마이징 범위 (기본 스타일 유지 vs 테마 적용)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 디자인 참조
- `.planning/DESIGN-SPEC.md` — v1.0 디자인 시스템 (색상, 타이포그래피, 스페이싱, 컴포넌트 스펙). Phase 13은 이를 유지하면서 K Car 레이아웃 토큰을 추가
- `.planning/research/FEATURES.md` — K Car 기능 랜드스케이프, 컴포넌트별 delta 분석

### K Car 크롤링 데이터
- `.firecrawl/kcar.com.md` — K Car 홈페이지 크롤링 데이터
- `.firecrawl/m.kcar.com-bc-detail-carInfoDtl.md` — K Car 차량 상세 페이지 (모바일)
- `.firecrawl/kcar.com-sc-HomeSvcMain.md` — K Car 홈서비스 페이지

### 기존 코드
- `src/lib/utils/format.ts` — 기존 formatKRW, formatDate, formatDistance, formatYearModel 구현
- `src/app/globals.css` — 현재 Tailwind CSS 변수 정의 (Navy/Blue 팔레트)
- `src/components/ui/` — 기존 16개 shadcn 컴포넌트

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils/format.ts`: formatKRW, formatDate, formatDistance, formatYearModel — COMP-04에서 재사용/확장
- `src/components/ui/` (16개): Button, Card, Dialog, Sheet, Skeleton, Slider, Table 등 — shadcn 추가 시 기존 패턴 따름
- `src/app/globals.css`: Tailwind v4 + CSS variables + `@theme inline` 패턴 — 디자인 토큰 추가 시 동일 패턴 사용
- shadcn v4.0.2 이미 설치됨 — `npx shadcn@latest add` 명령으로 컴포넌트 추가 가능

### Established Patterns
- CSS variables → `@theme inline` 매핑 (globals.css)
- Pretendard 폰트 (`@fontsource/pretendard`) — 400/500/600/700 weight
- Named exports (default export 지양)
- Server Components 기본, 'use client' 필요시만

### Integration Points
- `package.json` — 신규 패키지 추가
- `src/app/globals.css` — 디자인 토큰 추가
- `src/components/ui/` — shadcn 컴포넌트 추가
- `src/lib/utils/format.ts` — 유틸리티 함수 추가

</code_context>

<specifics>
## Specific Ideas

- K Car의 레이아웃/구조/정보 밀도를 카피하되, 색상은 자사 Navy/Blue 브랜딩 유지
- 히어로/랜딩은 기존 glassmorphism 유지, 정보 페이지(검색/상세)는 K Car 스타일 플랫 디자인
- Kakao Maps SDK는 v3.0으로 완전 보류

</specifics>

<deferred>
## Deferred Ideas

- Kakao Maps SDK 설치 및 직영점 지도 — v3.0 (MAP-01, MAP-02)

</deferred>

---

*Phase: 13-component-foundation*
*Context gathered: 2026-03-19*
