# Phase 8: Contract Completion & My Page - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

고객이 승인된 계약서를 PDF로 다운로드하고, 마이페이지에서 모든 계약의 현재 상태를 확인할 수 있는 셀프서비스 경험. Requirements: CONT-03 (계약 PDF 자동생성), CONT-04 (고객 마이페이지 계약 상태 추적), UIEX-03 (마이페이지 계약 목록 + PDF 다운로드).

</domain>

<decisions>
## Implementation Decisions

### PDF 콘텐츠 포맷
- 렌탈/리스 공통 템플릿 + 타입 표시 (렌탈 계약서 / 리스 계약서)
- 리스 계약서에만 잔존가치/잔존율 섹션 추가
- 경쟁사(웰릭스) 참고: 계약서 본문(당사자/차량/조건/결제) + 약관 + 서명란 구조

### 마이페이지 계약 목록
- 콤팩트 카드 레이아웃: 차량명 + 계약타입(렌탈/리스) + 상태뱃지 + 월납금 + 기간
- 클릭 시 기존 /contracts/[id] 상세페이지로 이동
- 상태별 필터 탭: "전체" / "진행중" / "완료" / "취소" (Phase 4 admin searchParams 탭 패턴 재사용)

### 다운로드 전략
- 요청 시 실시간 생성 (Storage 저장 없음)
- 계약 데이터 변경 시 항상 최신 반영
- Supabase Storage 불필요 — API route에서 직접 스트리밍 응답

### Claude's Discretion
- PDF 생성 라이브러리 선택 (react-pdf, jsPDF 등 — Vercel serverless 호환성과 한글 지원 기준)
- 서버사이드 vs 클라이언트사이드 렌더링 위치
- Vercel 10초 타임아웃 대비 전략
- PDF 보안 수준 (워터마크, 다운로드 인증 등)
- PDF 브랜딩 수준 (로고, 색상, 폰트 — 기존 디자인 시스템 고려)
- PDF 콘텐츠 범위 (핵심만 vs 약관 포함)
- PDF 파일명 패턴
- PDF 다운로드 권한 범위 (본인만 vs 딜러/admin 포함)
- 마이페이지 레이아웃 (탭 vs 단일 페이지)
- 다운로드 버튼 위치 및 UX (상세 고정 CTA vs 목록에서도 가능)
- 빈 상태 디자인 및 CTA 유도 방식
- PDF 생성 실패 시 에러 UX
- 계약 제출 후 리다이렉트 목적지 (Phase 7 흐름 수정)
- 모바일 PDF 다운로드 UX
- 모바일 카드 레이아웃
- 계약 상태 변경 알림 방식 (Realtime 활용 범위)

</decisions>

<specifics>
## Specific Ideas

- 경쟁사(웰릭스) 계약서 PDF 구조 참고: 상단 로고 + 컬러 헤더바, 테이블 기반 라벨-값 쌍 레이아웃, 계약서 본문 + 약관 + 개인정보동의서 구성. Navid는 Demo 수준에 맞게 핵심만 깔끔하게.
- 웰릭스 12페이지 (고객용/회사용 2부 + 약관 + 동의서) → Navid는 1-2페이지 핵심 정보 중심
- Phase 7에서 contract wizard 제출 후 현재 차량 상세로 리다이렉트 → Phase 8에서 마이페이지/계약상세로 변경 가능

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/contracts/components/contract-status-tracker.tsx`: 계약 진행 상태 시각 타임라인 — 마이페이지 상세에서 재사용
- `src/features/contracts/components/contract-status-badge.tsx`: 상태 뱃지 — 계약 카드에 재사용
- `src/features/contracts/utils/contract-machine.ts`: 상태 전이 + 한글 라벨 + 색상 — PDF 및 목록에서 활용
- `src/lib/finance/calculate.ts`: calculateRental(), calculateLease() — PDF 계산 내역 표시
- `src/lib/finance/quote-calculator.ts`: calculateQuote() — 세금 포함 상세 견적
- `src/lib/utils/format.ts`: formatKRW(), formatDate() — PDF/목록 포맷팅
- `src/features/contracts/hooks/use-contract-realtime.ts`: Supabase Realtime 구독 — 마이페이지에서 재사용
- `src/features/contracts/types/index.ts`: ContractWithVehicle 타입 — 목록/상세 데이터 구조
- Phase 4 admin searchParams 탭 패턴 — 상태 필터 탭에 재사용

### Established Patterns
- Server Actions for mutations (create-contract, approve-contract, submit-ekyc)
- Zod + react-hook-form + zodResolver for validation
- Server Components by default, 'use client' for interactive
- Prisma $transaction for atomic updates
- getCurrentUser() + ownership check for protected routes
- Supabase Realtime + router.refresh() for live updates

### Integration Points
- `src/app/(protected)/mypage/page.tsx`: 기존 ProfileForm만 있음 — 계약 목록 추가 필요
- `src/app/(protected)/contracts/[id]/page.tsx`: 기존 계약 상세 — PDF 다운로드 버튼 추가
- `/api/contracts/[id]/pdf` (새로 생성): PDF 생성 + 스트리밍 API route
- Phase 7 contract wizard 리다이렉트 수정 대상: `src/features/contracts/components/step-terms.tsx`
- Prisma RentalContract / LeaseContract 모델: PDF 데이터 소스
- No PDF library installed yet — package.json에 추가 필요

</code_context>

<deferred>
## Deferred Ideas

- PDF 비밀번호 보호 / 전자서명 — v2 (INTG-V2-02 Modusign)
- PDF 약관 전문 포함 (21개 조항) — v2에서 법률 검토 후
- 개인정보 수집·이용 동의서 PDF — v2
- 고객용/회사용 2부 출력 — v2
- 이메일 알림 (계약 승인 시) — v2 (UIEX-V2-02)
- PDF 저장소 관리 (Supabase Storage) — v2 확장 시

</deferred>

---

*Phase: 08-contract-completion-my-page*
*Context gathered: 2026-03-10*
