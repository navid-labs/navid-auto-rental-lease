# Phase 17: Admin Refresh & Polish - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

리디자인된 모든 페이지가 K Car 디자인 언어와 일관되고, 모바일에서 정상 동작하며, 기존 데모 플로우가 깨지지 않음을 보장. 어드민 대시보드 디자인 토큰 통일, 차량 비교 테이블 시각적 하이라이팅 개선, 375px 모바일 반응형 검증, 전체 데모 플로우 리그레션 테스트.

</domain>

<decisions>
## Implementation Decisions

### 어드민 디자인 언어 통일 (ADMIN-01)
- 어드민 대시보드에 v2.0 색상/타이포그래피 토큰 적용 — `design-tokens.ts`의 K Car 레이아웃 토큰 재사용
- 기존 어드민 사이드바 구조 **유지** — 색상/font 업데이트만 (레이아웃 변경 없음)
- 어드민 레이아웃은 `use client`로 이미 구현됨 — Server Component 전환 불필요
- 적용 대상: admin-sidebar.tsx, dashboard stats-cards/chart-section, 데이터 테이블 헤더/셀
- Tailwind CSS 변수(globals.css)의 v2.0 토큰이 어드민에도 자연스럽게 상속되는지 검증, 필요시 명시적 토큰 적용

### 차량 비교 테이블 개선 (ADMIN-02)
- 기존 compare-dialog.tsx에 `betterIs` 로직이 이미 구현됨 — **시각적 하이라이팅만 추가**
- 비교 결과 셀에 `bg-green-50/bg-red-50` (또는 디자인 토큰 색상) 배경으로 우위/열위 표시
- 기존 /vehicles/compare 페이지에도 동일한 하이라이팅 적용
- 2-3대 비교 시 차이가 있는 행만 강조 (동일 값은 하이라이팅 없음)
- 스펙 행 기준: 가격, 연식, 주행거리, 월 렌탈료, 월 리스료, 연료, 변속기, 색상, 보증기간

### 모바일 반응형 검증 (ADMIN-03)
- 375px viewport에서 Phase 13-16 모든 리디자인 페이지 체계적 감사
- 대상 페이지: 홈, 검색/목록, 차량 상세, 비교, 계산기, 문의, 렌트/구독, 내차팔기
- 깨짐 기준: 가로 스크롤 발생, 텍스트 잘림, 버튼 터치 영역 부족 (44px 미만), 이미지 오버플로우
- 발견된 이슈는 즉시 수정 — CSS/Tailwind responsive 클래스 조정
- 어드민 페이지는 모바일 검증 대상에 포함하되, 어드민은 데스크톱 우선이므로 critical만 수정

### 데모 플로우 리그레션 테스트 (ADMIN-04)
- 전체 플로우: 홈 → 검색(/vehicles) → 차량 상세(/vehicles/[id]) → 계약 신청 → PDF 생성
- 각 단계에서 Phase 14-16에서 리디자인된 컴포넌트가 정상 렌더링되는지 확인
- 기존 데모 계정(9개)으로 역할별(admin/dealer/customer) 플로우 테스트
- PDF 생성은 기존 Vercel serverless 타임아웃 이슈 있으므로 빌드 성공만 확인 (실제 PDF 생성은 수동 검증)
- 리그레션 테스트는 기존 vitest 단위 테스트 + yarn build 성공으로 검증

### Claude's Discretion
- 어드민 사이드바 구체적 토큰 값 (기존 bg-background/text-foreground 기반으로 v2.0 토큰 매핑)
- 비교 테이블 하이라이팅 정확한 색상 (design-tokens.ts 참조)
- 모바일 감사 결과에 따른 CSS 수정 범위
- 리그레션 테스트 커버리지 범위 (기존 264+ 테스트 기반 확장)
- 차량 상세 페이지 모바일 레이아웃 미세 조정

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 디자인 참조
- `.planning/DESIGN-SPEC.md` — v1.0 디자인 시스템 (Navy/Blue 팔레트)
- `src/lib/design-tokens.ts` — K Car 레이아웃 디자인 토큰
- `src/app/globals.css` — Tailwind v4 CSS 변수 정의

### Phase 13-16 컨텍스트
- `.planning/phases/13-component-foundation/13-CONTEXT.md` — 색상 팔레트 유지 결정, 하이브리드 디자인 톤
- `.planning/phases/14-vehicle-detail-page/14-CONTEXT.md` — 상세 페이지 결정사항
- `.planning/phases/15-search-listing-page/15-CONTEXT.md` — 검색 페이지 결정사항
- `.planning/phases/16-homepage-navigation/16-CONTEXT.md` — 홈페이지/네비게이션 결정사항

### 어드민 코드 (필수 읽기)
- `src/app/admin/layout.tsx` — 어드민 레이아웃 (사이드바 + Sheet 모바일)
- `src/components/layout/admin-sidebar.tsx` — 어드민 사이드바 컴포넌트
- `src/app/admin/dashboard/page.tsx` — 대시보드 메인
- `src/app/admin/dashboard/stats-cards.tsx` — 통계 카드
- `src/app/admin/dashboard/chart-section.tsx` — 차트 섹션
- `src/app/admin/inventory/inventory-page-client.tsx` — 재고 테이블

### 비교 기능 코드 (필수 읽기)
- `src/features/vehicles/components/compare-dialog.tsx` — 비교 다이얼로그 (betterIs 로직 포함)
- `src/app/(public)/vehicles/compare/page.tsx` — 비교 전용 페이지
- `src/features/vehicles/components/compare-floating-bar.tsx` — 비교함 플로팅 바
- `src/lib/stores/vehicle-interaction-store.ts` — Zustand 비교 상태

### 데모 플로우 관련 코드
- `src/app/(public)/vehicles/page.tsx` — 검색 페이지 (Phase 15 리디자인)
- `src/app/(public)/vehicles/[id]/page.tsx` — 상세 페이지 (Phase 14 리디자인)
- `src/app/(public)/vehicles/[id]/contract/page.tsx` — 계약 신청
- `src/features/contracts/` — 계약 관련 컴포넌트
- `prisma/seed.ts` — 데모 데이터 시드

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `compare-dialog.tsx`: betterIs 로직으로 우위/열위 판별 — 시각적 하이라이팅 스타일만 추가하면 됨
- `compare/page.tsx`: COMPARE_FIELDS 배열로 비교 필드 정의 — 하이라이팅 로직 공유 가능
- `design-tokens.ts`: K Car 레이아웃 토큰 — 어드민에도 동일 적용
- `admin-sidebar.tsx`: 기존 사이드바 — bg/text 색상만 토큰으로 교체
- 기존 vitest 테스트 (~430개) — 리그레션 테스트 기반

### Established Patterns
- Tailwind v4 + CSS variables + `@theme inline` — 어드민도 동일 패턴으로 토큰 적용
- Zustand 비교 상태 (max 4) — 하이라이팅은 클라이언트사이드 계산
- Server Component 기본, 'use client' 필요시만 — 어드민 layout은 이미 'use client'

### Integration Points
- `src/app/globals.css` — v2.0 토큰이 어드민에도 상속
- `src/app/admin/layout.tsx` → 사이드바 색상 토큰 적용
- `src/features/vehicles/components/compare-dialog.tsx` → 하이라이팅 스타일 추가
- `src/app/(public)/vehicles/compare/page.tsx` → 하이라이팅 스타일 추가

</code_context>

<specifics>
## Specific Ideas

- Phase 17은 **폴리싱 페이즈** — 새 기능 추가가 아닌 기존 결과물 다듬기
- 어드민은 내부 도구이므로 K Car 스타일 완벽 적용보다 색상/타이포그래피 일관성에 집중
- 비교 테이블 하이라이팅은 기존 betterIs 로직 활용 — 최소 코드 변경으로 시각적 효과 극대화
- 모바일 감사는 Playwright 또는 수동으로 375px 스크린샷 캡처 후 이슈 목록화
- 데모 플로우는 기존 시드 데이터(9 계정, 180 차량) 기반

</specifics>

<deferred>
## Deferred Ideas

None — Phase 17은 v2.0의 마지막 페이즈로, 모든 미완성 사항을 v3.0으로 보류함:
- 카카오맵 직영점 위치 (MAP-01)
- 실제 eKYC/전자서명 연동 (EXT-02, EXT-03)
- AI 차량 추천
- 비교견적 역경매 (헤이딜러 스타일)
- 실시간 채팅
- Capacitor 모바일 앱

</deferred>

---

*Phase: 17-admin-refresh-polish*
*Context gathered: 2026-03-22*
