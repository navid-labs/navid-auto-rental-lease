# Requirements: Navid Auto v2.0

**Defined:** 2026-03-19
**Core Value:** K Car(kcar.com) 수준의 프로덕션급 UI/UX로 전환하여 투자자/고객 신뢰도 확보

## v2.0 Requirements

### Component Foundation (COMP)

- [x] **COMP-01**: 프로젝트에 5개 신규 npm 패키지 설치 (Embla plugins, YARL lightbox, Intersection Observer, Kakao Maps SDK)
- [x] **COMP-02**: 13개 신규 shadcn/ui 컴포넌트 추가 (Accordion, Tabs, Carousel, Collapsible, Progress, Pagination, Popover, ScrollArea, Avatar, Breadcrumb, ToggleGroup, RadioGroup, DropdownMenu)
- [x] **COMP-03**: K Car 색상 팔레트로 Tailwind CSS 디자인 토큰 업데이트 (Primary Red, 배경, 텍스트, 보더)
- [x] **COMP-04**: 한국어 포맷 유틸리티 함수 통합 (formatKRW, formatKoreanDate, getKoreanVehicleName)

### Vehicle Detail Page (DETAIL)

- [x] **DETAIL-01**: 차량 이미지 갤러리 — Embla 메인 캐러셀 + 썸네일 스트립 + YARL 풀스크린 라이트박스
- [x] **DETAIL-02**: 차량 가격 섹션 — 가격(만원), 할부 월, 구매비용 계산기/대출한도/보험료 CTA 버튼
- [x] **DETAIL-03**: 주요 옵션 그리드 — 아이콘 기반 옵션 표시 + "옵션 모두 보기" 확장
- [x] **DETAIL-04**: 외부 패널/프레임 진단 — SVG 차체 도면 (5방향) + 판금/교환 색상 코딩
- [x] **DETAIL-05**: 주요 진단결과 — 사고진단, 진단통과, 카테고리별 건수 (실내/외관, 타이어/휠, 소모품, 하체)
- [x] **DETAIL-06**: 주요 과거이력 — 내차 피해, 소유주 변경 횟수, 주의이력 (침수/도난/전손)
- [x] **DETAIL-07**: 보증 타임라인 — 제조사 보증 → 연장 보증 타임라인 바 + 보증 기간/주행거리 표시
- [x] **DETAIL-08**: 홈서비스 구매 안내 — 온라인 주문/결제 → 배송 → 3일 환불 플로우 + 직영점 방문 예약
- [x] **DETAIL-09**: 구매 후기 + FAQ — 고객 리뷰 캐러셀 + FAQ 아코디언
- [x] **DETAIL-10**: Sticky 사이드바 — 차량명, 구매비용 계산기, 비용 항목 분류, CTA 버튼 (구매/방문예약/찜/비교/공유)
- [x] **DETAIL-11**: 차량평가사 추천 섹션 — 평가사 프로필 (소속, 사원증) + 추천 코멘트
- [x] **DETAIL-12**: Prisma 스키마에 차량 진단 데이터 JSONB 컬럼 추가 (inspectionData, historyData)

### Search & Listing Page (SEARCH)

- [x] **SEARCH-01**: 14개 필터 사이드바 — 차종, 제조사/모델 cascade, 연식 범위, 주행거리 범위, 가격 슬라이더, 색상 칩, 옵션, 지역/직영점, 연료, 변속기, 인승, 구동방식, 판매구분, 키워드 태그
- [x] **SEARCH-02**: 차량 카드 리디자인 — 이미지 배지 오버레이(타임딜/무료배송/3D), 보증 배지 바, 차량명, 가격+할부, 스펙라인, 태그 칩
- [ ] **SEARCH-03**: 무한 스크롤 — Intersection Observer 센티널 + 스켈레톤 로딩 + SEO용 페이지네이션 fallback
- [x] **SEARCH-04**: 그리드/리스트 뷰 토글 — Toggle Group 기반 보기 모드 전환
- [x] **SEARCH-05**: 비교함 기능 — 플로팅 비교 버튼 + 최대 3대 차량 비교 + 스펙 나란히 비교 테이블
- [ ] **SEARCH-06**: 퀵 필터 뱃지 — 무료배송, 위클리특가, 3D, 렌트가능 토글 뱃지
- [x] **SEARCH-07**: 정렬 드롭다운 — 기본정렬, 연식순, 주행거리순, 가격순 (9개 옵션)
- [ ] **SEARCH-08**: 모바일 접이식 필터 — Collapsible/Sheet 기반 모바일 필터 UI

### Homepage & Navigation (HOME)

- [ ] **HOME-01**: 히어로 배너 캐러셀 — Embla autoplay 전체 너비 프로모션 배너 슬라이더
- [ ] **HOME-02**: 퀵링크 아이콘 바 — 무료배송, 위클리특가, 기획전, 렌트특가, 테마기획전
- [ ] **HOME-03**: 추천 차량 섹션 — 인기/최신/특가 차량 카드 그리드
- [ ] **HOME-04**: 글로벌 헤더 리디자인 — K Car 스타일 로고 + 중앙 검색바 + 로그인/회원가입 + 메가메뉴 네비게이션
- [ ] **HOME-05**: 글로벌 푸터 리디자인 — 회사정보, 고객센터, SNS 링크, 수상내역, 앱 다운로드
- [ ] **HOME-06**: 브레드크럼 내비게이션 — 전체 페이지에 일관된 브레드크럼 적용

### Admin Refresh (ADMIN)

- [ ] **ADMIN-01**: 어드민 대시보드 디자인 언어 통일 — 새로운 색상/타이포그래피 토큰 적용
- [ ] **ADMIN-02**: 차량 비교 테이블 개선 — 나란히 스펙 비교 + 시각적 차이 하이라이팅
- [ ] **ADMIN-03**: 전체 리디자인 페이지 모바일 반응형 검증 (375px viewport)
- [ ] **ADMIN-04**: 데모 플로우 재검증 — 계약 신청 → PDF 생성 전체 흐름 리그레션 테스트

## Future Requirements (v3.0)

### 지도/위치
- **MAP-01**: 카카오맵 직영점 위치 표시
- **MAP-02**: 딜러 프로필 카드

### 렌트
- **RENT-01**: 렌트 전용 페이지 (렌트 방식/개월수/렌트비 필터)
- **RENT-02**: 친환경차 토글

### 기타
- **EXT-01**: 360도 사진 시퀀스 뷰어
- **EXT-02**: 실제 eKYC API 연동
- **EXT-03**: 전자서명 API 연동
- **EXT-04**: PG 결제 연동
- **EXT-05**: 소셜 로그인 (카카오/네이버)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 카카오맵 직영점 | v2.0 범위 제외 -- API 키 등록 필요, 별도 phase |
| 렌트 전용 페이지 | v2.0 범위 제외 -- 기존 렌트 기능 유지 |
| 360도 뷰어 | 복잡도 대비 낮은 우선순위 |
| 네이티브 앱 | v3.0+ Capacitor |
| 실시간 채팅 | v3.0+ |
| AI 차량 추천 | v3.0+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | Phase 13 | Complete |
| COMP-02 | Phase 13 | Complete |
| COMP-03 | Phase 13 | Complete |
| COMP-04 | Phase 13 | Complete |
| DETAIL-01 | Phase 14 | Complete |
| DETAIL-02 | Phase 14 | Complete |
| DETAIL-03 | Phase 14 | Complete |
| DETAIL-04 | Phase 14 | Complete |
| DETAIL-05 | Phase 14 | Complete |
| DETAIL-06 | Phase 14 | Complete |
| DETAIL-07 | Phase 14 | Complete |
| DETAIL-08 | Phase 14 | Complete |
| DETAIL-09 | Phase 14 | Complete |
| DETAIL-10 | Phase 14 | Complete |
| DETAIL-11 | Phase 14 | Complete |
| DETAIL-12 | Phase 14 | Complete |
| SEARCH-01 | Phase 15 | Complete |
| SEARCH-02 | Phase 15 | Complete |
| SEARCH-03 | Phase 15 | Pending |
| SEARCH-04 | Phase 15 | Complete |
| SEARCH-05 | Phase 15 | Complete |
| SEARCH-06 | Phase 15 | Pending |
| SEARCH-07 | Phase 15 | Complete |
| SEARCH-08 | Phase 15 | Pending |
| HOME-01 | Phase 16 | Pending |
| HOME-02 | Phase 16 | Pending |
| HOME-03 | Phase 16 | Pending |
| HOME-04 | Phase 16 | Pending |
| HOME-05 | Phase 16 | Pending |
| HOME-06 | Phase 16 | Pending |
| ADMIN-01 | Phase 17 | Pending |
| ADMIN-02 | Phase 17 | Pending |
| ADMIN-03 | Phase 17 | Pending |
| ADMIN-04 | Phase 17 | Pending |

**Coverage:**
- v2.0 requirements: 34 total
- Mapped to phases: 34/34
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
