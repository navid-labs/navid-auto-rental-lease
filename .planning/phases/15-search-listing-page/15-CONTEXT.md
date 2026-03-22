# Phase 15: Search & Listing Page - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

고객이 원하는 차량을 빠르게 찾을 수 있도록 K Car 수준의 필터링, 무한스크롤, 비교 기능을 갖춘 검색/목록 페이지 재구축. 기존 `/vehicles` 페이지의 5개 필터를 14개로 확장하고, 페이지네이션을 무한스크롤로 전환하며, 차량 카드를 K Car 스타일로 리디자인하고, 비교 테이블 기능을 추가한다.

</domain>

<decisions>
## Implementation Decisions

### 차량 카드 리디자인 (SEARCH-02)
- K Car 완전 카피 정보 밀도 + **렌탈/리스 월납금 병렬 표시** (Navid 차별화)
  - 차량가(만원) 아래에 렌탈 월납금 / 리스 월납금 병렬 표시 (DB의 monthlyRental, monthlyLease 필드 활용)
- 이미지 비율: 4:3 유지 (기존 동일)
- CTA 아이콘(찜/비교): K Car 스타일 이미지 우상단 배치
- 호버 인터랙션: 단순 스케일 + 그림자 강화 (이미지 스와이프 아님)
- **카드 클릭 시 미리보기 팝업** → '상세보기' 버튼으로 /vehicles/[id] 이동

### 필터 구성 & UX (SEARCH-01, SEARCH-06, SEARCH-07)
- 범위 필터(가격/연식/주행거리): **K Car 스타일 듀얼 슬라이더** (기존 RangeInputs 교체)
- 필터 적용 시점: **실시간 적용** (K Car 스타일, 기존 nuqs URL 동기화 재활용)

### 무한스크롤 (SEARCH-03)
- 기존 Pagination 컴포넌트 → IntersectionObserver 기반 무한스크롤로 전환
- react-intersection-observer (Phase 13에서 설치됨) 활용
- SEO fallback: Claude 재량 (Next.js 패턴 분석 후)

### 비교함 (SEARCH-05)
- 비교 테이블 표시: **풀스크린 Dialog** (검색 페이지 위에 모달)
- 기존 Zustand vehicle-interaction-store의 comparison 상태 재활용

### 모바일 레이아웃 (SEARCH-04, SEARCH-08)
- 모바일 필터: **K Car 스타일 풀스크린 Sheet** (기존 Sheet 컴포넌트 재활용)
- 뷰 토글: **그리드/리스트 ToggleGroup 제공** (데스크톱+모바일 모두)

### Claude's Discretion
- 배지 오버레이 배치 (좌상단 스택 vs 분산 — K Car 크롤링 데이터 분석 후)
- 보증 바 디자인 (K Car 스타일 바 vs 아이콘+텍스트)
- 태그 칩 내용 (DB historyData/inspectionData JSONB에서 추출 가능한 태그)
- 카드 캐러셀 유무 (K Car 카드 패턴 vs 성능 고려)
- 카드 미리보기 팝업 내용/방식 (Dialog vs Sheet, 표시 정보)
- 카드 그리드 열 수 (데스크톱: 필터 사이드바 폭 고려, 모바일: 375px 분석)
- 리스트 뷰 레이아웃 (K Car 리스트 뷰 크롤링 데이터 분석 후)
- 14개 필터 그룹핑/접기 전략 (K Car 사이드바 구조 분석 후)
- 제조사→모델 캐스케이드에 세대(Generation) 추가 여부
- 색상 필터 UI (색상 칩 vs 체크박스)
- 퀵 필터 배지 배치 위치
- 활성 필터 칩 표시 방식
- 정렬 드롭다운 옵션 확장 (6→9개)
- 필터 사이드바 폭/접기 기능
- 필터 초기화 UX
- 무한스크롤 배치 크기 (PAGE_SIZE)
- Back to top 버튼
- SEO 페이지네이션 fallback 구현 방식
- 스크롤 위치 복원 (뒤로가기 시)
- 비교함 최대 차량 수 (3 vs 4)
- 비교 테이블 스펙 항목
- 차이점 하이라이팅
- 비교함 플로팅 UI 디자인
- 모바일 카드 그리드 열 수
- 모바일 비교함 표시 여부

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### K Car 크롤링 데이터 (필수 참조)
- `.firecrawl/kcar.com.md` — K Car 홈페이지 전체 크롤링. 검색 페이지 레이아웃, 필터 구조, 카드 디자인 참조
- `.firecrawl/m.kcar.com-bc-detail-carInfoDtl.md` — K Car 모바일 차량 상세 페이지 크롤링

### 디자인 참조
- `.planning/DESIGN-SPEC.md` — v1.0 디자인 시스템 (Navy/Blue 팔레트 유지)
- `.planning/research/FEATURES.md` — K Car 기능 랜드스케이프, 검색/필터/카드 delta 분석
- `.planning/research/ARCHITECTURE.md` — K Car 검색 페이지 컴포넌트 구조

### Phase 13-14 컨텍스트
- `.planning/phases/13-component-foundation/13-CONTEXT.md` — 색상 팔레트 유지 결정, 하이브리드 디자인 톤
- `.planning/phases/14-vehicle-detail-page/14-CONTEXT.md` — 상세 페이지 결정사항 (카드 미리보기에서 연결)

### 기존 코드 (필수 읽기)
- `src/app/(public)/vehicles/page.tsx` — 현재 검색 페이지 Server Component (nuqs, Promise.all 병렬 fetch)
- `src/features/vehicles/components/vehicle-card.tsx` — 현재 차량 카드 (배지, 캐러셀, CTA)
- `src/features/vehicles/components/search-filters.tsx` — 현재 5개 필터 사이드바 (FilterSection, RangeInputs, cascade)
- `src/features/vehicles/components/search-sort.tsx` — 현재 정렬 드롭다운 (6개 옵션)
- `src/features/vehicles/components/vehicle-grid.tsx` — 현재 차량 그리드
- `src/features/vehicles/components/pagination.tsx` — 현재 페이지네이션 (무한스크롤로 교체 대상)
- `src/features/vehicles/components/popular-searches.tsx` — 인기 검색어 칩
- `src/features/vehicles/components/vehicle-search-bar.tsx` — 검색 바
- `src/features/vehicles/lib/search-params.ts` — nuqs 파서, PAGE_SIZE=12
- `src/features/vehicles/lib/search-query.ts` — Prisma WHERE/ORDERBY 빌더
- `src/features/vehicles/actions/get-cascade-data.ts` — 제조사→모델→세대 캐스케이드 액션
- `src/lib/stores/vehicle-interaction-store.ts` — Zustand 비교/찜/최근본 스토어 (max 4 comparison)
- `src/lib/finance/pmt.ts` — PMT 계산기 (할부 월납금)
- `src/lib/utils/format.ts` — formatKRW, getKoreanVehicleName 등
- `src/lib/design-tokens.ts` — K Car 레이아웃 디자인 토큰
- `src/components/ui/sheet.tsx` — 모바일 필터용 Sheet
- `src/components/ui/toggle-group.tsx` — 뷰 토글용 ToggleGroup
- `src/components/ui/collapsible.tsx` — 필터 섹션 접기용
- `src/components/ui/scroll-area.tsx` — 필터 스크롤용
- `src/components/ui/slider.tsx` — 듀얼 슬라이더 (있으면 재사용, 없으면 신규)
- `prisma/schema.prisma` — Vehicle 모델 (color, fuelType 등 필터 필드)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vehicle-card.tsx`: 기존 카드 리디자인 기반. 배지 로직(RESERVED/EV/near-new/time-deal/discount/NEW), Embla 미니 캐러셀, 찜/비교 아이콘 재사용
- `search-filters.tsx`: FilterSection(Collapsible), RangeInputs, cascade select 패턴 재사용. 14개로 확장
- `search-params.ts`: nuqs 파서 확장 (색상/옵션/연료/변속기 등 9개 필터 추가)
- `search-query.ts`: Prisma WHERE 빌더 확장 (새 필터 필드 조건 추가)
- `vehicle-interaction-store.ts`: comparison 상태 재사용. max 조정 + 플로팅 UI 추가
- `get-cascade-data.ts`: 제조사→모델→세대 캐스케이드 액션 재사용
- `pmt.ts`: 할부 월납금 계산 재사용 (카드 표시용)
- `format.ts`: formatKRW, getKoreanVehicleName 재사용
- `popular-searches.tsx`: 인기 검색어 칩 재사용
- `vehicle-search-bar.tsx`: 검색 바 재사용
- Sheet, ToggleGroup, Collapsible, ScrollArea, Dialog: shadcn 컴포넌트 이미 설치됨

### Established Patterns
- Server Component에서 Prisma fetch → Client Component에 data slice 전달
- nuqs로 URL 상태 동기화 (shallow routing)
- Zustand + localStorage persistence (SSR-safe hydration)
- FilterSection: Collapsible + ChevronDown 애니메이션
- react-intersection-observer: Phase 13에서 설치됨 (무한스크롤 센티널용)

### Integration Points
- `src/app/(public)/vehicles/page.tsx` → 무한스크롤 패턴으로 재구축 (Server → Client 구조 변경 가능)
- `search-params.ts` → 9개 필터 파서 추가
- `search-query.ts` → 새 필터 WHERE 조건 추가
- `vehicle-interaction-store.ts` → 비교함 플로팅 UI + Dialog 연결
- 기존 `/vehicles/[id]` 상세 페이지 → 카드 미리보기에서 링크 연결

</code_context>

<specifics>
## Specific Ideas

- K Car의 레이아웃/구조/정보 밀도를 카피하되, 색상은 자사 Navy/Blue 브랜딩 유지 (Phase 13 결정 계승)
- 차량 카드에 **렌탈/리스 월납금 병렬 표시**는 Navid 플랫폼의 핵심 차별화 — K Car에는 없는 기능
- 카드 클릭 시 **미리보기 팝업** 제공 후 상세 이동 — 검색 맥락 유지하면서 빠른 정보 확인
- 듀얼 슬라이더는 K Car 스타일의 시각적 범위 선택 UX

</specifics>

<deferred>
## Deferred Ideas

- 카카오맵 직영점 위치 표시 — v3.0 (MAP-01)
- 렌트 전용 페이지/필터 — v3.0 (RENT-01)
- 360도 사진 시퀀스 뷰어 — v3.0 (EXT-01)
- AI 차량 추천 — v3.0+

</deferred>

---

*Phase: 15-search-listing-page*
*Context gathered: 2026-03-22*
