# Requirements: v1.1 Inventory Admin

**Reference:** https://inventory-ver0130.vercel.app/ (롯데렌터카 Biz car × AUTO.ST.)

## Phase 10: Inventory Data & Table UI

### REQ-V11-01: External Inventory Data Source
- 외부 재고 데이터를 가져오는 데이터 소스 어댑터
- 초기: JSON/CSV import 또는 API 연동 (플러그 가능한 어댑터 패턴)
- 전략구매/일반구매(현대·기아) 구분 지원
- 398건+ 대용량 데이터 처리 가능

### REQ-V11-02: Inventory Table with Virtual Scroll
- 대용량 재고 테이블 (가상 스크롤 또는 페이지네이션)
- 컬럼: 구분, 번호, 프로모션, 대표차종, 차종명, 옵션, 차량연식, 외장색, 내장색, 가격, 보조금, 판매가능수량, 즉시출고수량, 생산예시일, 공지
- 체크박스 행 선택 (다중 선택)
- 정렬 가능한 컬럼 헤더

### REQ-V11-03: Search & Filter
- 텍스트 검색 (차종, 옵션, 색상 등)
- 전략구매/일반구매 토글 필터
- 검색 결과 건수 표시 ("조회결과 N건")

### REQ-V11-04: Inventory Admin Page
- /admin/inventory 라우트
- 기존 admin 레이아웃과 통합
- 데이터 조회 버튼으로 로딩 트리거
- 반응형 (데스크톱 중심, 모바일 기본 지원)

## Phase 11: Quote Generation Engine

### REQ-V11-05: Quote Builder
- 테이블에서 선택한 차량들로 견적 생성
- 차량 미선택 시 견적 버튼 비활성화
- 견적 상세: 차량 정보 + 렌탈/리스 조건 + 월납입금 계산

### REQ-V11-06: Quote Calculation
- 기존 Phase 6 PMT 계산 로직 재활용
- 보조금, 프로모션 할인 반영
- 잔존가율 기반 리스 계산
- 렌탈/리스/할부 비교 견적

### REQ-V11-07: Quote PDF Export
- 견적서 PDF 다운로드
- 기존 Phase 8 PDF 생성 인프라 재활용
- 회사 로고, 딜러 정보, 차량 스펙, 가격 상세 포함

## Phase 12: Settings Management & Polish

### REQ-V11-08: Settings CRUD
- 관리자 비밀번호로 접근 제한 (설정 관리 진입 시 인증)
- 프로모션율 설정 (차종별/브랜드별)
- 보조금 금액 설정
- 기본 이율/잔존가율 설정

### REQ-V11-09: Data Management
- 재고 데이터 수동 갱신 (CSV 업로드)
- 마지막 업데이트 일시 표시
- 데이터 유효성 검증

### REQ-V11-10: UI Polish & Integration
- 전체 흐름 통합 테스트
- 로딩/에러 상태 처리
- 기존 admin 네비게이션에 "재고 관리" 메뉴 추가
