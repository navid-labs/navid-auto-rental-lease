# Phase 14: Vehicle Detail Page - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

차량 상세 페이지를 K Car 수준의 정보 밀도와 신뢰감을 주는 UI로 재구축. 10개 섹션(갤러리, 가격, 기본정보, 옵션, 도면/진단, 이력, 보증, 홈서비스, 후기/FAQ, 평가사) + Sticky 사이드바 + Prisma 스키마 확장. 기존 렌탈/리스 계약 CTA 연동 유지.

</domain>

<decisions>
## Implementation Decisions

### Image Gallery (DETAIL-01)
- Bottom strip thumbnails (하단 수평 스크롤)
- 4:3 landscape aspect ratio for main image
- Overlay badge for image count ("📷 23" on bottom-right)
- Click main image → YARL fullscreen lightbox
- Category tabs above thumbnails: 전체/외관/내부/엔진룸
- VehicleImage Prisma model에 category enum 추가 (EXTERIOR, INTERIOR, ENGINE, OTHER)
- Mobile gallery behavior: Claude's discretion (K Car 모바일 참조)

### Body Diagram (DETAIL-04)
- SVG 5방향 도면 소스: Claude's discretion (직접 제작 또는 오픈소스)
- 3색 코딩: 판금(노란 #F59E0B), 교환(빨간 #EF4444), 정상(회색 #CBD5E1)
- 패널 인터랙션: Hover tooltip (모바일은 탭으로 동일 동작)
- 도면 데이터 저장: Claude's discretion (JSONB 기반, DETAIL-12와 통합)

### Section Layout & Navigation
- Scroll-spy sticky tabs navigation (기존 IntersectionObserver 패턴 재사용)
- K Car 섹션 순서: 갤러리 → 가격 → 기본정보 → 옵션 → 도면/진단 → 이력 → 보증 → 홈서비스 → 후기/FAQ → 평가사
- Desktop 7:3 ratio (메인 콘텐츠 70% : 사이드바 30%)
- Mobile: 수평 스크롤 탭 바 + 정보 밀도 높은 섹션은 축약 "더보기" 버튼으로 펼침

### Sticky Sidebar (DETAIL-10)
- K Car 스타일 콘텐츠: 차량명 + 가격(만원) + 할부 월납금 + 구매비용 분류(+취득세/등록비/보험) + CTA 버튼 5개
- Sticky 시작 위치: 갤러리 아래부터 (갤러리와 사이드바 나란히)
- Mobile: bottom fixed bar (기존 floating-cta.tsx 패턴 재사용)
- "구매하기" CTA → 기존 렌탈/리스 계약 위저드로 연결 (기존 플로우 유지)

### Price Section (DETAIL-02)
- 가격(만원 단위), 할부 월납금 표시
- 구매비용 계산기/대출한도/보험료 CTA 버튼 (기존 PMT 계산기 재사용)

### Options Grid (DETAIL-03)
- 아이콘 기반 옵션 표시 + "옵션 모두 보기" 확장

### Diagnosis Results (DETAIL-05)
- K Car 카테고리별 요약: 상단에 종합등급(A+~C) + 카테고리별(실내/외관/타이어/소모품/하체) 건수 요약
- "전체보기" 클릭 시 상세 항목 펼침

### History (DETAIL-06)
- K Car 카드형 요약: 내차 피해 건수/금액, 소유주 변경 횟수, 주의이력(침수/도난/전손) 아이콘 카드
- 하단에 상세 타임라인

### Warranty Timeline (DETAIL-07)
- 수평 타임라인 바: 제조사 보증 → 연장 보증 기간 표시
- 남은 기간/주행거리 텍스트

### Home Service (DETAIL-08)
- 4단계 수평 스텝 인디케이터: 주문 → 결제 → 배송 → 3일 환불
- 각 단계별 간단 설명
- 직영점 방문예약: Dialog form (기존 inquiry-form.tsx 패턴 재사용)

### Reviews & FAQ (DETAIL-09)
- 고객 후기: Embla 수평 캐러셀에 리뷰 카드(별점 + 이름 + 날짜 + 코멘트). 상단에 평균 별점 + 총 리뷰 수
- FAQ: shadcn Accordion. 카테고리 탭(구매절차/배송/환불/보증) + 카테고리별 3-5개 FAQ

### Evaluator Recommendation (DETAIL-11)
- K Car 프로필 카드: 사진 + 이름 + 소속(직영점명) + 사원증 번호 + 추천 코멘트. 인용부호 디자인
- 평가사 데이터: Vehicle inspectionData JSONB 안에 evaluator 객체 포함

### Prisma Schema (DETAIL-12)
- Vehicle에 inspectionData JSONB 컬럼 추가 (진단결과, 패널 상태, 평가사 정보)
- Vehicle에 historyData JSONB 컬럼 추가 (사고이력, 보험이력, 소유주 변경)
- VehicleImage에 category enum 추가 (EXTERIOR, INTERIOR, ENGINE, OTHER)

### Claude's Discretion
- SVG 차체 도면 제작 방식 (직접 제작 vs 오픈소스)
- inspectionData/historyData JSONB 스키마 구조 상세 설계
- Mobile gallery behavior (K Car 모바일 참조)
- 진단 등급 계산 로직 (score → A+/A/B+/B/C)
- 컴포넌트 분할 전략 (기존 모놀리식 → 섹션별 분리)
- Loading skeleton 디자인
- Error/Empty state 처리

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 디자인 참조
- `.planning/DESIGN-SPEC.md` — v1.0 디자인 시스템 (색상, 타이포그래피, 스페이싱). Navy/Blue 팔레트 유지
- `.planning/research/FEATURES.md` — K Car 기능 랜드스케이프, 섹션별 delta 분석
- `.planning/research/ARCHITECTURE.md` — K Car 상세페이지 컴포넌트 구조, 섹션 분해 계획
- `.planning/phases/13-component-foundation/13-CONTEXT.md` — Phase 13 결정사항 (색상 유지, 하이브리드 디자인 톤)

### K Car 크롤링 데이터 (필수 참조)
- `.firecrawl/m.kcar.com-bc-detail-carInfoDtl.md` — K Car 차량 상세 페이지 (모바일) 크롤링
- `.firecrawl/kcar.com.md` — K Car 홈페이지 크롤링
- `.firecrawl/kcar.com-sc-HomeSvcMain.md` — K Car 홈서비스 페이지

### 기존 코드 (필수 읽기)
- `src/app/(public)/vehicles/[id]/page.tsx` — 현재 차량 상세 Server Component
- `src/features/vehicles/components/public-vehicle-detail.tsx` — 현재 모놀리식 상세 컴포넌트 (~700줄)
- `src/features/vehicles/components/vehicle-card.tsx` — 차량 카드 (similar vehicles 재사용)
- `src/components/ui/carousel.tsx` — Embla carousel (갤러리 재사용)
- `src/components/layout/floating-cta.tsx` — 기존 Floating CTA (모바일 바 재사용)
- `src/features/vehicles/components/inquiry-form.tsx` — 상담 폼 (방문예약 재사용)
- `src/lib/finance/pmt.ts` — PMT 계산기 (할부 월납금)
- `src/lib/utils/format.ts` — formatKRW, getKoreanVehicleName 등
- `src/lib/stores/vehicle-interaction-store.ts` — Zustand 스토어 (찜/비교/최근본)
- `prisma/schema.prisma` — 현재 Vehicle 모델 구조
- `src/lib/design-tokens.ts` — K Car 레이아웃 디자인 토큰

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `carousel.tsx` (Embla): 이미지 갤러리 메인 캐러셀, 리뷰 캐러셀, similar vehicles 캐러셀에 재사용
- `accordion.tsx` (shadcn): FAQ 섹션, 옵션 전체보기에 재사용
- `tabs.tsx` (shadcn): 이미지 카테고리 탭, FAQ 카테고리 탭에 재사용
- `progress.tsx` (shadcn): 보증 타임라인 바에 재사용
- `floating-cta.tsx`: 모바일 bottom fixed bar 패턴 재사용
- `inquiry-form.tsx`: 방문예약 다이얼로그 폼 패턴 재사용
- `vehicle-card.tsx`: 추천 차량 섹션에 재사용
- `pmt.ts`: 할부 월납금 계산에 재사용
- `vehicle-interaction-store.ts`: 찜/비교/공유 CTA 기능에 재사용
- `format.ts`: formatKRW, getKoreanVehicleName, formatDate, formatDistance 재사용

### Established Patterns
- Server Component에서 Prisma fetch → Client Component에 data slice 전달
- IntersectionObserver 기반 scroll-spy (기존 상세 페이지에 이미 구현됨)
- Zustand + localStorage persistence for client state (SSR-safe hydration)
- Tailwind v4 + CSS variables + `@theme inline` for design tokens
- React Hook Form + Zod for form validation

### Integration Points
- `src/app/(public)/vehicles/[id]/page.tsx` → Server Component 유지, 새 Client Component로 교체
- `prisma/schema.prisma` → inspectionData/historyData JSONB + VehicleImage category enum 추가
- `src/features/vehicles/components/` → 기존 monolithic → section별 분리된 컴포넌트 구조
- 기존 렌탈/리스 계약 위저드 → "구매하기" CTA에서 연결 유지

</code_context>

<specifics>
## Specific Ideas

- K Car의 레이아웃/구조/정보 밀도를 카피하되, 색상은 자사 Navy/Blue 브랜딩 유지 (Phase 13 결정 계승)
- 정보 밀도 높은 상세 페이지는 K Car 스타일 플랫 디자인 적용
- 기존 모놀리식 PublicVehicleDetail (~700줄)을 섹션별 컴포넌트로 분리
- 차체 도면 SVG는 단순한 실루엣 스타일 (사실적이지 않아도 됨, 패널 구분이 명확하면 OK)

</specifics>

<deferred>
## Deferred Ideas

- 360도 사진 시퀀스 뷰어 — v3.0 (EXT-01)
- 카카오맵 직영점 위치 표시 — v3.0 (MAP-01)
- 실제 eKYC/전자서명 연동 — v3.0 (EXT-02, EXT-03)

</deferred>

---

*Phase: 14-vehicle-detail-page*
*Context gathered: 2026-03-20*
