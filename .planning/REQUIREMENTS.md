# Requirements: Navid Auto v3.0 Hardening

**Defined:** 2026-03-27
**Core Value:** 고객이 중고차를 온라인에서 검색하고, 비교하고, 비대면으로 렌탈/리스 계약까지 완료할 수 있는 원스톱 경험

## v3.0 Requirements

gstack 종합 피드백(retro, cso, benchmark, design-review) 기반 프로덕션 품질 관문.

### Security

- [ ] **SEC-01**: middleware.ts를 proxy.ts로 리네임하고 Node.js 런타임으로 전환 (Next.js 16 마이그레이션)
- [ ] **SEC-02**: 미보호 API 엔드포인트 5개에 requireAuth/requireRole 가드 추가 (quote-pdf, ekyc/send-code, inquiry 등)
- [ ] **SEC-03**: 하드코딩 비밀번호 admin1234를 Bun.password argon2 해싱으로 교체
- [ ] **SEC-04**: 이미지 업로드에 서버사이드 MIME 타입 + magic byte 검증 추가
- [ ] **SEC-05**: 보안 헤더 추가 (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] **SEC-06**: next.config.ts에 보안 헤더 설정 적용

### Performance

- [ ] **PERF-01**: @fontsource/pretendard 제거 → Pretendard CDN 동적 서브셋 또는 next/font/local로 한국어 폰트 정상화 (3MB → 50-200KB)
- [ ] **PERF-02**: next experimental-analyze로 번들 분석 후 recharts/framer-motion dynamic import 적용
- [ ] **PERF-03**: 홈페이지 RSC prefetch 과다 해소 (59개 → prefetch={false} 선별 적용)
- [ ] **PERF-04**: 공개 페이지(홈, 차량 목록, 차량 상세)에 ISR revalidate 적용

### Design System

- [ ] **DS-01**: 브랜드 블루 #3B82F6으로 통일 (기존 #1A6DFF 43건 + 기타 블루 변형 교체)
- [ ] **DS-02**: ~10개 핵심 색상 CSS 변수 토큰 정의 (globals.css)
- [ ] **DS-03**: 394개 하드코딩 hex 값을 CSS 변수로 마이그레이션 (29개 파일)
- [ ] **DS-04**: 51개 outline-none에 focus-visible 대체 적용
- [ ] **DS-05**: prefers-reduced-motion 미디어 쿼리 지원 추가
- [ ] **DS-06**: 홈페이지 h1 요소 추가 (SEO + WCAG 1.3.1)
- [ ] **DS-07**: CSS 변수 기반 다크모드 토큰 체계 구축 (light/dark 전환 가능)

### Code Quality

- [ ] **CQ-01**: @vitest/coverage-v8 설치 + 커버리지 베이스라인 측정
- [ ] **CQ-02**: API 라우트 핸들러 행동 테스트 추가 (인증, 계약, 검색 핵심 플로우)
- [ ] **CQ-03**: 테스트 커버리지 30%+ 달성 (현재 3.9%)
- [ ] **CQ-04**: 기술 부채 정리 — orphaned 모듈, native confirm() 대화상자, 라우트 버그
- [ ] **CQ-05**: CSP Content-Security-Policy-Report-Only 모드 적용 + 위반 로그 엔드포인트

## Future Requirements (v4.0+)

### Security
- **SEC-F01**: CSP 강제(enforcing) 모드 전환 -- v3.0에서 Report-Only 데이터 수집 후
- **SEC-F02**: Rate limiting 적용 (Vercel WAF 또는 Upstash) -- Vercel 플랜 결정 후

### Performance
- **PERF-F01**: Edge caching 전략 수립 -- 프로덕션 트래픽 패턴 분석 후
- **PERF-F02**: 이미지 CDN + WebP 자동 변환 -- 프로덕션 배포 후

### Design
- **DS-F01**: 다크모드 UI 전체 적용 -- v3.0에서 토큰 체계 구축 후

## Out of Scope

| Feature | Reason |
|---------|--------|
| Next.js 16 → 17 메이저 업그레이드 | v3.0은 현 버전 내 개선에 집중, 메이저 업그레이드는 별도 마일스톤 |
| 실시간 채팅/상담 | 기능 확장이 아닌 품질 개선 마일스톤 |
| 결제/PG 연동 | 비즈니스 결정 미확정 |
| Playwright E2E 테스트 인프라 | 단위/통합 테스트 우선, E2E는 별도 계획 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 21 | Pending |
| SEC-02 | Phase 22 | Pending |
| SEC-03 | Phase 22 | Pending |
| SEC-04 | Phase 22 | Pending |
| SEC-05 | Phase 21 | Pending |
| SEC-06 | Phase 21 | Pending |
| PERF-01 | Phase 21 | Pending |
| PERF-02 | Phase 24 | Pending |
| PERF-03 | Phase 24 | Pending |
| PERF-04 | Phase 24 | Pending |
| DS-01 | Phase 23 | Pending |
| DS-02 | Phase 21 | Pending |
| DS-03 | Phase 23 | Pending |
| DS-04 | Phase 23 | Pending |
| DS-05 | Phase 23 | Pending |
| DS-06 | Phase 23 | Pending |
| DS-07 | Phase 23 | Pending |
| CQ-01 | Phase 21 | Pending |
| CQ-02 | Phase 25 | Pending |
| CQ-03 | Phase 25 | Pending |
| CQ-04 | Phase 25 | Pending |
| CQ-05 | Phase 25 | Pending |

**Coverage:**
- v3.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
