# Phase 9: Admin Dashboard & Demo Readiness - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin이 종합 대시보드를 통해 플랫폼 전체를 운영 관리하고, 투자자 프레젠테이션을 위해 전체 플랫폼이 데모 준비 완료 상태가 되는 것. Requirements: ADMN-01 (전체 CRUD), ADMN-02 (딜러 차량 승인 큐), ADMN-03 (통계 대시보드), ADMN-04 (잔존가치율 테이블 관리).

**이미 구현된 기능 (Phase 4, 6, 7에서 완료):**
- 차량 승인 큐 (ApprovalQueueTable, batch approve, rejection presets) — Phase 4
- 잔존가치율 테이블 CRUD (inline edit, cascade selectors, brand filter) — Phase 6
- 관리자 계약 목록 + 승인/거절 — Phase 7
- 사용자 역할 변경 — Phase 2

</domain>

<decisions>
## Implementation Decisions

### Stats Dashboard
- Full analytics: 핵심 카운트(차량, 계약, 사용자, 승인대기) + 상태별 breakdown + 추세 차트
- recharts 라이브러리 사용 (shadcn/ui 공식 추천, SSR 호환)
- Full chart section: 상단 요약 카드 + 하단 영역에 바/라인 차트
- Dashboard layout: Claude's Discretion — 데모에 가장 인상적인 레이아웃 결정
- Actionable cards: 승인대기 카드 클릭 → /admin/vehicles?tab=approval-queue, 최근 계약 → /admin/contracts
- Recent activity feed: 최근 5건 계약/차량 등록 리스트 포함 (플랫폼 활성도 표시)
- 데이터 새로고침: 페이지 로드 시에만 (Realtime 불필요)
- 차트 기간 범위: Claude's Discretion — 데모 품질 기준으로 결정

### Admin CRUD Completeness
- Full inline edit + soft delete 방식
- 차량 수정: 테이블 행 클릭 → Sheet(slide-out panel)에서 수정. 테이블 컨텍스트 유지
- 차량 삭제: soft delete (HIDDEN 상태 전환)
- 계약 수정 범위: 상태 전이(approve/reject/cancel)만 가능. 금액/기간 수정은 v2
- 사용자 비활성화: Claude's Discretion — 데모에 적합한 방식 결정
- 기존 admin 페이지 (vehicles, contracts, users, residual-value) 확장

### Demo Seed Data
- 차량 구성: Claude's Discretion — 데모에 가장 인상적인 한국 차량 믹스 (현대/기아/제네시스 등 20+대)
- 계약 데이터: Full lifecycle coverage — DRAFT, PENDING_EKYC, PENDING_APPROVAL, APPROVED, ACTIVE, COMPLETED 각 상태별 1-2건. 렌탈+리스 모두 포함
- 데모 계정: Pre-configured with fixed passwords — admin@navid.kr, dealer1@navid.kr, customer1@navid.kr 등 고정 이메일 + 공통 비밀번호
- 3 딜러 계정, 5 고객 계정 (성공기준 충족)
- 차량 이미지: Claude's Discretion — 데모 품질 기준으로 결정 (placeholder 또는 로컬 SVG)

### Demo Polish & UX
- Loading: Skeleton screens (콘텐츠 모양 회색 애니메이션 블록). 프리미엄 느낌
- Empty states: Icon + message + CTA 버튼 (예: 아이콘 + '등록된 차량이 없습니다' + '차량 등록하기')
- Toast: sonner 라이브러리. 모든 페이지의 기존 alert() 호출을 sonner toast로 교체 (전체 UX 일관성)
- KRW/날짜 포맷: 전체 페이지 audit + fix. formatKRW() (월 450,000원), formatDate() (2026년 3월 9일) 일관 적용

### E2E Demo Flow
- Customer journey 중심: 검색 → 차량상세 → 계약신청 → eKYC → 제출 → 마이페이지 확인
- 검증: Manual walkthrough checklist (DEMO.md) + 핵심 플로우 Playwright E2E 테스트 모두 작성
- 데스크톱 + 모바일 모두 에러 없이 동작 확인

### Mobile Admin
- Full mobile optimization: 모바일 전용 레이아웃 (bottom nav, 카드 위주)
- 대시보드: 카드 스택으로 변환, 차트는 스크롤 가능한 단일 컬럼
- 테이블: Claude's Discretion — 페이지별 최적 패턴 선택 (카드 리스트 또는 가로 스크롤)

### Claude's Discretion
- Dashboard 레이아웃 (top cards + bottom charts vs mixed grid 등)
- 차트 기간 범위 (30일 고정 vs period selector)
- 사용자 비활성화 방식 (isActive flag vs role downgrade)
- 차량 이미지 시드 전략 (placeholder.com vs 로컬 SVG)
- 모바일 테이블 대체 패턴 (카드 리스트 vs 가로 스크롤)
- 데모 차량 구성 및 상세 데이터

</decisions>

<specifics>
## Specific Ideas

- 투자자 프레젠테이션용이므로 대시보드가 시각적으로 인상적이어야 함 — recharts로 풀 차트 섹션
- 대시보드가 네비게이션 허브 역할: 승인대기 N건 클릭 → 승인큐, 최근 계약 클릭 → 계약 관리
- 최근 활동 피드로 플랫폼 활성도를 투자자에게 보여줌
- sonner로 전체 alert() 교체하여 데모 시 alert 팝업 없는 세련된 UX
- 데모 계정 고정 비밀번호로 투자자 프레젠테이션 시 즉시 로그인 가능
- 전체 lifecycle 시드 데이터로 각 상태별 화면을 데모에서 바로 보여줄 수 있음

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/vehicles/components/approval-queue-table.tsx`: 승인 큐 이미 구현 (ADMN-02 완료)
- `src/features/vehicles/components/vehicle-table.tsx`: 차량 테이블 + 상태 필터 탭
- `src/features/vehicles/components/dealer-stats-sidebar.tsx`: 카드 기반 통계 패턴 — 대시보드 카드에 참고
- `src/features/contracts/components/admin-contract-list.tsx`: 계약 관리 목록 + 승인/거절
- `src/features/pricing/components/residual-value-table.tsx`: 잔존가치 인라인 편집 (ADMN-04 완료)
- `src/features/pricing/components/residual-value-form.tsx`: cascade selector 패턴
- `src/features/contracts/components/contract-status-badge.tsx`: 상태 뱃지 재사용
- `src/components/ui/sheet.tsx`: Sheet 컴포넌트 — 차량 수정 slide-out panel에 사용
- `src/components/ui/table.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`: 전체 UI 프리미티브
- `src/lib/utils/format.ts`: formatKRW(), formatDate() — 포맷 audit의 기준

### Established Patterns
- Tab navigation: searchParams 기반 탭 상태 (Phase 4 admin → Phase 8 mypage에서 재사용)
- Server Actions: getCurrentUser() + 권한 체크 + prisma.$transaction() 원자성
- 결과 패턴: `{ success: true } | { error: string }` → `'error' in result` 체크
- force-dynamic export: admin 페이지에서 DB 쿼리 시 사용
- Role-based query: dealer는 자기 차량만, admin은 전체 조회
- Rejection presets: 한국어 프리셋 칩 (사진 품질 불량, 정보 불일치 등)

### Integration Points
- `/src/app/admin/dashboard/page.tsx`: 현재 stub — 대시보드 구현 대상
- `/src/app/admin/layout.tsx`: AdminSidebar + Sheet drawer 모바일 지원
- `/src/components/layout/admin-sidebar.tsx`: 5개 nav 아이템 (Dashboard, Vehicles, Contracts, Users, Residual Value)
- `prisma/seed.ts`: 기존 시드 스크립트 — 확장하여 데모 데이터 추가
- 모든 admin 페이지: alert() → sonner toast 교체 대상

</code_context>

<deferred>
## Deferred Ideas

- Admin audit log 전체 이력 조회 페이지 — v2
- Admin 알림 센터 (새 차량 등록, 새 계약 신청 알림) — v2 (UIEX-V2-02)
- Admin 계약 금액/기간 수정 기능 — v2
- Admin 대시보드 실시간 업데이트 (Supabase Realtime) — v2
- Admin export (CSV/Excel) — v2

</deferred>

---

*Phase: 09-admin-dashboard-demo-readiness*
*Context gathered: 2026-03-10*
