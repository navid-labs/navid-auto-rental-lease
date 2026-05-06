---
title: Prisma schema 변경안 (적용 X — human 검토용)
date: 2026-05-06
type: research
status: proposal
applies_to: prisma/schema.prisma
related:
  - 2026-05-06-eacar-platform-audit.md
  - 2026-05-06-kcar-detail-schema.md
  - 2026-05-06-transfer-pipeline-audit.md
warning: |
  본 문서는 schema 변경안 초안. 실제 적용은 `prisma/migrations/**`로 수동 작성 필요.
  `.harness/routing.md`에 따라 prisma 변경은 owner=claude + human required + cross-cutting #3 영향 가능.
  TASK 카드로 dispatch 금지 — 사람이 직접 작성 후 `prisma migrate dev`.
---

## 변경 요약

| 변경 | 종류 | 위험 | cross-cutting |
|---|---|---|---|
| `Listing` 신규 필드 11개 | additive | low | #3 (매물 승인 파이프라인) — `optionsByCategory`/`acquisitionMethod`가 매물 카드 표시 조건에 영향 가능 |
| 신규 enum `AcquisitionMethod` | additive | low | — |
| 신규 모델 `PromotionProduct` | additive | low | — |
| 신규 모델 `PromotionPurchase` | additive | medium | LIST 정렬 boost 로직과 결제 흐름 동시 변경 시 split 필요 |
| 신규 모델 `AgentRequest` | additive | medium | 빠른승계 신청 → 매물 우선노출 → 정산 cross-cutting (#1, #3 모두 접점) |
| 신규 모델 `SellerPayment` | additive | high | #1 (에스크로 상태 머신)과 인접. **별도 모델로 분리해 invariant 보존** |
| `EscrowPayment` 변경 | **변경 없음** | — | invariant 보존 위해 buyer→seller 차값 결제만 담당. 매도자 부담 수수료는 `SellerPayment`로 분리 |

---

## 1. enum 추가

```prisma
enum AcquisitionMethod {
  OPTIONAL    // 선택인수 (만기 시 인수 또는 반환)
  MANDATORY   // 의무인수 (만기 시 반드시 인수)
  NONE        // 인수 없음 (만기 반환 — 일반적으로 렌트)
}

enum PromotionSlot {
  LIST_TOP        // 리스트 최상단 고정
  HOME_CAROUSEL   // 홈 메인 캐러셀 노출
  CATEGORY_BADGE  // 카드에 추천 배지
  AI_PRESS        // AI 보도자료 본문 자동 생성
  QUICK_PACKAGE   // 빠른승계 통합 패키지 (대행 + 위 슬롯 묶음)
}

enum PromotionPurchaseStatus {
  PENDING
  ACTIVE
  EXPIRED
  REFUNDED
}

enum AgentRequestStatus {
  REQUESTED          // 매도자가 빠른승계 신청
  IN_PROGRESS        // 매니저 배정 + 진행중
  CONTRACTED         // 계약 체결
  COMPLETED          // 거래 완료 (정산 트리거)
  CANCELED           // 취소
}

enum SellerPaymentKind {
  PROMOTION       // 노출 강화 상품 결제
  AGENT_FEE       // 빠른승계 완료 수수료 (시세의 4-5%)
}

enum SellerPaymentStatus {
  PENDING
  PAID
  REFUNDED
}

// NotificationType에 추가
enum NotificationType {
  CHAT_MESSAGE
  ESCROW_STATUS
  LEAD_ASSIGNED
  LISTING_APPROVED
  LISTING_LIKED
  AGENT_REQUEST_STATUS    // 신규
  PROMOTION_EXPIRED        // 신규
  SELLER_PAYMENT_DUE       // 신규
}
```

---

## 2. `Listing` 확장 필드

```prisma
model Listing {
  // ... 기존 필드 유지 ...

  // 계약 정보 확장
  contractMonths     Int?                @map("contract_months")              // 60 (총 계약기간)
  contractEndDate    DateTime?           @map("contract_end_date")            // 2029-06-01
  acquisitionMethod  AcquisitionMethod?  @map("acquisition_method")           // OPTIONAL/MANDATORY/NONE
  residualValue      Int?                @map("residual_value")               // 인수금/잔존가치 (KRW)
  driverMinAge       Int?                @map("driver_min_age")               // 26 (만 N세 이상)

  // 차량 기본 확장
  registrationDate     DateTime? @map("registration_date")                    // 2024-06-01 (최초등록일)
  fuelEfficiency       Decimal?  @map("fuel_efficiency") @db.Decimal(4,1)     // 13.5 (km/L)
  fuelEfficiencyGrade  Int?      @map("fuel_efficiency_grade")                // 3 (연비 등급 1-5)
  lowEmissionGrade     Int?      @map("low_emission_grade")                   // 2 (저공해 1/2/3종)

  // 옵션 카테고리화 (이어카/K카 미러링)
  optionsByCategory    Json?     @map("options_by_category")
  // 형식: { "시트": ["전동시트(운전석)", "열선시트"], "에어백": ["운전석", "동승석", ...], ... }

  // 진단 데이터 (기존 inspectionChecklist 표준화)
  // K카 매핑: { exteriorPanel: { repaint, replace }, mainFrame: { repaint, replace },
  //            interior: { issues }, tires: { issues }, consumables: { issues },
  //            chassis: { issues }, notes: [] }
  // 변경 없이 inspectionChecklist Json 그대로 사용 — 표준 키 합의만 필요

  // 신뢰 정보 확장
  damageHistory       Boolean   @default(false) @map("damage_history")        // 내차 피해
  cautionHistory      String[]  @default([]) @map("caution_history")          // 주의이력 항목

  // 통계 확장
  chatCount           Int       @default(0) @map("chat_count")                // 이어카 표시 항목

  // 관계 추가
  agentRequest        AgentRequest?        @relation("ListingAgentRequest")
  promotionPurchases  PromotionPurchase[]
  sellerPayments      SellerPayment[]      @relation("ListingSellerPayments")
}
```

---

## 3. `PromotionProduct` 신규

```prisma
model PromotionProduct {
  id            String         @id @default(uuid()) @db.Uuid
  slug          String         @unique           // "quick-transfer", "list-top-7d", ...
  name          String                            // "빠른승계 패키지"
  description   String?                           // 마케팅 설명
  slot          PromotionSlot                     // 노출 슬롯
  durationDays  Int                               // 7, 14, 30 — 기간형. 0이면 영구.
  price         Int                               // 결제 금액 (KRW)
  feeRate       Decimal?       @db.Decimal(4,3)   // 0.040 (= 4%, 거래 완료 % 모델인 경우)
  isActive      Boolean        @default(true) @map("is_active")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  purchases     PromotionPurchase[]

  @@map("promotion_products")
}
```

---

## 4. `PromotionPurchase` 신규

```prisma
model PromotionPurchase {
  id          String                  @id @default(uuid()) @db.Uuid
  listingId   String                  @map("listing_id") @db.Uuid
  productId   String                  @map("product_id") @db.Uuid
  sellerId    String                  @map("seller_id") @db.Uuid
  status      PromotionPurchaseStatus @default(PENDING)
  startsAt    DateTime?               @map("starts_at")
  endsAt      DateTime?               @map("ends_at")
  paymentId   String?                 @map("payment_id") @db.Uuid     // SellerPayment.id
  createdAt   DateTime                @default(now()) @map("created_at")
  updatedAt   DateTime                @updatedAt @map("updated_at")

  listing  Listing          @relation(fields: [listingId], references: [id], onDelete: Cascade)
  product  PromotionProduct @relation(fields: [productId], references: [id])

  @@index([listingId, status])
  @@index([status, endsAt])
  @@map("promotion_purchases")
}
```

---

## 5. `AgentRequest` 신규 (빠른승계 신청)

```prisma
model AgentRequest {
  id              String              @id @default(uuid()) @db.Uuid
  listingId       String              @unique @map("listing_id") @db.Uuid
  sellerId        String              @map("seller_id") @db.Uuid
  status          AgentRequestStatus  @default(REQUESTED)
  assignedAgentId String?             @map("assigned_agent_id") @db.Uuid    // DEALER/ADMIN role
  requestedAt     DateTime            @default(now()) @map("requested_at")
  contractedAt    DateTime?           @map("contracted_at")
  completedAt     DateTime?           @map("completed_at")
  feeRate         Decimal             @default(0.040) @db.Decimal(4,3)      // 4%
  feeAmount       Int?                @map("fee_amount")                     // 정산 금액 (KRW)
  marketPrice     Int?                @map("market_price")                   // 시세 기준가 (4% 산정 base)
  notes           String?
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  listing  Listing  @relation("ListingAgentRequest", fields: [listingId], references: [id], onDelete: Cascade)

  @@index([status, requestedAt])
  @@map("agent_requests")
}
```

---

## 6. `SellerPayment` 신규 (매도자 부담 결제)

```prisma
model SellerPayment {
  id           String              @id @default(uuid()) @db.Uuid
  sellerId     String              @map("seller_id") @db.Uuid
  listingId    String?             @map("listing_id") @db.Uuid
  kind         SellerPaymentKind
  amount       Int
  status       SellerPaymentStatus @default(PENDING)
  pgOrderId    String?             @map("pg_order_id")
  pgPaymentKey String?             @map("pg_payment_key")
  paidAt       DateTime?           @map("paid_at")
  refundedAt   DateTime?           @map("refunded_at")
  createdAt    DateTime            @default(now()) @map("created_at")
  updatedAt    DateTime            @updatedAt @map("updated_at")

  listing  Listing? @relation("ListingSellerPayments", fields: [listingId], references: [id])

  @@index([sellerId, status])
  @@index([listingId, kind])
  @@map("seller_payments")
}
```

---

## 7. 적용 시 주의사항

1. **`Listing` 확장 필드는 모두 nullable** — 기존 데이터 마이그레이션 없이 적용 가능. 단 sell wizard는 인수방법/잔존가치 입력 단계 추가 필요.
2. **`SellerPayment`는 `EscrowPayment`와 완전 분리** — buyer→seller 차값 결제 로직(invariant #1)에 영향 없음.
3. **`AgentRequest.status` 전이 규칙**은 별도 문서화 필요 (`REQUESTED → IN_PROGRESS → CONTRACTED → COMPLETED`, REQUESTED → CANCELED 가능, IN_PROGRESS 후엔 CANCELED 불가).
4. **`PromotionPurchase.status: ACTIVE`** 매물의 LIST 정렬 boost는 query 레벨 처리 (인덱스 추가됨). 별도 cron이 `endsAt < now()`인 ACTIVE → EXPIRED 전환 필요.
5. **마이그레이션 실행 순서**:
   - (1) enum 추가
   - (2) Listing 컬럼 추가 (nullable)
   - (3) 신규 모델 4개 추가
   - (4) 인덱스 추가
   - 한 번의 마이그레이션 파일에 묶어도 무방.
6. **차용 routing.md 룰**: `prisma/schema.prisma` = `codex-strict + claude + human`, `prisma/migrations/**` = `claude + human only`. 본 변경은 **claude가 직접 작성**해 사람 검토 후 적용.

---

## 8. 다음 단계

1. 본 문서 사람 검토 → 필드명·enum 값 확정
2. `claude`가 `prisma/schema.prisma` 직접 수정 + `bun prisma migrate dev --name add-promotion-and-agent-models` 실행
3. mock data fixture (TASK-005)에 신규 필드 포함시켜 e2e 표시 검증
4. Phase 2 UI TASK 묶음 dispatch
