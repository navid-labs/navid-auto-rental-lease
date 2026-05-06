---
title: Prisma schema 변경안 v2 — K카 진단/보험이력/평가사 + 엔카 광고 SKU 보강
date: 2026-05-06
type: research
status: proposal (v1 supersedes)
applies_to: prisma/schema.prisma
related:
  - 2026-05-06-prisma-schema-diff.md (v1)
  - 2026-05-06-kcar-live-detail-EC60897220.md
  - 2026-05-06-ad-products-benchmark.md
warning: |
  v1 (`2026-05-06-prisma-schema-diff.md`) + 본 문서(v2) 합쳐서 final 적용.
  v1 = enum 6개 + Listing 11필드 + 신규 모델 4개.
  v2 = K카 진단·보험이력·평가사 코멘트·옵션 출고가 + PromotionSlot 확장 + 시드 데이터 명세.
  실제 적용은 `prisma/migrations/**`로 사람이 수동 작성 — Codex Fast 금지.
---

## v2 변경 요약

| 변경 | 종류 | 위험 | 누적 (v1+v2) |
|---|---|---|---|
| `Listing` 추가 필드 8개 (K카 진단/보험이력/평가사) | additive | low | Listing 누적 19필드 |
| `PromotionSlot` enum 확장 (3종 → 8종) | additive | low | enum 8개 |
| `Profile` 확장 4필드 (DEALER 평가사 정보) | additive | low | — |
| `ListingHashtag` 신규 모델 (선택) | additive | low | 모델 5개 (v1 4개 + 1) |
| `PromotionProduct` 시드 데이터 정의 | seed | low | — |

---

## 1. enum 추가 (v2)

```prisma
enum PromotionSlot {
  LIST_TOP          // 리스트 최상단 고정 (엔카 '우대등록' 미러링)
  HOME_CAROUSEL     // 홈 메인 캐러셀 노출 (엔카 '모바일 프리미엄')
  CATEGORY_BADGE    // 카드 핫 배지 (엔카 '핫마크')
  PHOTO_PRIORITY    // 갤러리 노출 우선 (엔카 '사진우대')
  AUTO_REFRESH      // 매물 자동 갱신 (엔카 '자동업데이트')
  AI_PRESS          // AI 보도자료 본문 자동 생성 (이어카 '/premium/<id>')
  QUICK_PACKAGE     // 빠른승계 통합 패키지 (대행 + 위 슬롯 묶음)
  AGENT_BADGE       // 매니저 대행중 배지 (이어카 'badge_quick.png')
}

enum SpecialAccidentKind {
  TOTAL_LOSS    // 전손
  THEFT         // 도난
  FLOOD         // 침수
}
```

`v1`의 `AcquisitionMethod`, `PromotionPurchaseStatus`, `AgentRequestStatus`, `SellerPaymentKind`, `SellerPaymentStatus`는 그대로.

---

## 2. `Listing` 추가 필드 (v2 — K카 진단/보험이력 미러링)

```prisma
model Listing {
  // ... 기존 + v1 확장 필드 유지 ...

  // 진단 데이터 (K카 형식 표준화)
  inspectionDiagnosis  Json?     @map("inspection_diagnosis")
  // 형식:
  // {
  //   exteriorPanels: { [partKey: string]: { repaint: boolean, replace: boolean } }
  //                                   //  partKey ∈ "roof", "bonnet", "trunk", "frontFenderL/R",
  //                                   //              "frontDoorL/R", "backDoorL/R", "backFenderL/R", ...
  //   mainFrame: { [partKey: string]: { repaint: boolean, replace: boolean } }
  //                                   //  partKey ∈ "frontPanel", "radiator", "crossmember", "dashPanel",
  //                                   //              "floorPanel", "rearPanel", "frame", "aPillarL/R", ...
  //   accident: 'NONE' | 'MINOR' | 'MAJOR'
  //   odometerReplaced: boolean
  //   tireRemainingMm: { driverFront: number, driverRear: number, passengerFront: number, passengerRear: number }
  //   consumables: { engineOil: 'PASS'|'FAIL', brakePads: 'PASS'|'FAIL', ... }
  //   convenience: { exterior: { passed: number, total: number }, interior: {...}, safety: {...} }
  // }

  // 보험이력 (K카 형식)
  insuranceHistory     Json?     @map("insurance_history")
  // 형식:
  // {
  //   ownDamageCount: number,        // 내차 피해
  //   partnerDamageCount: number,    // 상대차 피해
  //   liens: 'NONE'|'EXISTS',        // 압류/저당
  //   ownerChanges: number,          // 소유자 변경
  //   usageChanged: boolean,         // 용도 변경
  //   specialAccidents: { totalLoss: number, theft: number, flood: number },
  //   reportDate: string,            // 'YYYY-MM-DD'
  // }

  // 평가사 코멘트 (K카 4섹션 미러링)
  dealerNote           Json?     @map("dealer_note")
  // 형식:
  // {
  //   recommendation: string[],   // ★ 이 차를 추천하는 이유
  //   summary: {
  //     exterior: string, wheelTire: string, engine: string, interior: string,
  //   },
  //   history: { previousOwner: string, notes: string[] },
  //   closing: string,            // # 마무리 권유
  // }

  // 옵션 출고가 (K카 형식)
  optionsWithPrice     Json?     @map("options_with_price")
  // 형식: [{ name: string, price: number }, ...]
  // 합산은 클라이언트에서 sum 계산

  // 해시태그 (K카 페이지 상단)
  hashtags             String[]  @default([]) @map("hashtags")
  // 예: ['무사고', '1인소유', '짧은주행', '네비게이션', '썬루프추가', '가성비']

  // 신고/규제 정보
  declarationNumber    String?   @map("declaration_number")    // 제 20231380494호
  declaredAt           DateTime? @map("declared_at")            // 정보조회일자

  // 인덱스 추가
  @@index([hashtags], type: Gin)
}
```

---

## 3. `Profile` 확장 (DEALER 평가사 정보)

```prisma
model Profile {
  // ... 기존 필드 유지 ...

  // DEALER role 전용
  branch                  String?   @map("branch")                    // '분당용인직영점'
  employeeNumber          String?   @map("employee_number")           // 'GC23-06193'
  expertProfileImageUrl   String?   @map("expert_profile_image_url")  // 평가사 사진
  expertSpecialty         String?   @map("expert_specialty")          // '준중형차 전문' 등 자유 텍스트
}
```

→ `Profile.role = DEALER`인 사용자에게만 의미 있는 필드. 모두 nullable.

---

## 4. `ListingHashtag` 신규 모델 (선택)

옵션 1: `Listing.hashtags: String[]` 단일 컬럼 (위 §2 권장).
옵션 2: 별도 테이블로 검색·집계 최적화 (대규모 시).

```prisma
// 옵션 2 — 대규모 매물 시 권장
model ListingHashtag {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  tag       String                                       // '무사고', '1인소유'
  createdAt DateTime @default(now()) @map("created_at")

  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([listingId, tag])
  @@index([tag])
  @@map("listing_hashtags")
}
```

→ MVP는 옵션 1 (`String[]`) 채택, 옵션 2는 매물 1만건 돌파 시 마이그레이션.

---

## 5. `PromotionProduct` 시드 데이터 (v1 모델 + v2 카탈로그)

```ts
// prisma/seed.ts 또는 별도 seed-promotion-products.ts
const promotionProducts = [
  // Phase 1 — MVP 단일 SKU
  {
    slug: 'quick-transfer',
    name: '빠른승계 패키지',
    description: '매니저 대행 + 리스트 최상단 + 빠른승계 배지 + AI 매물 소개 자동 생성',
    slot: 'QUICK_PACKAGE',
    durationDays: 0,            // 영구 (거래 완료까지)
    price: 0,                   // 선결제 없음
    feeRate: 0.040,             // 거래 완료 시 시세 4%
    isActive: true,
  },

  // Phase 2 — 슬롯형 SKU 6종 (엔카 미러링)
  { slug: 'list-top-7d',        name: 'LIST 상단 노출 7일',  slot: 'LIST_TOP',       durationDays:  7, price:  50000, feeRate: null, isActive: false },
  { slug: 'list-top-30d',       name: 'LIST 상단 노출 30일', slot: 'LIST_TOP',       durationDays: 30, price: 150000, feeRate: null, isActive: false },
  { slug: 'home-carousel-7d',   name: '홈 캐러셀 7일',        slot: 'HOME_CAROUSEL',  durationDays:  7, price: 100000, feeRate: null, isActive: false },
  { slug: 'hot-badge-30d',      name: '핫 배지 30일',         slot: 'CATEGORY_BADGE', durationDays: 30, price:  30000, feeRate: null, isActive: false },
  { slug: 'photo-priority-30d', name: '사진우대 30일',         slot: 'PHOTO_PRIORITY', durationDays: 30, price:  40000, feeRate: null, isActive: false },
  { slug: 'auto-refresh-30d',   name: '자동 갱신 30일',       slot: 'AUTO_REFRESH',   durationDays: 30, price:  20000, feeRate: null, isActive: false },
];
```

→ MVP 시 `isActive=true`는 `quick-transfer` 1건만. Phase 2 진입 시 6종 일괄 ON.

---

## 6. 적용 순서 (v1 + v2 통합)

| Step | 작업 | Owner | 주의 |
|---|---|---|---|
| 1 | enum 추가 (v1: 5개 + v2: 2개 = 7개) | claude | 기존 NotificationType은 v1에서 3종 추가 |
| 2 | `Listing` 컬럼 추가 (v1: 11개 + v2: 8개 = 19개, 모두 nullable) | claude | 마이그레이션 1건 |
| 3 | `Profile` 확장 (v2: 4개) | claude | 동일 마이그레이션 |
| 4 | 신규 모델 4개 (v1: PromotionProduct/PromotionPurchase/AgentRequest/SellerPayment) | claude | 동일 마이그레이션 |
| 5 | `ListingHashtag` 모델 — 보류 (Phase 4) | — | MVP는 String[] |
| 6 | `PromotionProduct` 시드 1건 (`quick-transfer`) | claude (`prisma/seed.ts` 수정) | Hybrid routing: `prisma/seed.ts` = strict + claude reviewer |
| 7 | `bun prisma migrate dev --name add-promotion-agent-and-kcar-fields` | human | 운영 적용 전 dev에서 검증 |

---

## 7. v2 미러링 검증 체크리스트

mockup data (TASK-005) → Listing 1건이 K카 EC60897220 데이터를 모두 표시 가능해야 한다:

- [ ] `inspectionDiagnosis.exteriorPanels` — 14부위 SVG 매핑 가능
- [ ] `inspectionDiagnosis.mainFrame` — 26부위 SVG 매핑 가능
- [ ] `inspectionDiagnosis.tireRemainingMm` — 4면 mm 단위
- [ ] `insuranceHistory.specialAccidents` — 3종 카운트
- [ ] `dealerNote.recommendation` — bullet 리스트
- [ ] `optionsWithPrice` — TUIX DMB 85만, 썬루프 46만 표시
- [ ] `hashtags` — '무사고', '1인소유' 등 6종

eacar 매물 (`/car/40635`)도 동일 — 단 `dealerNote`는 매도자가 직접 작성한 description으로 대체 (DEALER 코멘트 vs 매도자 본인 글).

---

## 8. 결정 필요 (사람 검토)

1. **`inspectionDiagnosis` Json 키 명명** — camelCase (제안) vs 한국어 키 (예: `roof: { 판금: 0, 교환: 0 }`). 영문 권장.
2. **`hashtags` 자동 생성** — 매물 등록 시 룰 기반 (`사고0건 → '무사고'`, `소유주0건 → '1인소유'`)? Phase 2 별도 작업.
3. **`PromotionPurchase.endsAt` 만료 cron** — Vercel Cron Jobs로 1일 1회. 별도 TASK.
4. **`SellerPayment` PG** — 토스페이먼츠 별건 결제 (buyer EscrowPayment과 다른 orderId namespace 분리).
5. **`AgentRequest.feeRate` 매물별 변동** — default 4%, admin이 협의 시 조정 가능. 0.040 default는 유지.
