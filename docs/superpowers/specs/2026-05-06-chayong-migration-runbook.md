# 차용 Phase 1 Migration Runbook (TASK-009)

- **Date**: 2026-05-06
- **Status**: Draft (TASK-009 사람 직접 작성용 체크리스트)
- **Scope**: Addendum J 1~7번 migration. 8번 DealerReview v2는 Stretch.
- **Owner**: claude/human only
  - `prisma/migrations/**` — Codex Fast/Strict 모두 금지(routing.md 영구 룰)
  - `prisma/schema.prisma` — TASK-009 진행 동안 claude/human only로 임시 잠금. TASK-009 완료 후 일반 룰(codex-strict + claude reviewer + human checkpoint)로 환원
  - 본 TASK는 schema baseline 동결을 위한 single-owner 운영. 후속 schema 변경(별 TASK)은 일반 룰로 codex-strict 가능
- **Related**: `docs/superpowers/specs/2026-05-06-chayong-phase-1-scope.md` (Schema Contract Addendum)

> 본 runbook은 TASK-009의 단일 책임자(사람)가 따라가는 체크리스트.
> 8개 후속 sub_boundary와 18개 후속 TASK가 schema baseline에 의존 — drift 발생 시 18개 카드 모두 영향.

---

## 0. 사전 조건

- [ ] 로컬에 Supabase 프로젝트(또는 PR용 staging) 접근 가능
- [ ] `.env`의 `DATABASE_URL` / `DIRECT_URL`이 작업 대상 DB를 가리킴 (PRD 직접 적용 금지 — staging 우선)
- [ ] `git status` clean (별도 작업 진행 중이면 stash)
- [ ] `bun install` 후 `bun run db:generate` 정상 동작 (현재 baseline 확인)
- [ ] `bun run type-check` 현 main에서 통과 (회귀 기준점 확보)

---

## 1. 전체 적용 순서

각 migration은 **별 commit**. PR은 8개 commit을 하나로 묶거나, 7개 + storage 1개로 분리.

```
1)  prisma/schema.prisma 부분 편집 (해당 migration 영역만)
2)  bun run prisma migrate dev --name <slug>
       → prisma/migrations/<ts>_<slug>/migration.sql 자동 생성
3)  자동 생성된 migration.sql 검토 + 필요 시 수정 (default backfill, partial index 등)
4)  bun run db:generate
5)  bun run type-check  → 회귀 없는지 확인 (애플리케이션 코드는 신규 필드 미사용이라 통과해야 함)
6)  git add prisma/schema.prisma prisma/migrations/<ts>_<slug>/
    git commit -m "feat(schema): <slug> (TASK-009 step <n>/7)"
7)  다음 slice로 이동
```

**중간에 type-check 실패하면 다음 slice로 넘어가지 말 것.** schema.prisma는 cumulative이므로 한 step의 누락이 다음 step에 누적된다.

8개째(Storage 버킷·RLS)는 prisma migration이 아닌 Supabase 측 변경 — 별 commit으로 SQL 또는 Studio 변경 노트만 첨부.

---

## 2. Migration slice 별 상세

### Slice 1 — `add_listing_status_rejected`

**목표**: ListingStatus enum에 REJECTED 추가.

**Prisma diff**:
```prisma
enum ListingStatus {
  DRAFT
  PENDING
  ACTIVE
  RESERVED
  SOLD
  HIDDEN
  REJECTED   // 신규
}
```

**SQL 검토 포인트**:
- Postgres `ALTER TYPE "ListingStatus" ADD VALUE 'REJECTED'` 자동 생성
- 기존 row 영향 없음 (enum 추가만)
- `VALID_STATUS_TRANSITIONS`(src/types/admin.ts) 갱신은 TASK-011에서 처리 — 본 slice는 enum만

**Rollback**: enum 값 제거는 Postgres에서 native 미지원 → enum 자체 재생성 필요. **롤백 어려움 → 신중 검토.**

**Done check**:
- [ ] `bun run db:generate` 후 `@prisma/client`에 `ListingStatus.REJECTED` export
- [ ] type-check 통과

---

### Slice 2 — `add_profile_penalty_fields`

**목표**: PenaltyLevel enum + Profile 5 필드 추가.

**Prisma diff**:
```prisma
enum PenaltyLevel {
  NONE
  WARNING
  LIGHT
  HEAVY
  BAN
}

model Profile {
  // ... 기존 필드
  violationCount    Int           @default(0) @map("violation_count")
  penaltyLevel      PenaltyLevel  @default(NONE) @map("penalty_level")
  suspendedUntil    DateTime?     @map("suspended_until")
  suspensionReason  String?       @map("suspension_reason")
  bannedAt          DateTime?     @map("banned_at")
  lastViolationAt   DateTime?     @map("last_violation_at")
  // phone(기존) 변경 금지
}
```

**SQL 검토 포인트**:
- 기존 row의 `violation_count` default `0`, `penalty_level` default `'NONE'` backfill 자동
- nullable 4개(suspended_until/suspension_reason/banned_at/last_violation_at)는 NULL OK
- 인덱스 추가 불필요 (조회는 PK + auth-guard 가드만)

**기존 데이터 영향**: BUYER+SELLER 다중 role 사용자도 기본 NONE으로 시작.

**Rollback**: 컬럼 DROP + enum DROP. nullable이므로 데이터 손실 무. enum DROP은 컬럼이 모두 제거된 후에만 가능.

**Done check**:
- [ ] `Profile.penaltyLevel`이 'NONE'으로 모든 row backfill됨 (`SELECT count(*) FROM profiles WHERE penalty_level IS NULL` = 0)
- [ ] type-check 통과

---

### Slice 3 — `add_notification_types`

**목표**: NotificationType enum 8개 추가 (LISTING_REJECTED, ESCROW_PAID, ESCROW_RELEASED, ESCROW_REFUNDED, TRANSFER_DOWNGRADE_PROPOSAL, ESCROW_DISPUTE_OPENED, ESCROW_DISPUTE_RESOLVED, REVIEW_REQUESTED).

**Prisma diff**:
```prisma
enum NotificationType {
  CHAT_MESSAGE
  ESCROW_STATUS              // deprecated — 신규 row 발행 금지
  LEAD_ASSIGNED
  LISTING_APPROVED
  LISTING_LIKED
  // 신규
  LISTING_REJECTED
  ESCROW_PAID
  ESCROW_RELEASED
  ESCROW_REFUNDED
  TRANSFER_DOWNGRADE_PROPOSAL
  ESCROW_DISPUTE_OPENED
  ESCROW_DISPUTE_RESOLVED
  REVIEW_REQUESTED
}
```

**SQL 검토 포인트**:
- enum 8회 `ADD VALUE` 자동
- 기존 row(예: ESCROW_STATUS 사용 row) 영향 없음. backfill 시도 금지 — Phase 2에서 별도 정리

**Rollback**: enum 값 제거 어려움(Slice 1과 동일). 신규 enum 사용 row가 생기기 전에 빨리 검증.

**Done check**:
- [ ] `@prisma/client`의 `NotificationType`에 8개 신규 export
- [ ] type-check 통과

---

### Slice 4 — `extend_listing_fast_transfer`

**목표**: Listing 모델에 빠른승계/검수 관련 10필드 추가 + 1개 rename.

**Prisma diff**:
```prisma
model Listing {
  // ... 기존 필드 유지
  // 신규
  estimatedMarketPrice        Int?       @map("estimated_market_price")        // 만원 단위
  dealerNote                  String?    @map("dealer_note")                    // ≤200자
  // inspectionChecklist는 기존 Json? 유지 (재선언 금지)
  isFastTransfer              Boolean    @default(false) @map("is_fast_transfer")
  registrationDocumentKey     String?    @map("registration_document_key")
  capitalGuideAcknowledgedAt  DateTime?  @map("capital_guide_acknowledged_at")
  proposalSentAt              DateTime?  @map("proposal_sent_at")
  followUpAttemptedAt         DateTime?  @map("follow_up_attempted_at")
  reviewReason                String?    @map("review_reason")  // 자동 가림 사유
  // rename
  inspectionReportKey         String?    @map("inspection_report_key")
  // (기존) inspectionReportUrl 컬럼 DROP 또는 deprecation 처리 — 아래 SQL 검토 포인트 참조

  @@index([status, isFastTransfer, createdAt(sort: Desc)])
}
```

> Postgres에서는 `partial index` 추가 권장:
> `CREATE INDEX listings_proposal_pending_idx ON listings(proposal_sent_at) WHERE follow_up_attempted_at IS NULL;`
> Prisma 6의 `@@index ... WHERE` 미지원 시 **migration.sql에 raw SQL로 직접 작성**.

**SQL 검토 포인트**:
- `inspection_report_url` 컬럼이 기존에 있고 데이터가 비어있으면 DROP 후 신규 `inspection_report_key`로 교체 가능
- 데이터가 있으면 step1: 신규 컬럼 추가 + 기존 데이터 그대로 둠 → 별도 backfill TASK로 분리 권장(이번 slice에서는 컬럼 둘 다 보유)
- partial index는 prisma 자동 SQL이 지원 안 할 수 있음 → 수동 추가

**Done check**:
- [ ] 10 신규 필드 + 1 rename(또는 양립) prisma client에 export
- [ ] partial index `listings_proposal_pending_idx` 존재
- [ ] type-check 통과
- [ ] inspection_report_url 처리 결정(보존/제거) 명시 + 결정 commit message에 기록

---

### Slice 5 — `extend_escrow_payment_v1`

**목표**: EscrowPayment에 18 필드 추가 + 1 인덱스 보강.

**Prisma diff**:
```prisma
model EscrowPayment {
  // ... 기존 필드 유지
  // 명의변경 검증
  transferProofKey        String?    @map("transfer_proof_key")
  rejectionProofKey       String?    @map("rejection_proof_key")
  verifiedBy              String?    @map("verified_by") @db.Uuid
  verifiedAt              DateTime?  @map("verified_at")
  verificationRejectedAt  DateTime?  @map("verification_rejected_at")
  rejectionReason         String?    @map("rejection_reason")
  // 분쟁
  disputedAt              DateTime?  @map("disputed_at")
  disputeReason           String?    @map("dispute_reason")
  disputeEvidenceKeys     Json?      @map("dispute_evidence_keys")  // string[] of storage keys
  mediatedBy              String?    @map("mediated_by") @db.Uuid
  mediationNote           String?    @map("mediation_note")
  mediationResolvedAt     DateTime?  @map("mediation_resolved_at")
  mediationResolution     String?    @map("mediation_resolution")
  externalMediationAt     DateTime?  @map("external_mediation_at")
  // 정산
  platformFee             Int        @default(0) @map("platform_fee")
  pgFee                   Int?       @map("pg_fee")
  payoutAmount            Int?       @map("payout_amount")
  payoutAt                DateTime?  @map("payout_at")
}
```

**SQL 검토 포인트**:
- 모든 신규 컬럼 nullable 또는 default 0 → 기존 row 영향 없음
- `verifiedBy`/`mediatedBy`는 `@db.Uuid` (Profile FK는 application 레이어에서만, DB 레벨 FK 미설정 — Profile cascade 영향 회피)
- `dispute_evidence_keys`는 Json — Postgres jsonb로 저장됨

**Rollback**: 컬럼 DROP. 데이터 손실 위험 있으므로 production에는 staging 검증 후 적용.

**Done check**:
- [ ] 18 신규 필드 prisma client에 export
- [ ] type-check 통과

---

### Slice 6 — `extend_chat_message_review`

**목표**: ChatMessage에 6 필드 추가 + 인덱스 1개.

**Prisma diff**:
```prisma
model ChatMessage {
  // ... 기존 필드 유지
  reviewStatus      String     @default("APPROVED") @map("review_status")  // PENDING_REVIEW | APPROVED | BLOCKED
  reviewedBy        String?    @map("reviewed_by") @db.Uuid
  reviewedAt        DateTime?  @map("reviewed_at")
  aiSuspicionScore  Float?     @map("ai_suspicion_score")
  aiReason          String?    @map("ai_reason")
  blockReason       String?    @map("block_reason")  // REGEX_CONTACT | AI_CONTACT | ADMIN_BLOCK

  @@index([reviewStatus, createdAt])
}
```

**SQL 검토 포인트**:
- `review_status` default 'APPROVED' backfill 자동 → 기존 메시지 모두 APPROVED 처리 (정상)
- `@@index([reviewStatus, createdAt])` 추가 — admin 메시지 검수 큐 쿼리용

**Done check**:
- [ ] 6 신규 필드 + 인덱스 존재
- [ ] 기존 row의 `review_status` = 'APPROVED'
- [ ] type-check 통과

---

### Slice 7 — `create_report`

**목표**: Report 모델 신규 + 3 인덱스 + Profile relation 추가.

**Prisma diff**:
```prisma
model Profile {
  // ... 기존
  reportsFiled    Report[]   @relation("ReportsFiled")
}

model Report {
  id           String    @id @default(uuid()) @db.Uuid
  reporterId   String    @map("reporter_id") @db.Uuid
  targetType   String    @map("target_type")  // LISTING | MESSAGE | PROFILE | REVIEW
  targetId     String    @map("target_id") @db.Uuid    // application-level FK
  reason       String                          // FALSE_LISTING | CONTACT_BYPASS | HARASSMENT | SPAM | SCAM | OTHER
  description  String?
  evidenceKeys Json?     @map("evidence_keys") // string[] of storage keys
  status       String    @default("PENDING")    // PENDING | REVIEWED | DISMISSED
  reviewedBy   String?   @map("reviewed_by") @db.Uuid
  reviewedAt   DateTime? @map("reviewed_at")
  resolution   String?                         // UPHELD_HIDE | DISMISSED_FALSE | ESCALATED
  createdAt    DateTime  @default(now()) @map("created_at")

  reporter Profile @relation("ReportsFiled", fields: [reporterId], references: [id])

  @@index([targetType, targetId, createdAt])
  @@index([reporterId, createdAt])
  @@index([status])
  @@map("reports")
}
```

**SQL 검토 포인트**:
- `target_id`는 application-level FK — DB FK 미설정 (다형성 + 신고 대상 삭제 시 신고 보존 의도)
- 인덱스 3개:
  - `(target_type, target_id, created_at)` — 자동 가림 임계값 쿼리(24h N건)
  - `(reporter_id, created_at)` — 어뷰즈 방지 24h count
  - `(status)` — admin 큐 PENDING 필터
- `Profile.reportsFiled` relation 추가 (역방향 미정의 시 Prisma 검증 실패)

**Done check**:
- [ ] `reports` 테이블 + 3 인덱스 생성
- [ ] `Profile.reportsFiled` Prisma client에 export
- [ ] type-check 통과

---

## 3. Storage 버킷 + RLS (Slice 8 — Supabase 측 변경)

prisma migration이 아니라 Supabase Studio 또는 SQL Editor에서 적용.

### 버킷 3개

```sql
-- listing-documents (자동차등록원부)
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-documents', 'listing-documents', false);

-- transfer-proofs (명의변경 증빙 + rejection proof)
INSERT INTO storage.buckets (id, name, public) VALUES ('transfer-proofs', 'transfer-proofs', false);

-- dispute-evidence (분쟁 증거)
INSERT INTO storage.buckets (id, name, public) VALUES ('dispute-evidence', 'dispute-evidence', false);
```

### RLS 정책 (각 버킷별)

원칙: **소유자(매도자/구매자) + ADMIN만 read/write. 익명/타사용자 차단.**

`listing-documents`:
- write: `auth.uid() = (SELECT seller_id FROM listings WHERE id::text = (storage.foldername(name))[2])` OR `role = 'ADMIN'`
- read: 동일 조건

`transfer-proofs`:
- write: `auth.uid() = (SELECT buyer_id FROM escrow_payments WHERE id::text = (storage.foldername(name))[2]) OR auth.uid() = (SELECT seller_id FROM escrow_payments WHERE id::text = (storage.foldername(name))[2])` OR `role = 'ADMIN'`
- read: 동일 조건

`dispute-evidence`:
- write: 위 escrow buyer/seller + ADMIN/매니저 role
- read: 동일

> RLS 정책 정확한 SQL은 Supabase 공식 storage 가이드 참조하여 작성. `storage.foldername(name)` 함수 사용. Slice 4(listing folder='listing-${id}'), Slice 5(escrow folder='escrow-${id}') 컨벤션 준수.

**Done check**:
- [ ] 버킷 3개 생성 (모두 private)
- [ ] 각 버킷별 RLS write/read 정책 적용
- [ ] anon 사용자로 직접 storage API 호출 시 403 확인 (간단 verification)

---

## 4. 종합 회귀 테스트

모든 slice 적용 후:

- [ ] `bun run db:generate` 통과
- [ ] `bun run type-check` 통과
- [ ] `bun run lint` 통과
- [ ] `bun run test` 통과 (기존 unit test 회귀 없음)
- [ ] `bun run build` 통과 (모든 신규 enum/필드가 prisma client에 정상 빌드됨)
- [ ] Prisma Studio(`bun run db:studio`)에서 신규 컬럼/인덱스 육안 확인
- [ ] Supabase storage 버킷 3개 + RLS 적용 확인

---

## 5. Rollback 전략

각 slice별 분리. **enum 추가/제거는 Postgres에서 비대칭** — 추가는 즉시, 제거는 enum 재생성 + 데이터 마이그레이션 필요.

| Slice | Rollback 난이도 | 전략 |
|-------|----------------|------|
| 1. listing status REJECTED | 어려움 | enum 사용 row 모두 다른 값으로 update 후 enum 재생성 |
| 2. profile penalty | 쉬움 | 컬럼 + enum DROP (데이터 손실 위험 유의) |
| 3. notification types | 어려움 | 신규 enum 사용 row 정리 후 enum 재생성 |
| 4. listing fast transfer | 쉬움 | 컬럼 DROP. partial index 별도 DROP |
| 5. escrow payment v1 | 쉬움 | 컬럼 DROP. 검증/분쟁 데이터 손실 가능 |
| 6. chat message review | 쉬움 | 컬럼 + 인덱스 DROP |
| 7. report 신규 모델 | 쉬움 | 테이블 DROP. relation 제거 |
| 8. storage 버킷 + RLS | 중간 | 버킷 비우기 → 정책 DROP → 버킷 DROP |

**원칙**: production 적용 전 staging에서 1회 적용 + 1회 rollback 리허설.

---

## 6. 후속 TASK Unblock

모든 slice + 회귀 테스트 통과 후:

- [ ] `.handoff/SCHEMA-BASELINE.decision.json` 작성 (verdict: pass) — `.harness/routing.md` Schema baseline 게이트 해제
- [ ] `.tasks/TASK-009.md` status를 `completed`로 업데이트
- [ ] TASK-010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 025, 028, 029의 `blockedBy: ["TASK-009"]` 게이트 통과 — 18 카드 dispatch 가능
- [ ] TASK-024 (contact-filter), TASK-026/027 (capital guide)는 schema 독립이라 본 게이트 무관

---

## 7. 명시적 비목표

본 runbook 범위 외:

- **DealerReview v2 재설계** (Addendum J 8번) — Stretch. 별도 runbook 작성 후 진행.
- **신규 필드를 사용하는 application 코드** — 모두 후속 TASK가 담당. 본 runbook은 schema only.
- **seed 데이터 갱신** (`prisma/seed.ts`) — 신규 필드는 default/null 허용이므로 즉시 갱신 불필요. UI 미리보기 영향 시 별도 TASK.
- **production DB 적용** — 본 runbook은 staging 기준. production 배포는 별도 release runbook.
- **데이터 마이그레이션 backfill** (예: 기존 메시지에 reviewStatus 명시 입력) — default 자동 backfill로 충분, 추가 backfill 불필요.

---

## 8. 핵심 리스크 체크리스트

작업 시작 전 1회 점검:

- [ ] `prisma/schema.prisma`의 기존 필드/모델 변경 없는가? (신규 추가만 + inspection_report_url 처리만)
- [ ] DealerReview를 건드리지 않는가? (Stretch 분리)
- [ ] storage URL을 DB에 저장하는 흔적이 신규 필드에 없는가? (모두 `*Key` suffix)
- [ ] `Listing.status REJECTED` 추가 후 `VALID_STATUS_TRANSITIONS`(코드)는 본 작업 범위 X — TASK-011에서 처리한다는 점 인지
- [ ] enum 추가 commit과 enum 사용 코드 commit이 분리됨 (배포 순서: schema commit → 코드 commit)
- [ ] 인덱스 추가 시 production 영향(테이블 락) 사전 검토 — 본 작업은 staging이라 무관하나 production 배포 시 점검
