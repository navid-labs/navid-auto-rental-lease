# 차용 Phase 1 Scope — Domain Grilling Consolidation

- **Date**: 2026-05-06
- **Status**: Draft (Q1~Q37 그릴링 결과 동결, 구현 단계 spec 추가 분할 필요)
- **Source**: 도메인 그릴링 세션 Q1~Q37
- **Related**: `docs/superpowers/specs/2026-04-08-chayong-platform-design.md`

## Context

차용(Chayong) = 중고 승계 + 중고 리스/렌트 거래 플랫폼.
원칙: "플랫폼은 유입 도구, 계약은 사람이 만든다" — 매니저 검수 + 신뢰 기반 거래.

벤치마킹: 이어카(승계 전문)·K카(매물 풀 검수·진단)·엔카(셀프 즉시 등록)·KB차차차(무료 노출).
차별화 축: 매니저 검수(빠른승계) + 에스크로 보호 + 분쟁 중재.

## 결정 사항 요약 (Q18~Q37)

> Q1~Q17은 매물 데이터 모델·비즈니스 수익·벤치마킹 영역으로, 본 spec엔 Q18~Q37만 포함. Q1~Q17 결정은 별도 문서화 보강 필요.

### Q18 — 매물 검수 범위
- 모든 매물 admin 빠른 승인(5분 내, SLA 24h)
- 빠른승계는 매니저 추가 검수(시세산정 + 진단 + 영업일 3일 SLA)
- 검수 기준: 사진 4장+, 차량번호 형식, 캐피탈사명(TRANSFER), 월납입금 > 0, 잔여개월 > 0, 차량 기본정보, 매도자 코멘트 ≥ 20자

### Q19 — dealerNote (매니저 평가) Phase 분류
- Phase 1 빠른승계 의무 + 단순 구조: `estimatedMarketPrice` + `dealerNote(≤200자)` + `inspectionChecklist` 4항목(외관/엔진/주행/사고이력 — `OK|WARN|FAIL`)
- 노출: 매물 상세 "매니저 평가" 카드(빠른승계만), VehicleCard "매니저 검수 완료" 뱃지
- Phase 2: 풀 진단 리포트(이미지·세부 점수)로 확장

### Q20 — 시세평가 산정 방식
- 매니저 수동 입력만 (Phase 1)
- 외부 사이트(KB차차차/엔카/이어카) 매니저 직접 조회 후 input
- 외부 API/스크래핑 X (ToS 위반 + 차단 리스크)
- Phase 2: 차용 자체 거래 DB 누적 → 자체 시세 추정

### Q21 — 매도자 호가 vs 매니저 시세평가 차이
- 매니저 직접 통화/카톡 협의 → 합의가로 ACTIVE
- 매물 상세에 합의 호가 + 매니저 시세평가 둘 다 노출 (USP 가시화)
- 매도자 협의 거절 시 매니저가 dealerNote에 사유 기재 후 ACTIVE 또는 일반매물 전환 권유

### Q22 — 빠른승계 거절 케이스
- 매도자 명시 동의 후 일반매물 전환 + 산출물 보존(비공개)
- `isVerified=false`, planType `TRANSFER` 유지
- `estimatedMarketPrice`/`dealerNote` 보존하되 buyers UI 노출 차단(노출 게이트 = `isVerified=true`)
- 매도자 거절 시 `status=REJECTED` + 산출물 보존(매도자 재신청 시 매니저 참고)

### Q23 — 거절 후 planType 결정
- TRANSFER 그대로 자동 유지
- 매도자 PUT allowlist에 planType 미포함 → 변경은 매물 삭제 + 재등록
- 엣지 케이스(매물 종류 자체 부적합)는 admin "재등록 안내" 별도 버튼

### Q24 — 알림 채널
- Critical 액션 SMS(Solapi) + 일반 in-app
- Critical 화이트리스트: `LISTING_APPROVED`/`LISTING_REJECTED`, `TRANSFER_DOWNGRADE_PROPOSAL`, `ESCROW_PAID`/`RELEASED`/`REFUNDED`, `DISPUTE_OPENED`
- Non-critical (in-app): `CHAT_NEW_MESSAGE`, `FAVORITE_ADDED`, `LISTING_VIEW_MILESTONE`
- Phase 2: 카카오 알림톡 전환

### Q25 — Critical 알림 SLA
- 단계적: 1차 알림 → 24h 무응답 → 매니저 follow-up(통화/SMS) → 추가 24h → 매니저 수동 close
- close = `status=REJECTED` + `rejectionReason="매도자 무응답으로 검수 종료"`
- cron 불필요(admin 칸반 client-side 필터로 SLA 시각화)
- 추적 필드: `Listing.proposalSentAt`, `Listing.followUpAttemptedAt`

### Q26 — 차량번호 인증
- 일반 매물: 형식 검증만 `/^\d{2,3}[가-힣]\d{4}$/`
- 빠른승계: 자동차등록원부 사진/PDF 업로드 의무 (private bucket)
- Phase 2: OCR API 또는 모든 매물 원부 의무화 검토

### Q27 — 캐피탈사 동의 절차
- SELL 등록 시 캐피탈사 가이드 모달 강제 노출 + 매도자 인지 체크 → ACTIVE 가능
- 결제 후 매도자/구매자 직접 캐피탈사 명의변경 진행 (차용 대행 X — CLAUDE.md 원칙 준수)
- Listing.capitalGuideAcknowledgedAt 추적
- 캐피탈사 가이드 페이지 8개: KB·현대·롯데·우리금융·BNK·메리츠·신한카드·하나캐피탈

### Q28 — 명의변경 증빙 검증 주체
- 매니저(빠른승계, `inspectedBy` 라우팅) / admin(일반 매물 공용 큐) 이원화
- 검증 기준: 자동차등록증 새 소유자명 = 구매자 본인 일치, 차량번호 일치, 캐피탈사 동의완료 문서 진위, 채팅 로그 정합성
- 검증 SLA 24h
- admin 매뉴얼 별도 작성: `docs/admin-manual/transfer-verification.md`

### Q29 — 분쟁 처리 흐름
- 매니저 1차 중재(7일) — 명백 케이스 즉시 분기, 복합 케이스 합의안 제시
- 합의 실패 시 외부 중재기관(소비자분쟁조정위원회 1372) 안내, 차용 자금 보유 max 90일
- `EscrowPayment.status=DISPUTED` 활용 + dispute 관련 필드 추가
- 별도 Dispute 모델은 Phase 2 분리

### Q30 — 매도자 약관 위반 패널티
- 단계화: WARNING → LIGHT(30일 등록 제한) → HEAVY(90일) → BAN(영구)
- 위반 매핑(`docs/admin-manual/seller-violations.md`):
  - WARNING: 사진 품질 불량, 캐피탈 정보 오타, follow-up 1회 무응답
  - LIGHT: 호가-시세 의도적 과대 + 협의 거부 반복, follow-up 무응답 2회+, 잔여계약 정보 부정확
  - HEAVY: 잔여계약 허위, 사고 이력 미고지, 분쟁 매도자 책임 1차 판정
  - BAN: 차량번호 위조, 명의변경 증빙 위조, 다중 계정 어뷰즈, 결제 사기, 분쟁 매도자 책임 누적 2회

### Q31 — 구매자 약관 위반 패널티
- 통합 시스템(Profile 필드 공유) + 위반 매뉴얼 buyer/seller 분리
- buyer 매핑(`docs/admin-manual/buyer-violations.md`):
  - WARNING: 채팅 무응답 1회, 결제 지연(7일+), 부적절 언어 1회
  - LIGHT: 결제 후 잠적 1회, 분쟁 거짓 사유 1회, 차단 우회 의심
  - HEAVY: 신용 정보 거짓 진술, 협상 어뷰즈, 외부 중재 거짓 진술
  - BAN: 결제 사기·챠지백, 다중 계정, 신상 정보 외부 유출, 매니저/admin 사칭
- API 가드: `requireActiveProfile()` 헬퍼 + SELL/CHAT/PAYMENT 진입점 적용
- 다중 role 사용자(SELLER + BUYER 동시) 처분 시 모든 액션 차단

### Q32 — 채팅 연락처 차단 강도
- 1차 정규식(`containsContactInfo`) 즉시 차단 + WARNING 카운트
- 2차 Claude Haiku 4.5 분류 → `aiSuspicionScore` (0~1)
- 임계값 ≥ 0.7 → admin 검수 큐 (5분 SLA)
- 임계값 < 0.7 → `APPROVED` 즉시 Realtime publish
- 이미지 메시지: 모두 admin 검수 큐 (Phase 1 단순화)
- AI 장애 fallback: 정규식 통과 메시지 즉시 발송 (degraded mode)

### Q33 — 사용자 신고 흐름
- 통합 Report 모델 + 누적 임계값 자동 가림
- 자동 차단:
  - 매물 24h 3+명 신고 → `status=PENDING` + `reviewReason="REPORTS_THRESHOLD"`
  - 메시지 24h 2+명 신고 → `reviewStatus=BLOCKED`
  - 프로필 자동 차단 X (admin 큐 highlight만)
- 신고 자격: 가입 1일+ AND 활동 이력 1회+ (매물 등록 또는 거래 또는 채팅)
- 어뷰즈 방지: 동일 신고자 24h ≤ 5회, 동일 IP 24h ≤ 5회

### Q34 — 결제 수수료 정책
- 빠른승계 정액 30만원 (정산 시 차감, 선결제 X)
- 일반 매물 자체 수수료 0
- PG 수수료(토스페이먼츠 ~3.3%) 매도자 정산 차감
- 매도자 정산 명세: `매물가 - PG 수수료 - 빠른승계 수수료 = 정산 금액`
- buyers UI엔 매물가만 노출 (수수료는 매도자 영역)
- Phase 2: 일반 매물 매도자 정률(0.5~1.5%) 도입 검토

### Q35 — 매물 노출 정책 (LIST 페이지)
- 검수 우선 + 등록일 보조: `orderBy [{ isVerified: 'desc' }, { createdAt: 'desc' }]`
- 빠른승계 카드 시각 차별: 외곽선 2px primary, "매니저 검수" 뱃지, dealerNote 미리보기 1줄
- 사용자 정렬 변경 시 검수 우선 제거 (사용자 의도 존중)
- "매니저 검수만 보기" 토글 별도 제공
- Phase 2: 알고리즘 가중치(검수 + 신선도 + 조회수 + 찜수 - 신고)

### Q36 — 후기 시스템 (DealerReview)
- 매니저+매도자 둘 다 + 단일 폼 통합 작성 + 비강제 (30일 SLA)
- 빠른승계: 매니저 별점 + 매도자 별점 + 통합 코멘트
- 일반 매물: 매도자 별점 + 코멘트
- 익명 기본 ON (구매자 닉네임 마스킹)
- 노출:
  - 매도자 프로필: 별점 평균 + 후기 목록
  - 매물 상세: 매도자 별점 평균 + "이 매도자의 다른 매물"
  - 빠른승계 카드: 매물별 inspectedBy 매니저 별점 (예: "매니저 검수 ★4.7")
  - admin 매니저 평가 페이지(`admin/managers/[id]`): 매니저별 후기 + 1점 highlight
- DB unique([escrowPaymentId, reviewerId]) — 1거래당 1회

---

## Schema 변경 (Phase 1 신규/확장)

> ⚠️ 본 섹션은 그릴링 1차 안. **충돌 시 아래 "Schema Contract Addendum" 우선**.
> 주요 정정: ListingStatus `REJECTED` 추가(A), Profile +5 필드/PenaltyLevel(B), Notification enum 분리(C),
> DealerReview 재설계(D), 모든 `*Url` → `*Key`(E), `planType` 용어 폐기(H).

### Profile (+4 필드)
```prisma
violationCount Int @default(0)
suspendedUntil DateTime?
bannedAt       DateTime?
phone          String?  // SMS 발송용
```

### Listing (+10 필드)
```prisma
estimatedMarketPrice         Int?     // 만원 단위
dealerNote                   String?  // ≤200자
inspectionChecklist          Json?    // {exterior, engine, mileage, accident: OK|WARN|FAIL}
inspectedAt                  DateTime?
isFastTransfer               Boolean  @default(false)
registrationDocumentUrl      String?  // private bucket signed URL
capitalGuideAcknowledgedAt   DateTime?
proposalSentAt               DateTime?
followUpAttemptedAt          DateTime?
reviewReason                 String?  // 자동 가림 사유
```
> 기존 `inspectedBy`, `isVerified`, `rejectionReason`은 활용.

### ChatMessage (+6 필드)
```prisma
reviewStatus       String   @default("APPROVED")  // PENDING_REVIEW | APPROVED | BLOCKED
reviewedBy         String?
reviewedAt         DateTime?
aiSuspicionScore   Float?
aiReason           String?
blockReason        String?  // REGEX_CONTACT | AI_CONTACT | ADMIN_BLOCK
```

### EscrowPayment (+18 필드)
```prisma
// 명의변경 검증
transferProofUrl        String?
rejectionProofUrl       String?
verifiedBy              String?
verifiedAt              DateTime?
verificationRejectedAt  DateTime?
rejectionReason         String?

// 분쟁
disputedAt              DateTime?
disputeReason           String?
disputeEvidenceUrls     Json?
mediatedBy              String?
mediationNote           String?  // 매니저 admin 메모, buyers 비공개
mediationResolvedAt     DateTime?
mediationResolution     String?  // BUYER_REFUND | SELLER_RELEASE | EXTERNAL_MEDIATION | ABANDONED
externalMediationAt     DateTime?

// 정산
platformFee             Int      @default(0)  // 빠른승계 30만원, 일반 0
pgFee                   Int?
payoutAmount            Int?
payoutAt                DateTime?
```

### Report (신규 모델)
```prisma
model Report {
  id           String   @id @default(cuid())
  reporterId   String
  targetType   String   // LISTING | MESSAGE | PROFILE | REVIEW
  targetId     String   // application-level FK
  reason       String   // FALSE_LISTING | CONTACT_BYPASS | HARASSMENT | SPAM | SCAM | OTHER
  description  String?
  evidenceUrls Json?
  status       String   @default("PENDING")  // PENDING | REVIEWED | DISMISSED
  reviewedBy   String?
  reviewedAt   DateTime?
  resolution   String?  // UPHELD_HIDE | DISMISSED_FALSE | ESCALATED
  createdAt    DateTime @default(now())

  reporter Profile @relation(fields: [reporterId], references: [id])

  @@index([targetType, targetId, createdAt])
  @@index([reporterId, createdAt])
  @@index([status])
}
```

### DealerReview (확장 — 기존 모델 호환성 검토 후 마이그레이션)
```prisma
listingId          String
escrowPaymentId    String
reviewerId         String   // 구매자
reviewedSellerId   String
reviewedManagerId  String?  // 빠른승계만
sellerRating       Int      // 1~5
managerRating      Int?     // 1~5
comment            String?  // ≤500자
anonymous          Boolean  @default(true)
status             String   @default("ACTIVE")  // ACTIVE | HIDDEN | REPORTED
createdAt          DateTime @default(now())

@@unique([escrowPaymentId, reviewerId])
@@index([reviewedSellerId, status])
@@index([reviewedManagerId, status])
```

### Notification.type enum 추가
- `TRANSFER_DOWNGRADE_PROPOSAL`
- `ESCROW_DISPUTE_OPENED`
- `ESCROW_DISPUTE_RESOLVED`
- `REVIEW_REQUESTED`
> 현재 schema 정합성 보정은 아래 Schema Contract Addendum 참조.

---

## Schema Contract Addendum (2026-05-06)

> 본 addendum은 위 "Schema 변경" 섹션의 모호함·기존 schema 충돌을 1차 동결한다.
> `.tasks/` 분할은 본 addendum 기준으로 진행한다.
> Migration 파일은 사람 직접 작성(`prisma/migrations/**` Hybrid 보호 영역).

### A. Listing 거절·상태 모델
- `ListingStatus` enum에 `REJECTED` **추가**. 사유: 현재 `HIDDEN`은 "매도자 자율 숨김"으로 사용 중 → admin 거절과 의미 충돌.
- 거절 흐름 = `status=REJECTED` + `rejectionReason` (필수) + `inspectedBy` (admin/매니저 식별).
- 매도자 재신청 = 신규 Listing row 생성 (REJECTED row는 보존, `PUT /listings/[id]`로는 status 변경 불가).
- 자동 가림(REPORTS_THRESHOLD) = `status=PENDING` + `reviewReason="REPORTS_THRESHOLD"` (REJECTED 아님, admin 큐 재진입).

### B. Profile 패널티 필드 (확정 5개)
```prisma
violationCount    Int           @default(0)
penaltyLevel      PenaltyLevel  @default(NONE)  // 신규 enum
suspendedUntil    DateTime?
suspensionReason  String?
bannedAt          DateTime?
lastViolationAt   DateTime?     // 24h cooldown 쿼리용
// phone 은 기존 필드 그대로 사용 (SMS 발송)

enum PenaltyLevel { NONE WARNING LIGHT HEAVY BAN }
```
- `requireActiveProfile()` 가드 = `bannedAt IS NULL AND (suspendedUntil IS NULL OR suspendedUntil < now)`.
- BUYER+SELLER 다중 role도 동일 Profile.penaltyLevel 공유.

### C. Notification.type — enum 단위 분리 (metadata 분기 금지)
- 사유: Critical SMS 화이트리스트가 enum 단위로 라우팅되므로 `ESCROW_STATUS + metadata.kind` 패턴은 위험(필터 누락 시 발신).
- 신규 enum 값: `LISTING_REJECTED`, `ESCROW_PAID`, `ESCROW_RELEASED`, `ESCROW_REFUNDED`, `TRANSFER_DOWNGRADE_PROPOSAL`, `ESCROW_DISPUTE_OPENED`, `ESCROW_DISPUTE_RESOLVED`, `REVIEW_REQUESTED`.
- 기존 `ESCROW_STATUS` = deprecated, 새 row 발행 금지. Phase 2에서 enum 정리 + 데이터 backfill.

### D. DealerReview = backwards-incompatible 재설계 (확장 아님)
- 기존 row 거의 없음(Phase 0 stub) → 데이터 마이그레이션 없이 schema 교체 acceptable.
- 별도 human TASK: `prisma/migrations/<ts>_dealer_review_v2.sql` 직접 작성 + 기존 row `DELETE` + 신규 unique 제약 추가.
- API 호환성: 기존 `/api/admin/listings/[id]/reviews` POST는 v2 스키마로 교체 (deprecation 윈도우 없음 — Phase 0 stub만 사용).
- `.tasks/` 분할 시 schema migration TASK와 v2 API TASK는 사람 검수 필수(Listing/EscrowPayment cross-cutting).

### E. Storage 원칙 — DB는 object key만 저장
- signed URL은 만료(기본 1h) → DB 저장 금지. 항상 조회 시 발급.
- 필드명 변경:
  - `registrationDocumentUrl` → `registrationDocumentKey`
  - `transferProofUrl` → `transferProofKey`
  - `rejectionProofUrl` → `rejectionProofKey`
  - `inspectionReportUrl` → `inspectionReportKey` (기존 필드 rename)
  - `disputeEvidenceUrls Json?` → `disputeEvidenceKeys Json?` (string[] of keys)
- 발급 헬퍼: `lib/supabase/storage.ts#createSignedKeyUrl(bucket, key, ttl=3600)`.
- 버킷: `listing-documents`(원부) + `transfer-proofs`(명의변경/거절 증빙) + `dispute-evidence`(분쟁) — 모두 private + RLS(소유자 + ADMIN/매니저).

### F. SLA 추적 = 서버 쿼리 기반
- client-side 칸반 필터는 시각화용. **운영 감사 추적은 서버 쿼리**로 정의.
- breach 정의:
  - 빠른승계 follow-up: `proposalSentAt + INTERVAL '24h' < now AND followUpAttemptedAt IS NULL`
  - 매니저 검수 SLA: `status=PENDING AND isFastTransfer=true AND createdAt + INTERVAL '3 business days' < now`
  - 메시지 검수 SLA: `ChatMessage.reviewStatus='PENDING_REVIEW' AND createdAt + INTERVAL '5min' < now`
  - 명의변경 검증 SLA: `EscrowPayment.status='PAID' AND transferProofKey IS NOT NULL AND verifiedAt IS NULL AND (last_proof_uploaded_at) + 24h < now`
- cron 없음 = admin 큐 진입 시 server query (`GET /api/admin/queues/sla-breaches`)로 on-demand 계산.
- 인덱스 추가: `Listing(status, isFastTransfer, createdAt)`, `Listing(proposalSentAt) WHERE followUpAttemptedAt IS NULL`.

### G. Report 어뷰즈 방지 = profile 기반만 (Phase 1)
- IP/디바이스 fingerprint **저장 안 함**. 사유: 개인정보 보관기간/암호화 정책 미정 → 규제 리스크.
- Phase 1 어뷰즈 방지: `Report.reporterId + createdAt 24h count ≤ 5` 만 적용.
- 다중계정 어뷰즈 = admin 수동 차단(Profile.bannedAt) 으로 대응.
- Phase 2 후보: IP hash + 보관기간 정책 + 암호화. 그때까지 IP 컬럼 추가 금지.

### H. 용어 통일 — `planType` 폐기
- spec 본문의 `planType` 표기는 모두 `Listing.type` 또는 `Listing.isFastTransfer` 로 매핑. 신규 컬럼 도입하지 않음.
- UI/도메인 라벨 매핑:
  - "빠른승계" 카드 = `type=TRANSFER AND isFastTransfer=true AND isVerified=true`
  - "일반승계" 카드 = `type=TRANSFER AND isFastTransfer=false`
  - "중고리스/렌트" = `type IN (USED_LEASE, USED_RENTAL)`
- `isVerified` = 검수 완료 게이트(UI 가시화), `isFastTransfer` = 빠른승계 신청 여부(매니저 라우팅).
- 거절 후 매도자가 빠른승계 → 일반승계 자율 전환 = `isFastTransfer=true → false` 1방향만 (PUT allowlist 추가). 반대 전환은 admin 권한.

### I. 상태 전이표 (1차 동결)

**Listing.status** (REJECTED 추가 후):
| from | to | trigger |
|------|----|---------|
| DRAFT | PENDING | 매도자 등록 완료 |
| PENDING | ACTIVE | admin 승인 |
| PENDING | REJECTED | admin 거절 (`rejectionReason` 필수) |
| ACTIVE | RESERVED | EscrowPayment PENDING→PAID |
| RESERVED | SOLD | 명의변경 검증 완료 (`EscrowPayment.verifiedAt` 설정 + RELEASED) |
| RESERVED | ACTIVE | EscrowPayment REFUNDED (분쟁 환불 포함) |
| ACTIVE | HIDDEN | 매도자 자율 숨김 |
| HIDDEN | ACTIVE | 매도자 재공개 |
| ACTIVE | PENDING | REPORTS_THRESHOLD 자동 가림(`reviewReason` 설정) |
| REJECTED | — | 종결, 매도자 재신청은 신규 Listing |

**EscrowPayment.status**:
| from | to | trigger |
|------|----|---------|
| PENDING | PAID | 토스 confirm webhook |
| PAID | DISPUTED | 분쟁 신청 → 매니저 mediation 시작 |
| PAID | RELEASED | transferProofKey verified + payoutAt 설정 |
| PAID | REFUNDED | admin 승인된 취소 요청 |
| DISPUTED | RELEASED | mediationResolution=SELLER_RELEASE |
| DISPUTED | REFUNDED | mediationResolution=BUYER_REFUND |
| DISPUTED | DISPUTED | mediationResolution=EXTERNAL_MEDIATION (자금 보유 max 90일, 별도 timer) |

> 매도자/구매자 알림은 위 모든 transition에 대해 NotificationType enum 매핑 명시 (TASK 분할 시 함께 점검).

### J. Migration 사전 작업 (사람 직접 작성)
1. `add_listing_status_rejected.sql` — enum 추가 + 기존 row 영향 없음.
2. `add_profile_penalty_fields.sql` — `PenaltyLevel` enum + 5 필드 + default backfill.
3. `add_notification_types.sql` — enum 8개 추가 (deprecated `ESCROW_STATUS` 유지).
4. `extend_listing_fast_transfer.sql` — `isFastTransfer`, `estimatedMarketPrice`, `dealerNote`, `inspectionChecklist`, `registrationDocumentKey`, `capitalGuideAcknowledgedAt`, `proposalSentAt`, `followUpAttemptedAt`, `reviewReason`, `inspectionReportKey` rename.
5. `extend_escrow_payment_v1.sql` — 18 필드(증빙·분쟁·정산), key 필드 rename.
6. `extend_chat_message_review.sql` — 6 필드 + index.
7. `create_report.sql` — Report 모델 + 3 인덱스.
8. `replace_dealer_review_v2.sql` — 기존 row DELETE + schema 교체 + unique/index.

> migration 순서·롤백 전략은 별도 사람 작업 spec에서 동결.

---

## API 신규 (Phase 1)

### 신고 / 검수
- `POST /api/reports`
- `GET /api/admin/reports`
- `POST /api/admin/reports/[id]/resolve`
- `GET /api/admin/messages/queue`
- `POST /api/admin/messages/[id]/approve`
- `POST /api/admin/messages/[id]/block`

### 빠른승계 거절·전환
- `POST /api/admin/listings/[id]/transfer-downgrade-propose`
- `POST /api/listings/[id]/transfer-downgrade-accept`
- `POST /api/listings/[id]/transfer-downgrade-reject`

### 명의변경 증빙
- `POST /api/listings/[id]/registration-document` (원부 업로드)
- `POST /api/escrow/[id]/transfer-proof`
- `POST /api/admin/escrow/[id]/verify-transfer`

### 분쟁
- `POST /api/admin/escrow/[id]/dispute/open`
- `POST /api/admin/escrow/[id]/dispute/resolve`

### 패널티
- `POST /api/admin/profiles/[id]/penalty`

### 후기
- `POST /api/reviews`
- `GET /api/profiles/[id]/reviews`
- `GET /api/listings/[id]/seller-reviews`
- `GET /api/admin/managers/[id]/reviews`
- `POST /api/admin/reviews/[id]/hide`

### 캐피탈 가이드 (정적, API 불필요)
- `app/(public)/guide/capital-companies/[name]/page.tsx`

---

## 외부 dependency

| 패키지 | 용도 |
|--------|------|
| `solapi` | SMS 발송 (Critical 알림) |
| `@anthropic-ai/sdk` | Claude Haiku 4.5 메시지 분류 |

환경변수:
- `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_NUMBER`
- `ANTHROPIC_API_KEY`
- `FAST_TRANSFER_FEE=300000`

---

## Phase 1 — Tiered Launch Plan (재구성)

> 기존 "Q18~Q36 모두 = Must-have"는 MVP가 아닌 신뢰/운영 1차 릴리즈 전체. 런칭 차단 항목을 더 작게 잡는다.

### Launch Blocker (1차 — 출시 차단, 외부 dependency 없이 가능)
1. **Schema baseline 확정** — Addendum A~J 모든 migration 사람 작성·적용.
2. **매물 승인 게이트** — PENDING→ACTIVE/REJECTED 전이 + `rejectionReason` UI + `LISTING_APPROVED`/`LISTING_REJECTED` in-app 알림.
3. **Private 문서 업로드** — `registrationDocumentKey` + `transferProofKey` 업로드 → storage key 저장 + signed URL 발급 헬퍼 + RLS.
4. **에스크로 명의변경 검증** — `transferProofKey` 업로드 → admin 수동 검증 → RELEASED 전이 + payoutAt.
5. **신고 모델 + 수동 패널티 UI** — `Report` 모델 + admin 수동 처분(`Profile.penaltyLevel`/`suspendedUntil`/`bannedAt`).
6. **연락처 정규식 차단 강화** — 기존 `containsContactInfo` + `ChatMessage.reviewStatus`/`blockReason` 필드만 (AI는 2차).
7. **캐피탈사 가이드 정적 페이지 8개 + 동의 체크** — `capitalGuideAcknowledgedAt` 게이트.
8. **에스크로 상태 머신 정합성** — Addendum I 전이표 모두 코드 반영 + `requireActiveProfile()` 가드.

### Phase 1 Stretch (2차 — 외부 dependency·운영 인력 필요)
- 빠른승계 매니저 검수 산출물(`estimatedMarketPrice`/`dealerNote`/`inspectionChecklist`) + UI 노출.
- AI 채팅 분류 (Anthropic Claude Haiku 4.5 + `aiSuspicionScore`/`aiReason` + admin 검수 큐).
- Critical SMS 알림 (Solapi + 발신번호 등록).
- 분쟁 mediation 흐름 (`disputedAt`~`mediationResolution` 18필드 풀 활용 + admin UI).
- 후기 시스템 v2 (DealerReview 재설계 + 매니저/매도자 평가 통합 폼).
- SLA breach 자동 감지 큐 (`GET /api/admin/queues/sla-breaches`).
- `TRANSFER_DOWNGRADE_PROPOSAL` 흐름 (빠른승계 거절→일반매물 제안).

### Phase 1 Should-have (있으면 좋음)
- HOME "이번 주 검수 완료 매물" 섹션
- HOME 가이드 콘텐츠 (승계 거래 / 캐피탈사 / 분쟁)
- admin 칸반 컬럼 분리 (검수 대기 / follow-up / 명의변경 검증 / 분쟁)
- 매도자 마이페이지 "내 위반 이력" 카드 (투명성)
- 채팅 이미지 메시지 admin 검수 큐 (Phase 1 단순화)

## Phase 2 명시적 제외

- trust score 시스템 (매도자/구매자/매니저 점수)
- 별도 ProfileViolation 모델 + 자동 만료 cron
- 토스페이먼츠 부분환불 (50:50 합의 자동 처리)
- 매니저 개인 페이지 buyers 노출 + 매니저 인센티브 시스템
- 후기 답글 + 후기 신뢰 AI 분석
- 일반 매물 매도자 정률 수수료
- 알고리즘 노출 가중치 (검수+신선도+조회수+찜수-신고)
- OCR 자동화 (자동차등록증·등록원부)
- 카카오 알림톡 (SMS 대체)
- 외부 중재기관 자동 신청 통합
- 디바이스 fingerprint 어뷰즈 차단
- PostgreSQL FTS / Algolia (검색 일치도 점수)

---

## 운영 사전 작업 (Phase 1 출시 전)

### 1. 약관 작성
- 이용약관, 매도자 약관, 구매자 약관, 분쟁 정책, 외부 중재 안내, 자금 보유 90일 디폴트 룰
- 토스페이먼츠 에스크로 약관 + 한국 전자상거래법 통신판매중개업자 책임 정합성 검토 (법무 자문 권장)

### 2. 콘텐츠 작성
- 캐피탈사 가이드 8개: `docs/capital-companies/{kb,hyundai,lotte,woori,bnk,meritz,shinhan-card,hana}.md`
- admin 매뉴얼 3개:
  - `docs/admin-manual/transfer-verification.md`
  - `docs/admin-manual/seller-violations.md`
  - `docs/admin-manual/buyer-violations.md`

### 3. 운영 절차
- Solapi 발신번호 KISA 사전 등록 (1~3영업일)
- Supabase Storage 버킷 분리: `listing-documents`, `transfer-proofs` (private + RLS)
- 매니저 인력 확보 (빠른승계 영업일 3일 SLA 유지)

---

## 핵심 리스크

1. **토스페이먼츠 정산 API 통합** — PG + 자체 수수료 차감 + 매도자 송금 흐름. 정산 실패 케이스(매도자 계좌 정보 오류 등) 처리.
2. **AI 분류 false positive** — 임계값 0.7 초기 모니터링 필요, 정상 메시지 차단 시 admin 즉시 복구 UX.
3. **캐피탈사 동의 거부율** — 사전 가이드 인지 효과 측정. 거부율 높을 시 매니저 사전 콜 의무화 검토.
4. **매니저 인력 부족** — 빠른승계 신청량 예측 실패 시 SLA 미준수 → 차용 신뢰 ↓.
5. **prisma migration 작성** — 다수 필드 추가 + DealerReview 호환성. Hybrid 보호 영역(`prisma/migrations/**`) → 사람 직접 작성.
6. **Hybrid TASK 분할** — Cross-cutting invariants(에스크로 상태 머신·인증·매물 승인·연락처 필터) 단일 TASK 묶이지 않게 사전 split 필수 (CLAUDE.md 라인 198~202 참조).

---

## 다음 단계

1. **Schema Contract Addendum 검토 + 동결** (본 단계 완료 시 이하 진행).
2. **Launch Blocker 1차 세트만 `.tasks/` 카드 분할** — Stretch는 1차 머지 후 별도 회차.
   - cross-cutting 사전 split (Addendum I 전이표 기준)
   - 1 TASK = 1 파일 원칙 유지
3. **사람 작업 병행 — Launch Blocker에 필수만**:
   - prisma migration 사람 작성 — runbook: `docs/superpowers/specs/2026-05-06-chayong-migration-runbook.md` (Addendum J의 1·2·3·4·5·6·7번 = 1차 필수, 8번은 Stretch)
   - Supabase Storage 버킷 3개 생성 + RLS 정책
   - 약관 1차 초안 (이용·매도자·구매자·분쟁·자금보유 90일) + 법무 자문 큐
   - admin 매뉴얼 1차: `transfer-verification.md` (Launch Blocker 4번에 직접 묶임)
4. **`.harness/routing.md` 업데이트** — Launch Blocker 영역 owner/reviewer 매핑 + 보호 영역 명시.
5. **외부 dependency 사전 등록** — Stretch 회차 시작 전까지:
   - Solapi 계정 + 발신번호 KISA 등록 (1~3영업일 lead time)
   - Anthropic API 키 발급
6. **Q1~Q17 결정 보강 문서화** — 별도 spec(`2026-05-06-chayong-q1-q17-baseline.md`)으로 분리, Phase 1 차단 아님.

---

## Launch Blocker → TASK 매핑 (1차)

> 1 TASK = 1 file 원칙. cross-cutting 영역은 `sub_boundary` 명시. schema/migration/RLS는 human-only.

| LB | 영역 | TASK | files | owner | sub_boundary |
|----|------|------|-------|-------|--------------|
| 1 | Schema baseline (Addendum J 1~7) | TASK-009 | prisma/schema.prisma + prisma/migrations/* + bucket policy SQL | claude/human | — |
| 2 | 매물 승인 게이트 | TASK-010 | src/lib/notifications/send.ts (신규) | codex-fast | — |
| 2 | 매물 승인 게이트 | TASK-011 | src/types/admin.ts (VALID_STATUS_TRANSITIONS REJECTED 추가) | codex-fast | APPROVAL_PIPELINE |
| 2 | 매물 승인 게이트 | TASK-012 | src/app/api/admin/listings/[id]/route.ts (rejectionReason 필수 + 알림) | codex-strict / claude | APPROVAL_PIPELINE |
| 2 | 매물 승인 게이트 | TASK-013 | src/features/admin/components/listing-admin-table.tsx (거절 모달) | codex-fast | APPROVAL_PIPELINE |
| 3 | Private 문서 업로드 | TASK-014 | src/lib/supabase/storage.ts (createSignedKeyUrl helper, 신규) | codex-strict / claude | — |
| 3 | Private 문서 업로드 | TASK-015 | src/app/api/listings/[id]/registration-document/route.ts | codex-strict / claude | UPLOAD_PRIVATE |
| 3 | Private 문서 업로드 | TASK-016 | src/app/api/escrow/[id]/transfer-proof/route.ts | codex-strict / claude | UPLOAD_PRIVATE |
| 4 | 명의변경 검증 | TASK-017 | src/app/api/admin/escrow/[id]/verify-transfer/route.ts | codex-strict / claude | ESCROW_STATE |
| 4 | 명의변경 검증 | TASK-018 | src/features/admin/escrow-verify-form.tsx | codex-fast | — |
| 5 | 신고 + 패널티 | TASK-019 | src/app/api/reports/route.ts (POST) | codex-strict / claude | REPORT_FLOW |
| 5 | 신고 + 패널티 | TASK-020 | src/app/api/admin/reports/route.ts (GET) | codex-fast | REPORT_FLOW |
| 5 | 신고 + 패널티 | TASK-021 | src/app/api/admin/reports/[id]/resolve/route.ts | codex-strict / claude | REPORT_FLOW |
| 5 | 신고 + 패널티 | TASK-022 | src/app/api/admin/profiles/[id]/penalty/route.ts | codex-strict / claude | PENALTY |
| 5 | 신고 + 패널티 | TASK-023 | src/lib/api/auth-guard.ts (`requireActiveProfile()` 추가) | codex-strict / claude | AUTH |
| 5 | 신고 + 패널티 | TASK-030 | src/app/api/reports/route.ts (누적 신고 자동 가림) | codex-strict / claude | REPORT_FLOW |
| 5 | 신고 + 패널티 | TASK-031 | src/app/api/admin/reports/[id]/resolve/route.ts (target 처분/복구) | codex-strict / claude | REPORT_FLOW |
| 6 | 연락처 차단 강화 | TASK-024 | src/lib/chat/contact-filter.ts (reviewStatus 매핑) | codex-strict / claude | CONTACT_FILTER |
| 6 | 연락처 차단 강화 | TASK-025 | src/app/api/chat/messages/route.ts (블록 사유 저장) | codex-strict / claude | CONTACT_FILTER |
| 7 | 캐피탈 가이드 | TASK-026 | src/app/(public)/guide/capital-companies/[name]/page.tsx | codex-fast | — |
| 7 | 캐피탈 가이드 | TASK-027 | src/lib/capital/companies.ts (8개 콘텐츠 데이터 — 신규) | codex-fast | — |
| 7 | 캐피탈 가이드 | TASK-028 | src/features/sell/components/capital-guide-modal.tsx (모달만; sell wizard 통합은 별도 카드) | codex-fast | — |
| 8 | 상태 머신 정합성 | TASK-029 | src/app/api/payment/confirm/route.ts (RESERVED 전이 검증 강화) | codex-strict / claude | ESCROW_STATE |

> Stretch(2차)는 1차 머지 후 별도 카드 회차. 본 매핑은 *.md 보호 영역 → claude만 갱신.

---

## Cross-cutting Invariants (Hybrid TASK 분할 시 사전 split 필수)

CLAUDE.md 명시 4개 + Q1~Q37 결정으로 추가된 영역:

1. **에스크로 상태 머신** — `payment/**` + `admin/escrow/**` + `Listing.status RESERVED/SOLD` + `Notification(ESCROW_*)` + 명의변경 검증 + 분쟁 처리 + 정산
2. **인증 흐름** — `auth-guard.ts` + `supabase/server.ts` + `(protected)/layout.tsx` + `requireActiveProfile()` (신규)
3. **매물 승인 파이프라인** — `admin/listings approve` + `Listing.status PENDING→ACTIVE` + `Notification(LISTING_APPROVED)` + 카드 노출 조건 + 빠른승계 매니저 검수 + 산출물 저장 + 거절 흐름
4. **연락처 필터 강화** — `contact-filter.ts` + `chat/messages POST` + 클라이언트 sanitize hook + AI 분류 통합 + 검수 큐
5. **신고/패널티 통합** — `Report` 모델 + 자동 차단 트리거 + Profile 패널티 필드 + API 가드 + admin 처분 UI (신규)
6. **후기/reputation 노출** — `DealerReview` 확장 + 매도자 프로필 + 매물 상세 + 빠른승계 카드 매니저 별점 + admin 매니저 평가 (신규)
