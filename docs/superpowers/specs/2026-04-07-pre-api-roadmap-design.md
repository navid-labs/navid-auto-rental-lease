# Pre-API Roadmap Design: KOTSA 준비 + 역경매 핵심

**Date**: 2026-04-07
**Status**: Draft
**Approach**: C. 병렬 트랙 (KOTSA 준비 + 역경매 동시 진행)
**Timeline**: ~2주 (API 발급 대기 기간)

---

## 배경

KOTSA 자동차종합정보 API 승인 완료 (2026-04-03). KCB 가입 + 서류 제출 + 인증키 발급까지 ~2주 대기.
이 기간 동안 API 연동 인프라와 v3.0 핵심 비즈니스 로직을 병렬로 구축한다.

### 현재 상태

- v3.0 Hardening 완료, between_milestones 상태
- 45개 API 라우트, 19개 DB 모델, 439 테스트
- 비교견적: 차량 비교 UI + 견적 계산 라이브러리 존재. 역경매/입찰 없음
- 딜러 포털: 라우트 + 차량 CRUD + 승인 워크플로우 존재. 대시보드 비어있음
- KCB 본인인증: Mock eKYC 전체 플로우 구현됨
- KOTSA 차량 리포트: 검사 스키마 ~30필드. 176필드 확장 필요

---

## Track 1: 스키마 최적화 + KOTSA 연동 준비

### 1-A. Prisma 전체 스키마 최적화

기존 19개 모델 전체를 리뷰하고 개선한다.

**최적화 항목**:

1. **인덱스 추가**
   - `Vehicle`: `(status, brandId)`, `(fuelType, transmission)` 복합 인덱스
   - `Contract`: `(status, customerId)`, `(contractType, status)` 복합 인덱스
   - `Payment`: `(contractId, status)` 복합 인덱스
   - 기타 자주 필터링되는 필드 점검

2. **관계 정리**
   - nullable 관계 중 실제로 항상 존재해야 하는 필드 식별 → required로 변경
   - cascade 전략 검토 (onDelete: Cascade vs SetNull vs Restrict)

3. **필드 타입 최적화**
   - 금액 필드: `Float` → `Decimal` 검토 (정밀도 필요 시)
   - 날짜 필드 일관성 점검 (`DateTime` 기본값, timezone 처리)
   - 불필요한 String 필드 중 Enum 전환 가능한 것 식별

4. **v3.0 신규 Enum 추가**
   - `QuoteRequestStatus`: OPEN, BIDDING, COMPARING, SELECTED, CONTRACTED, EXPIRED
   - `BidStatus`: PENDING, SUBMITTED, SELECTED, REJECTED, WITHDRAWN

5. **v3.0 신규 모델** (Track 2 상세 설계와 동시 진행)
   - `QuoteRequest`, `DealerBid` (역경매 핵심)

### 1-B. KOTSA API 응답 타입 매핑

KOTSA 176필드를 API 응답 구조에 맞춰 타입 + 스키마 설계.

**파일 구조**:

```
src/lib/kotsa/
├── types/
│   ├── basic-info.ts        # 자동차기본정보 (34필드)
│   ├── spec-1.ts             # 제원정보1 (36필드)
│   ├── spec-2.ts             # 제원정보2 (34필드)
│   ├── maintenance.ts        # 정비이력정보 (16필드)
│   ├── inspection-1.ts       # 성능점검정보1 (25필드)
│   ├── inspection-2.ts       # 성능점검정보2 (31필드)
│   └── index.ts              # 통합 export
├── schemas/
│   ├── basic-info.schema.ts  # Zod validation (API 응답 파싱)
│   ├── spec-1.schema.ts
│   ├── spec-2.schema.ts
│   ├── maintenance.schema.ts
│   ├── inspection-1.schema.ts
│   ├── inspection-2.schema.ts
│   └── index.ts
├── adapters/
│   ├── kotsa-adapter.ts      # interface: fetchVehicleInfo(carRegNo, ci)
│   └── mock-adapter.ts       # Mock 구현 (개발/테스트용)
└── utils/
    └── mapper.ts             # KOTSA 응답 → Vehicle.inspectionData 변환
```

**설계 원칙**:
- 어댑터 패턴: `KotsaAdapter` interface → `MockKotsaAdapter` (지금) / `RealKotsaAdapter` (API 도착 후)
- Zod 스키마로 API 응답 파싱 + 타입 안전성 보장
- 기존 `Vehicle.inspectionData` JSON 필드와 호환 매퍼
- Mock 어댑터는 실제 API 응답 구조와 동일한 형태의 fixture 데이터 반환

### 1-C. 차량 상태 리포트 UI

Mock 데이터 기반으로 동작하는 차량 상태 리포트 페이지.

**라우트**: `/vehicles/[id]/report`

**UI 구성**:
- 6개 카테고리별 탭 또는 아코디언 레이아웃
- 차량 다이어그램: 15개 패널 상태 시각화 (기존 inspection-data.ts의 패널 구조 활용)
- 정비이력 타임라인: 날짜순 정비 기록
- 종합 등급 배지: A+, A, B+, B, C (기존 grading 로직 활용)
- 핵심 수치 요약 카드: 주행거리, 사고이력, 침수여부, 소유자변경 횟수

**데이터 흐름**:
```
Mock 어댑터 → KOTSA 타입 데이터 → mapper → 리포트 컴포넌트
```

### 1-D. KCB 본인인증 플로우 정제

기존 Mock eKYC를 실제 KCB 연동 대비 구조로 리팩터.

**변경 사항**:

1. **어댑터 패턴 분리**
   ```
   src/lib/ekyc/
   ├── adapter.ts          # KcbAdapter interface
   ├── mock-adapter.ts     # 현재 Mock 로직 이전
   └── real-adapter.ts     # KCB 라이선스 수령 후 구현
   ```

2. **OTP 보안 강화**
   - 재전송 제한: 3회/5분
   - 코드 만료: 3분
   - 시도 횟수 제한: 5회 초과 시 30분 잠금

3. **CI/DI 저장 구조**
   - `EkycVerification` 모델에 `ci` (88 Byte), `di` (64 Byte) 필드 추가
   - CI: 전사 고유 식별 (타 사이트 연계)
   - DI: 사이트 내 고유 식별 (중복가입 방지)

4. **KOTSA 연계 파라미터**
   - 본인인증 완료 후 `carOwner` + `carRegNo` 수집
   - KOTSA API 호출 시 필요한 `insttCode`, `svcCodeArr` 설정 관리

---

## Track 2: 역경매/비교견적 핵심 시스템

### 2-A. 데이터 모델 + 상태머신

**QuoteRequest (견적 요청)**

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id | UUID |
| customerId | String | 요청 고객 |
| contractType | ContractType | RENTAL / LEASE |
| preferredBrandId | String? | 선호 브랜드 |
| preferredModelId | String? | 선호 모델 |
| yearMin | Int? | 최소 연식 |
| yearMax | Int? | 최대 연식 |
| budgetMin | Int? | 최소 월 예산 |
| budgetMax | Int | 최대 월 예산 |
| contractMonths | Int | 계약 기간 (12/24/36/48) |
| depositMax | Int? | 최대 보증금 |
| mileageLimit | Int? | 주행거리 제한 (km/년) |
| specialRequests | String? | 특수 요청사항 |
| status | QuoteRequestStatus | 상태머신 |
| expiresAt | DateTime | 입찰 마감 시간 |
| selectedBidId | String? | 선택된 입찰 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**DealerBid (딜러 입찰)**

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id | UUID |
| quoteRequestId | String | 연결된 견적 요청 |
| dealerId | String | 입찰 딜러 |
| vehicleId | String? | 제안 차량 (보유 재고 중) |
| monthlyPayment | Int | 월 납입금 |
| deposit | Int | 보증금 |
| totalCost | Int | 총 비용 |
| residualValue | Int? | 잔존가치 (리스) |
| interestRate | Float? | 이자율 |
| contractTerms | Json? | 세부 계약 조건 |
| promotionNote | String? | 프로모션/특이사항 메모 |
| status | BidStatus | 상태머신 |
| submittedAt | DateTime? | 제출 시점 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**상태머신**:

```
QuoteRequest:
  OPEN → BIDDING (첫 입찰 도착 시)
  BIDDING → COMPARING (마감 도달 or 최소 입찰 수 충족)
  COMPARING → SELECTED (고객이 입찰 선택)
  SELECTED → CONTRACTED (계약 생성 완료)
  {OPEN, BIDDING} → EXPIRED (마감 시간 초과 + 입찰 부족)

DealerBid:
  PENDING → SUBMITTED (딜러 제출)
  SUBMITTED → SELECTED (고객 선택)
  SUBMITTED → REJECTED (다른 입찰 선택 시 자동)
  {PENDING, SUBMITTED} → WITHDRAWN (딜러 철회)
```

### 2-B. 고객 견적 요청 플로우

**라우트**: `/quote/request`

**스텝 위자드** (4단계):

1. **차량 조건** (Step 1)
   - 계약 유형: 렌탈 / 리스
   - 차종: 브랜드 → 모델 (기존 Brand/CarModel 데이터 활용)
   - 연식 범위, 연료, 변속기 (선택)

2. **계약 조건** (Step 2)
   - 계약 기간: 12 / 24 / 36 / 48개월
   - 월 예산 범위 (슬라이더)
   - 보증금 범위 (슬라이더)
   - 연간 주행거리 제한 (선택)

3. **추가 요청** (Step 3)
   - 특수 옵션/요청사항 (텍스트)
   - 입찰 마감일 설정 (기본: 3일 후)

4. **확인 & 제출** (Step 4)
   - 요약 카드
   - 제출 → QuoteRequest 생성

**제출 후 UX**:
- 대기 화면: 현재 입찰 수 표시 (30초 간격 polling — 실시간 WebSocket은 scope 외)
- 마감 후 → 비교 화면으로 전환

**API**:
- `POST /api/quotes` — 견적 요청 생성
- `GET /api/quotes/[id]` — 견적 요청 상세 + 입찰 목록
- `GET /api/quotes/my` — 내 견적 요청 목록
- `PATCH /api/quotes/[id]/select` — 입찰 선택

### 2-C. 딜러 입찰 포털

**라우트**: `/dealer/bids`

**UI 구성**:

1. **새 견적 요청 목록** (`/dealer/bids`)
   - 매칭 필터: 딜러 보유 브랜드/차종 기반 자동 필터링
   - 카드형 목록: 고객 요구 조건 요약 + 마감까지 남은 시간 + 현재 입찰 수
   - 상태 탭: 전체 / 입찰 가능 / 내 입찰

2. **입찰 작성** (`/dealer/bids/[quoteId]/new`)
   - 보유 차량 선택 (기존 인벤토리 연동)
   - 월납입금, 보증금, 잔존가치, 이자율 입력
   - 프로모션 메모 (선택)
   - 기존 `src/lib/finance/` 계산 라이브러리 연동하여 실시간 계산

3. **내 입찰 관리** (`/dealer/bids/my`)
   - 진행중 / 선정 / 미선정 탭
   - 입찰 수정/철회

**API**:
- `GET /api/dealer/quotes` — 입찰 가능한 견적 요청 목록
- `POST /api/dealer/bids` — 입찰 제출
- `GET /api/dealer/bids/my` — 내 입찰 목록
- `PATCH /api/dealer/bids/[id]` — 입찰 수정
- `DELETE /api/dealer/bids/[id]` — 입찰 철회

### 2-D. 비교견적 결과 UI

**라우트**: `/quote/[id]/compare`

**UI 구성**:
- 카드형 비교 뷰: 딜러별 견적을 카드로 나열
- 핵심 수치 하이라이트: 월납입금, 총비용, 잔존가치 비교 (최저값 강조)
- 정렬: 최저 월납입금순 (기본), 최저 총비용순, 보증금순
- 딜러 프로필: 딜러명, 프로모션 메모
- **선택 → 계약 전환**: 입찰 선택 시 기존 `Contract` 생성 플로우로 연결
  - QuoteRequest.status → SELECTED
  - 선택된 DealerBid.status → SELECTED, 나머지 → REJECTED
  - Contract 생성 (DRAFT) → 기존 계약 플로우 진입

---

## 타임라인

| 주차 | Track 1 (KOTSA 준비) | Track 2 (역경매 핵심) |
|------|---------------------|---------------------|
| Week 1 전반 | 1-A. Prisma 전체 스키마 최적화 | 2-A. QuoteRequest/DealerBid 모델 + 상태머신 |
| Week 1 후반 | 1-B. KOTSA 176필드 타입 + Zod + Mock 어댑터 | 2-B. 고객 견적 요청 위자드 UI + API |
| Week 2 전반 | 1-C. 차량 상태 리포트 UI | 2-C. 딜러 입찰 포털 UI + API |
| Week 2 후반 | 1-D. KCB 본인인증 어댑터 정제 | 2-D. 비교견적 결과 UI + 계약 전환 |

### 의존 관계

```
1-A (스키마 최적화) ─┬→ 1-B (KOTSA 타입)  → 1-C (리포트 UI)
                    └→ 2-A (역경매 모델)  → 2-B (견적 요청) → 2-D (비교 결과)
                                         → 2-C (딜러 입찰) ↗
1-D (KCB 정제) — 독립 진행 가능
```

### OMC 활용 계획

- 1-A 완료 후: `ultrawork`로 Track 1, Track 2 병렬 subagent 실행
- 2-B, 2-C: `team` 모드로 고객/딜러 UI 동시 개발
- 각 단계 완료: `verifier` agent로 검증

---

## Scope 외 (API 도착 후)

- `RealKotsaAdapter` 구현 (KOTSA API 연동)
- `RealKcbAdapter` 구현 (KCB 실제 연동)
- 실시간 채팅 (WebSocket 인프라)
- PG 결제 연동 (Toss/아임포트)
- 전자서명 (DocuSign/자체)
- Capacitor 모바일 앱
- 딜러 분석 대시보드 고도화
