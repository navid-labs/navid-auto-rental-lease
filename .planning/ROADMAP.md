# Roadmap: Navid Auto

## Milestones

- ✅ **v1.0 Demo MVP** -- Phases 1-9 (shipped 2026-03-10)
- ✅ **v1.1 Inventory Admin** -- Phases 10-12 (shipped 2026-03-10)
- 🚧 **v2.0 K Car Style Redesign** -- Phases 13-17 (in progress)

## Phases

<details>
<summary>✅ v1.0 Demo MVP (Phases 1-9) -- SHIPPED 2026-03-10</summary>

- [x] Phase 1: Foundation (2/2 plans) -- completed 2026-03-09
- [x] Phase 2: Authentication & User Management (2/2 plans) -- completed 2026-03-09
- [x] Phase 3: Vehicle Data & Storage (3/3 plans) -- completed 2026-03-09
- [x] Phase 4: Dealer Portal & Approval Workflow (2/2 plans) -- completed 2026-03-09
- [x] Phase 5: Public Search & Discovery (2/2 plans) -- completed 2026-03-09
- [x] Phase 6: Pricing & Calculation (3/3 plans) -- completed 2026-03-10
- [x] Phase 7: Contract Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 8: Contract Completion & My Page (2/2 plans) -- completed 2026-03-09
- [x] Phase 9: Admin Dashboard & Demo Readiness (3/3 plans) -- completed 2026-03-10

</details>

<details>
<summary>✅ v1.1 Inventory Admin (Phases 10-12) -- SHIPPED 2026-03-10</summary>

- [x] Phase 10: Inventory Data & Table UI (2/2 plans) -- completed 2026-03-09
- [x] Phase 11: Quote Generation Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 12: Settings Management & Polish (3/3 plans) -- completed 2026-03-10

</details>

### v2.0 K Car Style Redesign (Phases 13-17)

**Milestone Goal:** K Car(kcar.com) 디자인과 페이지 구조를 완전히 카피하여 프로덕션급 UI/UX로 전환

- [x] **Phase 13: Component Foundation** - 신규 패키지 설치, shadcn 컴포넌트 추가, K Car 디자인 토큰 적용, 한국어 유틸리티 (completed 2026-03-19)
- [x] **Phase 14: Vehicle Detail Page** - K Car 스타일 차량 상세 페이지 전면 재구축 (갤러리, 진단, 이력, 보증, Sticky 사이드바) (completed 2026-03-20)
- [x] **Phase 15: Search & Listing Page** - K Car 스타일 검색/목록 페이지 (15개 필터, 무한스크롤, 카드 리디자인, 비교함) (gap closure in progress) (completed 2026-03-22)
- [ ] **Phase 16: Homepage & Navigation** - K Car 스타일 홈페이지, 글로벌 헤더/푸터, 브레드크럼 네비게이션
- [ ] **Phase 17: Admin Refresh & Polish** - 어드민 디자인 통일, 비교 테이블, 모바일 반응형 검증, 리그레션 테스트

## Phase Details

### Phase 13: Component Foundation
**Goal**: 모든 페이지 작업 전 공통 디자인 시스템과 의존성을 확립하여 일관된 K Car 스타일 기반 마련
**Depends on**: Phase 12 (v1.1 complete)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. Embla plugins, YARL lightbox, react-intersection-observer가 설치되어 import 가능
  2. 13개 신규 shadcn/ui 컴포넌트(Accordion, Tabs, Carousel 등)가 추가되어 렌더링 가능
  3. K Car 보조 디자인 토큰(배지, 상태 색상, 카드 배경)이 Tailwind CSS로 적용되어 전체 앱에서 사용 가능
  4. formatKoreanDate(), getKoreanVehicleName() 유틸리티가 구현되어 테스트 통과
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md -- Install npm packages (Embla plugins, YARL, IO) + 13 shadcn/ui components + verification tests
- [x] 13-02-PLAN.md -- Supplementary design tokens + getKoreanVehicleName/formatKoreanDate utilities + tests

### Phase 14: Vehicle Detail Page
**Goal**: 투자자와 고객이 가장 먼저 보는 차량 상세 페이지를 K Car 수준의 정보 밀도와 신뢰감을 주는 UI로 재구축
**Depends on**: Phase 13
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05, DETAIL-06, DETAIL-07, DETAIL-08, DETAIL-09, DETAIL-10, DETAIL-11, DETAIL-12
**Success Criteria** (what must be TRUE):
  1. 차량 상세 페이지에서 이미지 갤러리(메인 캐러셀 + 썸네일)를 넘기고 풀스크린 라이트박스로 확대 가능
  2. 차체 도면(5방향 SVG)에 판금/교환 부위가 색상으로 구분되어 표시됨
  3. 진단결과, 과거이력, 보증 타임라인 섹션이 아코디언/탭으로 펼쳐지며 각 카테고리별 정보가 표시됨
  4. 스크롤 시 Sticky 사이드바에 차량명, 구매비용, CTA 버튼(구매/방문예약/찜/비교/공유)이 고정 노출됨
  5. 기존 렌탈/리스 계약 신청 CTA 버튼이 정상 동작하여 계약 위자드로 진입 가능
**Plans**: 5 plans

Plans:
- [x] 14-01-PLAN.md -- Prisma schema extension (JSONB, ImageCategory enum) + Zod schemas + diagnosis grade util + seed data
- [x] 14-02-PLAN.md -- Image gallery (Embla dual-instance + YARL lightbox) + SVG body diagram (5-direction)
- [x] 14-03-PLAN.md -- Price, Basic Info, Options, Diagnosis, History sections
- [x] 14-04-PLAN.md -- Warranty, Home Service, Reviews/FAQ, Evaluator sections
- [x] 14-05-PLAN.md -- Page orchestrator + Sticky sidebar + Tab nav + Server Component wiring + visual checkpoint

### Phase 15: Search & Listing Page
**Goal**: 고객이 원하는 차량을 빠르게 찾을 수 있도록 K Car 수준의 필터링, 무한스크롤, 비교 기능을 갖춘 검색 페이지 제공
**Depends on**: Phase 14
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-06, SEARCH-07, SEARCH-08
**Success Criteria** (what must be TRUE):
  1. 15개 필터 사이드바에서 차종/제조사/연식/가격 등을 선택하면 차량 목록이 실시간 필터링됨
  2. 차량 카드에 배지 오버레이, 보증 바, 가격+할부, 스펙라인이 K Car 스타일로 표시됨
  3. 스크롤 하단 도달 시 추가 차량이 자동 로딩되고 스켈레톤 UI가 표시됨
  4. 최대 3대 차량을 비교함에 담아 나란히 스펙 비교 테이블로 확인 가능
  5. 모바일(375px)에서 접이식 필터 시트가 열리고 그리드/리스트 뷰 전환이 가능
**Plans**: 5 plans

Plans:
- [x] 15-01-PLAN.md -- Data layer: extended search params (15 filters), WHERE/ORDERBY builders, loadMore server action, store update, design token
- [x] 15-02-PLAN.md -- Vehicle card redesign: K Car style grid/list cards, preview dialog, badge/tag utilities, skeleton cards
- [x] 15-03-PLAN.md -- Filter system: 15-filter sidebar with dual sliders, color chips, quick badges, active chips, sort extension
- [x] 15-04-PLAN.md -- Page orchestrator: hybrid Server/Client infinite scroll, grid/list toggle, compare bar/dialog, back-to-top
- [x] 15-05-PLAN.md -- Gap closure: wire vehicle type (차종) filter end-to-end with body type lookup map

### Phase 16: Homepage & Navigation
**Goal**: K Car 스타일의 홈페이지와 글로벌 네비게이션으로 사이트 전체의 첫인상과 탐색 경험을 통일
**Depends on**: Phase 14
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06
**Success Criteria** (what must be TRUE):
  1. 홈페이지에서 프로모션 배너가 자동 회전하고 퀵링크 아이콘 바를 통해 주요 카테고리로 이동 가능
  2. 추천 차량(인기/최신/특가) 섹션이 Phase 15의 차량 카드 디자인과 동일한 스타일로 표시됨
  3. 글로벌 헤더에 중앙 검색바와 메가메뉴 네비게이션이 동작하며 기존 역할별 메뉴가 보존됨
  4. 전체 페이지에 일관된 브레드크럼 내비게이션이 표시되고 글로벌 푸터에 회사정보/고객센터가 포함됨
**Plans**: 4 plans

Plans:
- [ ] 16-01-PLAN.md -- Hero banner carousel (Embla autoplay) + search box extraction + quick links icon bar
- [ ] 16-02-PLAN.md -- Recommended vehicles tabs (Server/Client split, VehicleCard reuse) + promo banners + partner logos
- [ ] 16-03-PLAN.md -- Global header redesign (mega menu + centered search bar) + mobile nav accordion
- [ ] 16-04-PLAN.md -- Footer enhancement (SNS, awards, app download) + breadcrumb navigation + homepage assembly

### Phase 17: Admin Refresh & Polish
**Goal**: 리디자인된 모든 페이지가 K Car 디자인 언어와 일관되고, 모바일에서 정상 동작하며, 기존 데모 플로우가 깨지지 않음을 보장
**Depends on**: Phase 15, Phase 16
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. 어드민 대시보드가 v2.0 색상/타이포그래피 토큰으로 통일되어 공개 페이지와 디자인 언어가 일치
  2. 차량 비교 테이블에서 2-3대 차량 스펙을 나란히 비교할 때 차이점이 시각적으로 하이라이팅됨
  3. 모든 리디자인 페이지가 375px 모바일 뷰포트에서 깨짐 없이 표시됨
  4. 차량 검색 -> 상세 -> 계약 신청 -> PDF 생성 전체 데모 플로우가 정상 동작
**Plans**: TBD

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD

## Progress

**Execution Order:** Phases 13 -> 14 -> 15 (depends on 14), 16 (depends on 14, parallel with 15) -> 17 (depends on 15, 16)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-09 |
| 2. Auth & User Management | v1.0 | 2/2 | Complete | 2026-03-09 |
| 3. Vehicle Data & Storage | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Dealer Portal & Approval | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Public Search & Discovery | v1.0 | 2/2 | Complete | 2026-03-09 |
| 6. Pricing & Calculation | v1.0 | 3/3 | Complete | 2026-03-10 |
| 7. Contract Engine | v1.0 | 3/3 | Complete | 2026-03-09 |
| 8. Contract Completion & My Page | v1.0 | 2/2 | Complete | 2026-03-09 |
| 9. Admin Dashboard & Demo Readiness | v1.0 | 3/3 | Complete | 2026-03-10 |
| 10. Inventory Data & Table UI | v1.1 | 2/2 | Complete | 2026-03-09 |
| 11. Quote Generation Engine | v1.1 | 3/3 | Complete | 2026-03-09 |
| 12. Settings Management & Polish | v1.1 | 3/3 | Complete | 2026-03-10 |
| 13. Component Foundation | v2.0 | 2/2 | Complete | 2026-03-19 |
| 14. Vehicle Detail Page | v2.0 | 5/5 | Complete | 2026-03-20 |
| 15. Search & Listing Page | v2.0 | 5/5 | Complete | 2026-03-22 |
| 16. Homepage & Navigation | v2.0 | 0/4 | Planned | - |
| 17. Admin Refresh & Polish | v2.0 | 0/? | Not started | - |
