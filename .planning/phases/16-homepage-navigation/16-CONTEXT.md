# Phase 16: Homepage & Navigation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

K Car 스타일의 홈페이지와 글로벌 네비게이션으로 사이트 전체의 첫인상과 탐색 경험을 통일. 히어로 배너 캐러셀, 퀵링크 아이콘 바, 추천 차량 섹션, 글로벌 헤더 리디자인(중앙 검색바 + 메가메뉴), 글로벌 푸터 리디자인, 브레드크럼 네비게이션.

</domain>

<decisions>
## Implementation Decisions

### 히어로 배너 캐러셀 (HOME-01)
- 기존 HeroSection의 dark gradient hero를 **K Car 스타일 프로모션 배너 캐러셀**로 교체
- Embla Carousel + autoplay plugin 사용 (Phase 13에서 설치됨)
- 전체 너비 이미지 배너, 자동 회전 (3-5초 간격), 수동 좌우 화살표 + 인디케이터 dots
- 기존 탭형 검색 박스(제조사/모델, 예산, 차종)는 **히어로 아래 독립 섹션으로 이동** — 배너와 분리
- 배너 이미지는 플레이스홀더 (gradient + 텍스트 오버레이) — 실제 프로모션 이미지는 어드민에서 관리 (v3.0)
- Mobile: 배너 높이 축소, 스와이프 지원

### 퀵링크 아이콘 바 (HOME-02)
- 기존 QuickMenu 컴포넌트 **리디자인** — K Car 스타일 원형 아이콘 + 라벨
- 아이콘 항목: 무료배송, 위클리특가, 기획전, 렌트특가, 테마기획전 (K Car 스타일) + 기존 핵심 메뉴(내차사기, 내차팔기, 렌트/구독)
- 위치: 히어로 배너 바로 아래
- Mobile: 수평 스크롤 (현재 4열 그리드에서 변경)

### 추천 차량 섹션 (HOME-03)
- 기존 FeaturedVehicles를 **탭 기반 섹션으로 확장** — 인기/최신/특가 탭
- 각 탭에 Phase 15에서 만든 vehicle-card 컴포넌트 재사용
- 그리드: 4열 (데스크톱), 2열 (모바일)
- "더보기" 버튼 → /vehicles 검색 페이지로 이동 (필터 프리셋 적용)
- 기존 EventBanners, RentSubscription, FinancePartners 섹션은 **K Car 스타일로 통합** — 프로모션 배너 그리드, 렌트 전용 차량 캐러셀, 파트너사 로고 바로 재구성

### 글로벌 헤더 리디자인 (HOME-04)
- 기존 top bar (로그인/회원가입/고객센터) **유지** — 이미 K Car 패턴과 유사
- 메인 헤더 구조 변경: 로고(좌) + **중앙 검색바** + 로그인/회원가입(우)
- 검색바: compact input, Enter 시 /vehicles?keyword=xxx로 이동
- 네비게이션: 현재 단순 링크 → **메가메뉴 드롭다운** (hover 활성화)
  - 내차사기: 브랜드별, 차종별, 가격별 카테고리 그리드
  - 렌트/구독: 렌트특가, 장기렌트, 월정액 구독
  - 기타 메뉴: 단순 링크 유지
- 기존 역할별 라우팅 (admin/dealer/customer) **보존** — 메가메뉴는 공개 네비게이션만
- Mobile: 기존 MobileNav (Sheet 기반 햄버거 메뉴) 유지, 메가메뉴 카테고리를 아코디언으로 표시

### 글로벌 푸터 리디자인 (HOME-05)
- 기존 Footer 구조 **확장** — 이미 K Car 스타일에 가까움
- 추가 항목: SNS 링크 아이콘 (인스타그램, 유튜브, 블로그, 카카오), 앱 다운로드 배지 (플레이스홀더)
- 수상내역/인증 배지 섹션 추가
- 기존 서비스/고객지원/회사 3컬럼 + 고객센터 전화번호 **유지**
- 하단 사업자 정보 바 유지

### 브레드크럼 내비게이션 (HOME-06)
- shadcn Breadcrumb 컴포넌트 활용 (이미 설치됨, src/components/ui/breadcrumb.tsx)
- 전체 공개 페이지에 일관 적용: 홈 > 카테고리 > 현재 페이지
- 차량 상세: 홈 > 내차사기 > {브랜드} > {모델명}
- 검색: 홈 > 내차사기
- 기타 페이지: 홈 > {페이지명}
- 위치: 메인 콘텐츠 영역 상단 (헤더 아래, max-w-7xl 내부)
- 기존 public-vehicle-detail.tsx에 이미 간단한 breadcrumb 있음 → shadcn 컴포넌트로 통일

### Claude's Discretion
- 프로모션 배너 플레이스홀더 디자인 (gradient + 텍스트 조합)
- 배너 autoplay 간격 (3-5초 범위 내)
- 메가메뉴 카테고리 그리드 세부 구성
- 퀵링크 아이콘 선택 (Lucide icons)
- 추천 차량 탭 데이터 쿼리 로직 (인기=조회순, 최신=등록순, 특가=가격순)
- 브레드크럼 구분자 스타일
- 기존 섹션(EventBanners, RentSubscription, FinancePartners) 통합 방식
- Loading skeleton 디자인
- Error/Empty state 처리

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### K Car 크롤링 데이터 (필수 참조)
- `.firecrawl/kcar.com.md` — K Car 홈페이지 전체 크롤링. 히어로 배너, 퀵링크, 추천 차량, 헤더/푸터 구조 참조
- `.firecrawl/kcar.com-sc-HomeSvcMain.md` — K Car 홈서비스 페이지

### 디자인 참조
- `.planning/DESIGN-SPEC.md` — v1.0 디자인 시스템 (Navy/Blue 팔레트 유지)
- `.planning/research/FEATURES.md` — K Car 기능 랜드스케이프, 홈페이지 섹션 delta 분석
- `.planning/research/ARCHITECTURE.md` — K Car 컴포넌트 구조

### Phase 13-15 컨텍스트
- `.planning/phases/13-component-foundation/13-CONTEXT.md` — 색상 팔레트 유지 결정, 하이브리드 디자인 톤, Embla autoplay 설치
- `.planning/phases/14-vehicle-detail-page/14-CONTEXT.md` — 상세 페이지 결정사항 (브레드크럼 연결)
- `.planning/phases/15-search-listing-page/15-CONTEXT.md` — 검색 페이지 결정사항 (차량 카드 재사용)

### 기존 코드 (필수 읽기)
- `src/app/(public)/page.tsx` — 현재 홈페이지 (HeroSection, QuickMenu, FeaturedVehicles, EventBanners, RentSubscription, FinancePartners)
- `src/app/(public)/layout.tsx` — 공개 레이아웃 (Header, Footer, FloatingCTA, ComparisonBar)
- `src/components/layout/header.tsx` — 현재 헤더 (top bar + main header + nav links)
- `src/components/layout/footer.tsx` — 현재 푸터 (4컬럼 + 하단 바)
- `src/components/layout/mobile-nav.tsx` — 모바일 네비게이션 (Sheet 기반)
- `src/features/marketing/components/hero-section.tsx` — 현재 히어로 (dark gradient + tabbed search)
- `src/features/marketing/components/quick-menu.tsx` — 현재 퀵메뉴 (8개 아이콘)
- `src/features/marketing/components/featured-vehicles.tsx` — 현재 추천 차량 (Server Component, Prisma query)
- `src/features/marketing/components/event-banners.tsx` — 이벤트 배너
- `src/features/marketing/components/rent-subscription.tsx` — 렌트/구독 섹션
- `src/features/marketing/components/finance-partners.tsx` — 파트너사 섹션
- `src/features/vehicles/components/vehicle-card.tsx` — Phase 15 차량 카드 (재사용 대상)
- `src/features/vehicles/components/vehicle-card-skeleton.tsx` — 카드 스켈레톤 (재사용 대상)
- `src/components/ui/breadcrumb.tsx` — shadcn Breadcrumb (이미 설치됨)
- `src/components/ui/carousel.tsx` — Embla Carousel 컴포넌트
- `src/lib/design-tokens.ts` — K Car 레이아웃 디자인 토큰
- `src/features/vehicles/actions/get-cascade-data.ts` — 제조사→모델 캐스케이드 (히어로 검색에서 사용)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hero-section.tsx`: 탭 기반 검색 박스 로직 (브랜드/모델 캐스케이드, 예산, 차종) — 배너 아래 독립 섹션으로 분리 시 재사용
- `quick-menu.tsx`: 아이콘 바 구조 (Lucide icons + 링크) — K Car 스타일로 리디자인
- `featured-vehicles.tsx`: Server Component Prisma query (8대 fetch, badge 로직) — 탭별 쿼리로 확장
- `vehicle-card.tsx` (Phase 15): K Car 스타일 차량 카드 — 홈페이지 추천 섹션에 직접 재사용
- `vehicle-card-skeleton.tsx`: 스켈레톤 로딩 — Suspense fallback에 재사용
- `carousel.tsx`: Embla Carousel — 프로모션 배너 캐러셀에 재사용 (autoplay plugin 추가)
- `breadcrumb.tsx`: shadcn Breadcrumb — 전체 페이지에 적용
- `header.tsx`: 기존 헤더 구조 (top bar + sticky main header) — 메가메뉴 + 검색바로 확장
- `footer.tsx`: 기존 푸터 (4컬럼 레이아웃) — SNS/인증 섹션 추가
- `mobile-nav.tsx`: Sheet 기반 모바일 메뉴 — 메가메뉴 카테고리를 아코디언으로 추가
- `get-cascade-data.ts`: 브랜드→모델 Server Action — 메가메뉴 카테고리 데이터에 재사용

### Established Patterns
- Server Component에서 Prisma fetch → Client Component에 data slice 전달
- Embla Carousel + autoplay/auto-scroll plugins (Phase 13에서 설치)
- Tailwind v4 + CSS variables + `@theme inline` for design tokens
- Pretendard 폰트 400/500/600/700
- Framer Motion 애니메이션 (hero-section.tsx에서 사용)
- Zustand + localStorage persistence (StoreHydration 패턴)

### Integration Points
- `src/app/(public)/layout.tsx` → 브레드크럼 컴포넌트 추가 위치
- `src/app/(public)/page.tsx` → 홈페이지 섹션 재구성
- `src/components/layout/header.tsx` → 메가메뉴 + 검색바 추가
- `src/components/layout/footer.tsx` → SNS/인증 섹션 추가
- `src/components/layout/mobile-nav.tsx` → 메가메뉴 카테고리 아코디언 추가
- `src/features/marketing/components/` → 기존 섹션 리디자인/통합

</code_context>

<specifics>
## Specific Ideas

- K Car의 레이아웃/구조/정보 밀도를 카피하되, 색상은 자사 Navy/Blue 브랜딩 유지 (Phase 13 결정 계승)
- 히어로는 기존 glassmorphism dark gradient에서 K Car 프로모션 배너 캐러셀로 전환 (Phase 13 하이브리드 결정: 히어로/랜딩은 변경 가능)
- 탭 기반 검색 박스는 유지하되 배너 아래 별도 섹션으로 이동
- 추천 차량은 Phase 15의 K Car 스타일 차량 카드를 그대로 재사용
- 메가메뉴는 기존 역할별 라우팅(admin/dealer)에 영향 없이 공개 네비게이션만 변경

</specifics>

<deferred>
## Deferred Ideas

- 카카오맵 직영점 위치 표시 — v3.0 (MAP-01)
- 프로모션 배너 어드민 CMS 관리 — v3.0
- 앱 다운로드 실제 스토어 링크 — v3.0
- AI 차량 추천 섹션 — v3.0+

</deferred>

---

*Phase: 16-homepage-navigation*
*Context gathered: 2026-03-22*
