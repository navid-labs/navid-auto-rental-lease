---
title: 차용 vs 이어카 — 승계/리스 파이프라인 6단계 점검
date: 2026-05-06
type: research
related:
  - 2026-05-06-eacar-platform-audit.md
  - 2026-05-06-kcar-detail-schema.md
  - 2026-05-06-prisma-schema-diff.md
---

## 한 줄 결론

차용 현재 승계 파이프라인은 **(1) 등록 / (4) 문의 / (5) 계약(에스크로)**의 코어 3단계는 단단하나, **(2) 검수 / (3) 노출 강화 / (6) 완료 정산**이 비어있음. 이어카는 6단계 모두 코어 + 빠른승계 패키지(대행/노출/홍보/AI보도)로 단일 SKU 4% 수수료 모델. 차용은 (2)(3)(6) 보강이 Phase 1 핵심.

---

## 6단계 매트릭스

| # | 단계 | 차용 현재 | 이어카 | 갭 / 액션 |
|---|---|---|---|---|
| 1 | **등록 (Sell)** | `src/features/sell/sell-wizard.tsx` (3+ 단계, plate-lookup, photo-guide) — 무료 | 무료, 셀프 등록 + 빠른승계 옵션 토글 | ✓ 정합. 이어카는 등록 직후 매니저가 후속 연락(빠른승계 신청 시) |
| 2 | **검수 (Approve)** | Prisma `Listing.status: PENDING → ACTIVE` + `isVerified` 플래그 + `inspectionChecklist`. **admin UI에 승인 버튼은 있으나 실제 검수 SLA/기준 문서화 안 됨** | 명시 안 됨 (추정: 매니저가 1차 검수 후 빠른승계 매물은 우선 노출) | **갭**: 검수 기준·시한 매뉴얼화 필요. 일반 매물 vs 빠른승계 매물 우선순위 분리. cross-cutting #3 (매물 승인 파이프라인) 영향 |
| 3 | **노출 (List + Detail)** | LIST는 정렬·필터 빈약(2026-04-16 벤치 메모리 참조), DETAIL은 갤러리 단일·옵션 평탄·동일차종 추천 없음 | 빠른승계 배지 + 리스트 최상단 + 동일 차종 그리드 + AI 보도자료 본문 | **갭(큼)**: ① 빠른승계 배지 컬럼 ② LIST 정렬에 PromotionPurchase boost ③ DETAIL 옵션 카테고리 ④ 동일 차종 추천 API |
| 4 | **문의 (Chat + Lead)** | `ChatRoom` per (listing, buyer) + `contact-filter.ts` + `ConsultationLead` + `MessageType: TEXT/IMAGE/SYSTEM` | 채팅 + 매니저 사이드바 + 간편상담 모달 (승계상담/신차상담) | **소갭**: ① 매니저(DEALER) 사이드바 카드 ② 간편상담 모달이 차용에는 가이드 페이지에만 있음. 상세 페이지에 필요 |
| 5 | **계약 (Escrow)** | 토스페이먼츠 + `EscrowPayment(PENDING→PAID→RELEASED/REFUNDED/DISPUTED)` + admin/escrow 대시보드 | PG: 다날·카카오페이 (이어카 위탁업체 명시). 정확한 계약 흐름은 비공개 | ✓ 차용이 더 명시적. invariant 이미 있음 (`payment/**` cross-cutting #1) |
| 6 | **완료 정산 (Payout)** | **없음** — `EscrowStatus.RELEASED`는 buyer→seller 차값 송금만. 플랫폼 수수료 부과/매도자 정산 모듈 부재 | 빠른승계 4% 수수료를 거래 완료 시 매도자에게 청구 (운영 매뉴얼 추정) | **갭(큼)**: ① `SellerPayment(kind: AGENT_FEE)` 모델 ② 정산 워크플로 ③ admin/escrow 대시보드 확장 ④ cross-cutting #1 (에스크로 상태 머신) 영향 |

---

## Cross-cutting invariants 영향도

차용 `.harness/routing.md`에 명시된 4개 cross-cutting invariant 중 본 작업이 건드는 항목:

| Invariant | 영향 | 처리 |
|---|---|---|
| #1 에스크로 상태 머신 | 6단계 정산 추가 시 `EscrowPayment` 또는 별도 `SellerPayment` 둘 중 하나 — 별도 모델로 분리해 invariant 보존 | TASK 분리 (cross-cutting 안 건드는 mockup·UI 먼저, 정산은 별도 TASK 묶음) |
| #2 인증 흐름 | 변경 없음 |  |
| #3 매물 승인 파이프라인 | 검수 SLA·우선순위 룰 추가 시 `Listing.status` 전이 + admin UI + Notification 동시 변경 | claude split: status 룰 / admin UI / Notification 각 1 TASK |
| #4 연락처 필터 | 변경 없음 |  |

---

## Phase 분할

### Phase 1 (이번 작업 산출물 — 즉시 codex-fast 가능)

- TASK-005 mockup 데이터 (sample-listings.ts) — codex-fast
- TASK-006 옵션 카테고리 그룹핑 헬퍼 — codex-fast
- TASK-007 빠른승계 배지 컴포넌트 (`<QuickTransferBadge />`) — codex-fast
- TASK-008 매물 카드에 배지 prop 추가 — codex-fast

### Phase 1.5 (research → human 검토 후)

- prisma diff 적용 (`acquisitionMethod`, `residualValue`, `driverMinAge`, `contractMonths`, `contractEndDate`, `fuelEfficiency`, `lowEmissionGrade`, `optionsByCategory: Json`) — **claude + human only** (`prisma/migrations/**`)
- 신규 모델 (`PromotionProduct`, `PromotionPurchase`, `AgentRequest`, `SellerPayment`) — 동일

### Phase 2 (스키마 적용 후)

- 매물 상세 페이지 옵션 카테고리 섹션 (codex-fast)
- 동일 차종 추천 API + 그리드 (codex-fast)
- 매니저 사이드바 카드 (codex-fast)
- 간편상담 모달 상세 페이지 통합 (codex-fast)

### Phase 3 (비즈니스 로직)

- 빠른승계 신청 워크플로 (`/agent-request` 페이지 + `AgentRequest` API + admin)
- PromotionPurchase 결제 (토스페이먼츠 별건) + LIST 정렬 boost
- 정산 모듈 (`SellerPayment(kind: AGENT_FEE)` + admin)
- 모두 strict + claude + human (cross-cutting 영향)

### Phase 4 (Phase 2 조사 후)

- 엔카·KB·헤이딜러 광고 상품 카탈로그 — 보조 소스 수집 후 SKU 분화
- AI 보도자료 자동 생성 (Vercel AI Gateway)
- 커뮤니티/신차/안전거래 페이지

---

## Phase 2 추가 조사 필요 항목

- 엔카/KB차차차 매도자 광고 카탈로그 (앱스토어 스크린샷, 영업제안서, 매도자 후기 블로그)
- 헤이딜러 매도자 정산 흐름 (앱 내 매도자 대시보드 스크린샷)
- 이어카 거래 완료 후 매도자 정산 실측 (실제 매물 등록·완료 사이클 또는 매도자 인터뷰)
- 차용 `inspectionChecklist: Json` 구조 표준화 (현재는 freeform Json)
