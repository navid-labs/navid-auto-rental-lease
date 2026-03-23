# Navid Auto — 중고차 렌탈/리스 플랫폼

## What This Is

한국 시장을 타겟으로 한 웹 퍼스트(Web-First) 중고차 렌탈/리스 플랫폼. B2B2C + 자사 운영 하이브리드 모델로, 딜러가 차량을 등록하고 고객이 검색/비교/계약하는 마켓플레이스이자 자사 보유 차량도 함께 운영하는 통합 플랫폼. 비대면 계약 프로세스(eKYC, 전자계약)를 통해 온라인 완결형 중고차 렌탈/리스 경험을 제공한다.

## Core Value

고객이 중고차를 온라인에서 검색하고, 비교하고, 비대면으로 렌탈/리스 계약까지 완료할 수 있는 원스톱 경험.

## Requirements

### Validated (v1 Demo Complete — 2026-03-10)

- [x] 차량 검색/필터/비교 기능 (Phase 5)
- [x] 차량 상세 정보 조회 — 제원, 사진 갤러리, 가격 (Phase 5)
- [x] 번호판 기반 차량 정보 자동 조회 — Mock Provider + 어댑터 패턴 (Phase 3)
- [x] 회원가입/로그인 — 이메일/비밀번호, Supabase Auth (Phase 2)
- [x] 역할 기반 접근 제어 — 고객/딜러/관리자, 미들웨어 RLS (Phase 2)
- [x] 딜러 차량 등록/수정/삭제 — 3단계 위자드, 이미지 업로드 (Phase 3)
- [x] 관리자 차량 등록/수정/삭제 — 자사 재고 + Sheet 편집 (Phase 3, 9)
- [x] 렌탈/리스 계약 신청 플로우 — 4단계 위자드 (Phase 7)
- [x] eKYC 모의 플로우 — 인증코드 입력 UI + DB 기록 (Phase 7)
- [x] 계약서 PDF 자동 생성 및 다운로드 — @react-pdf/renderer (Phase 8)
- [x] 실시간 차량 상태 업데이트 — Supabase Realtime (Phase 7)
- [x] 마이페이지 — 계약 현황, 상태 필터, PDF 다운로드 (Phase 8)
- [x] 관리자 대시보드 — 차량/계약/사용자 CRUD + Recharts 통계 (Phase 9)
- [x] 잔존가치 자동 산정 — 브랜드/모델/연식별 관리자 테이블 (Phase 6)
- [x] 반응형 웹 디자인 — 모바일 카드 레이아웃, skeleton loading (Phase 9)

### Validated (v2.0 K Car Style Redesign — 2026-03-23)

- ✓ K Car 스타일 차량 검색 페이지 (15개 필터 + 무한스크롤 + 비교함) — v2.0
- ✓ K Car 스타일 차량 상세 페이지 (10개 정보 섹션 + Sticky 사이드바) — v2.0
- ✓ K Car 스타일 차량 카드 디자인 (배지, 보증 바, 스펙라인, 태그) — v2.0
- ✓ K Car 스타일 홈페이지 (히어로 배너, 퀵링크, 추천 차량) — v2.0
- ✓ K Car 스타일 글로벌 네비게이션 + 푸터 + 브레드크럼 — v2.0
- ✓ 차량 진단결과/과거이력/보증 타임라인 UI — v2.0
- ✓ 어드민 디자인 토큰 통일 + 비교 하이라이팅 — v2.0
- ✓ 모바일 375px 반응형 검증 + 리그레션 테스트 (439 tests) — v2.0

### Validated (v2.1 Visual Polish — 2026-03-23)

- ✓ 네비게이션 바 52px 높이 + 전 페이지 24px 상단 여백 통일 — v2.1
- ✓ 홈페이지 섹션 간 80px+ 여백 + 추천차량 3열 그리드 — v2.1
- ✓ 검색 섹션 패딩 40px+ 확대 + 프로모션 카드 24px 간격 — v2.1
- ✓ 검색 페이지 차량 카드 gap 24px + 내부 패딩 16px — v2.1
- ✓ 상세 페이지 브레드크럼 내비게이션 + 24px 여백 — v2.1
- ✓ 비슷한 차량 3열 그리드 + 섹션 카드 32px 균일 간격 — v2.1

### Active

_(No active requirements — next milestone pending)_

### Out of Scope

- 실제 eKYC API 연동 (CLOVA 등) — v1은 모의 플로우, v2에서 실연동
- 전자서명 API 연동 (모두싸인 등) — v1은 PDF 생성만, v2에서 실연동
- 결제/PG 연동 — 결제 방식 미확정, 추후 논의
- 네이티브 모바일 앱 — v2에서 Capacitor로 패키징 예정
- 다국어 지원 — 한국 시장 한국어 전용
- 실시간 채팅/상담 — v2 이후 검토
- 차량 보험/정비 관리 — v1 범위 외

## Context

- **비즈니스 모델:** B2B2C + 자사 운영 하이브리드. 딜러가 차량을 등록하면 관리자 승인 후 노출, 자사 보유 차량은 관리자가 직접 등록
- **계약 유형:** 단기 렌탈과 장기 리스 모두 지원. 리스는 잔존가치 산정 포함
- **v1 목표:** 데모/투자용 수준. 핵심 플로우 시연 가능한 프로덕트
- **외부 API:** 번호판 조회 API만 v1에서 실연동, 나머지(eKYC, 전자서명, PG)는 모의 플로우
- **타겟 시장:** 한국 중고차 렌탈/리스 시장

## Constraints

- **Tech Stack**: Next.js 15 (App Router), Supabase, Tailwind CSS + shadcn/ui, Vercel — 지정 스택 변경 불가
- **Language**: 한국어 단일 언어
- **DB Security**: Supabase RLS 필수 적용 — 멀티테넌트 데이터 격리
- **Deployment**: Vercel CI/CD — main 브랜치 병합 시 자동 배포
- **DB Schema**: 선언적 스키마(SQL 파일) — Git 버전 관리
- **Target**: 데모/투자용 MVP — 완벽한 프로덕션 수준 아닌 핵심 플로우 중심

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-First 전략 | 빠른 개발/배포, SEO, 크로스플랫폼 | ✅ 데모 완성 |
| Supabase BaaS 채택 | 인증/DB/Realtime 통합, 빠른 프로토타이핑 | ✅ Auth+RLS+Realtime 동작 |
| eKYC/전자서명 v1 모의 플로우 | v1은 데모용, 실연동은 비용/시간 절약 | ✅ Mock eKYC 완성 |
| 번호판 조회 API Mock Provider | 어댑터 패턴으로 향후 실API 교체 용이 | ✅ 플러거블 구조 |
| 딜러 등록 하이브리드 모델 | 자사+딜러 재고 통합 관리 유연성 | ✅ 승인 큐 동작 |
| shadcn/ui + base-ui 도입 | Tailwind v4 기반 일관된 UI | ✅ render prop 패턴 |
| Prisma (not Supabase REST) for data | RLS 우회 + 타입 안전성 + 서버 컴포넌트 | ✅ 264 테스트 통과 |
| PostgREST GRANT migration | 미들웨어 프로필 조회에 필요 | ✅ 2026-03-10 수정 |

## v1 최종 수치 (2026-03-10)

| 항목 | 수치 |
|------|------|
| Phases | 9/9 완료 |
| Plans | 22/22 완료 |
| Tests | 29파일, 264개 통과 |
| 차량 데이터 | 180대 (8 브랜드, 25 모델) |
| 데모 계정 | 9개 (admin 1 + dealer 3 + customer 5) |
| 계약 데이터 | 13건 (7개 상태 전부 커버) |
| 총 개발 시간 | ~1.05시간 (Plan 실행 기준) |

## Key Decisions (v2.1)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Layout-level pt-6 패턴 | 페이지별 padding 중복 제거, 단일 소스 | ✅ 전 페이지 24px 통일 |
| -mt-6 edge-to-edge 오버라이드 | 히어로/갤러리는 네비 바에 붙어야 함 | ✅ 선택적 적용 |
| 3-col 그리드 통일 | K Car 스타일 적정 밀도, 시각적 일관성 | ✅ 홈/검색/상세 동일 |

## Current State

**v2.1 Visual Polish shipped 2026-03-23.**
- 20 phases total (v1.0: 9, v1.1: 3, v2.0: 5, v2.1: 3), 52 plans executed
- 18 source files modified, +38/-23 lines in v2.1 (spacing-only CSS changes)
- 439 tests across 50 files, type-check clean
- 14/14 v2.1 requirements satisfied, 1 minor tech debt item

**v2.0 K Car Style Redesign shipped 2026-03-23.**
- 166 files modified, +25,221 lines
- K Car 수준의 검색/상세/홈 UI 완성, 비교 기능, 모바일 반응형

**v1.0 Demo MVP shipped 2026-03-10.**
- 9 phases, 22 plans, 213 source files, 18,276 LOC TypeScript

---

*Last updated: 2026-03-23 after v2.1 milestone completion*
