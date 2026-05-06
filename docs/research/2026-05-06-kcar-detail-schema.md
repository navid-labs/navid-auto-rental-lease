---
title: K카 상세 페이지 데이터 스키마 추출
date: 2026-05-06
type: research
sources:
  - https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=EC61351177  (만료 — "데이터 없음" 반환)
  - https://m.kcar.com/bc/detail/carInfoDtl  (캐시: .firecrawl/m.kcar.com-bc-detail-carInfoDtl.md, 모바일 풀 데이터)
related:
  - 2026-05-06-eacar-platform-audit.md
  - 2026-05-06-prisma-schema-diff.md
note: |
  사용자가 지정한 데스크탑 URL EC61351177은 매물 만료 ("데이터 없음" 반환).
  스키마 추출은 모바일 사이트(m.kcar.com) 캐시 기준 — 데스크탑/모바일은 동일 백엔드라 필드 동등.
  ⭐ 라이브 매물 EC60897220 (현대 i30) 풀 데이터는 [2026-05-06-kcar-live-detail-EC60897220.md](./2026-05-06-kcar-live-detail-EC60897220.md) 참조 — 39장 사진/진단/보험이력/평가사 코멘트/옵션 출고가까지 완전 추출됨.
---

## 한 줄 결론

K카는 **직영중고차 보증·점검 신뢰 모델**로, 데이터 모델이 차용/이어카(C2C 승계)와 본질적으로 다름. 그러나 (1) **점검 데이터 표시법** (외부 패널 판금/교환 카운트, 진단통과/알림사항), (2) **상세 페이지 정보 위계** (헤더→옵션→진단→과거이력→보증→가격계산), (3) **구매 결제 옵션 다양화** (3일 환불 홈서비스, 현금/카드/할부)는 차용에 그대로 미러링 가치 있음.

---

## 1. 페이지 섹션 매핑

K카 상세 페이지는 **8개 주요 섹션** + 8개 사이드 액션 다이얼로그.

| # | 섹션 | 핵심 데이터 | 차용 갭 |
|---|---|---|---|
| 1 | 헤더 / 갤러리 | 가격, 연식·월식, 주행거리, 찜/비교/공유, 360°/실내/문열기/문닫기 뷰 토글 | 갤러리는 단일 이미지 → eacar처럼 11장+ 그리드 필요 |
| 2 | 주요 옵션 | 아이콘+이름 페어, "옵션 모두 보기" 모달 | options 평탄 배열 — 아이콘 매핑 X |
| 3 | 외부 패널 및 프레임 진단 | 판금 N건 / 교환 N건 (외판/주요부 분리) | 차용 `inspectionChecklist: Json` 있지만 표시 컴포넌트 없음 |
| 4 | 주요 진단결과 | 사고진단(통과/N건), 실내·외관/타이어·휠/소모품/하체/알림사항별 N건 | 동일 |
| 5 | 주요 과거이력 | 내차 피해, 소유주 변경 회수, 주의이력 | `ownerCount` ✓, 피해/주의 별도 필드 없음 |
| 6 | K Car Warranty (보증) | 제조사 보증 잔여 + K Car 보증 +2년 가입 시 연장 | C2C 승계엔 부적합. 차용은 캐피탈사 잔여보증 표시로 대체 |
| 7 | 차량평가사 추천 | 평가사 사진/소속/사원증, 추천 코멘트 | DEALER 프로필 카드 매핑 |
| 8 | 추가 비용 없는 예상 구매비용 | 차량가 + 이전등록비 + 등록신청대행수수료 + 관리비용 + 배송비 | 차용 `listing-cost-calculator.tsx` ✓ (이미 있음) |

### 사이드 액션

```
일대일 판매사원 챗봇      → 차용 ChatRoom
일대일 채팅                  → 동일
전화 상담                     → tel: 링크
홈서비스 바로구매          → 차용 미적용 (배송 없음)
직영점 방문예약 신청       → 차용 미적용
구매비용 계산기              → ✓ 있음
대출한도 조회                 → Phase 2
보험료 조회                   → Phase 2
차량 비교하기                → Phase 2
관심차량 입고알림           → 미적용 (재고 모델 아님)
```

---

## 2. 핵심 데이터 필드 (차용 매핑)

### 2.1 차량 기본

| K카 필드 | 차용 매핑 | 비고 |
|---|---|---|
| 가격 (만원) | `monthlyPayment` (월) + `totalPrice` (총) | K카=일시불, 차용=월/총 둘 다 |
| 연식·월식 (예: 2023년 5월식) | `year` ✓ + 월 정보 부족 | `registrationDate` 추가 권장 |
| 주행거리 (km) | `mileage` ✓ |  |
| 외부 패널 판금 N건 | `inspectionChecklist.exteriorPanel.repaint` | Json 구조화 필요 |
| 외부 패널 교환 N건 | `inspectionChecklist.exteriorPanel.replace` | 동일 |
| 주요부 판금/교환 N건 | `inspectionChecklist.mainFrame.repaint/replace` | 동일 |
| 사고진단 (통과/N건) | `accidentCount` ✓ + 사고급 분류 |  |
| 실내 및 외관 N건 | `inspectionChecklist.interior.issues` | 동일 |
| 타이어 및 휠 N건 | `inspectionChecklist.tires.issues` | 동일 |
| 소모품 N건 | `inspectionChecklist.consumables.issues` | 동일 |
| 하체 N건 | `inspectionChecklist.chassis.issues` | 동일 |
| 알림사항 N건 | `inspectionChecklist.notes` | 동일 |
| 내차 피해 (없음/있음) | `damageHistory: Boolean` | **신규** |
| 소유주 변경 N회 | `ownerCount` ✓ |  |
| 주의이력 (없음/항목 리스트) | `cautionHistory: String[]` | **신규** |
| 제조사 보증 잔여 km/개월 | `manufacturerWarrantyRemaining: Json?` | **신규** |
| 차량평가사 (소속/사원증) | DEALER `Profile` |  |

### 2.2 비용 계산 필드

K카 표시:
```
차량가 + 이전등록비 + 등록신청대행수수료 + 관리비용 + 배송비
```

차용 표시(`listing-cost-calculator.tsx`):
```
월납입금 × 잔여개월 + 인수금 + 승계수수료 + 보증금
```

→ 차용은 **금융 잔여 + 인수**가 핵심, K카는 **일시 차값 + 부대비용**. **차이는 본질** — K카 모델은 차용에 미적용. 단 "기타 비용"(보증금/취등록세) 표기 가독성은 K카가 우수.

### 2.3 옵션 카탈로그

K카는 옵션 아이콘 페어 (`https://img.kcar.com/kcarmall/OPTION/image/{slug}.png`)로 시각화. 차용은 텍스트만. **이어카 카테고리 그룹핑 + K카 아이콘 매핑** 조합이 최적.

옵션 카테고리 (이어카 기준, 차용 미러링 권장):
```
기본/컴포트, 외장(헤드램프/사이드미러/휠타이어), 시트, 룸미러, 스티어링휠,
파킹, 에어백, 주행안전, 주차보조, 에어컨, 유무선단자, 오디오/내비
```

### 2.4 결제 방식

K카: 현금(가상계좌) / 카드(삼성카드 한정) / K Car 할부.

차용: 토스페이먼츠 에스크로 (현행). MVP 단계에서 **카드/계좌이체 둘 다 토스 단일 결제**로 처리. K카처럼 다중 결제 분할은 후순위.

---

## 3. 데스크탑 URL 만료 이슈

사용자가 지정한 `https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=EC61351177`은 firecrawl scrape 결과 "데이터 없음" 반환. 차량 ID `EC61351177`은 K카 매물 만료(판매완료 또는 노출 종료) 추정.

### 대응

- **모바일 캐시 사용** (`.firecrawl/m.kcar.com-bc-detail-carInfoDtl.md`) — 백엔드 동일이라 스키마 동등.
- **새 라이브 차량 확보**가 필요하면 K카 차량검색 페이지에서 활성 매물을 골라 firecrawl 재실행 (별도 TASK 권장).
- 차량 ID `EC61351177` 형식 = `EC` (직영) + 8자리 숫자. URL 패턴 안정적.

---

## 4. 차용 mockup 데이터 설계 권고

### 4.1 데이터 소스 우선순위

1. **이어카 `/car/40635`** — 차용 핵심 모델(승계). 거의 모든 차용 필드 매핑됨.
2. **K카 `m.kcar.com/bc/detail/carInfoDtl`** — 진단/과거이력/옵션 아이콘 패턴.
3. **kcar 데스크탑 `EC61351177`** — 만료. 새 ID 발견 시 보강.

### 4.2 mockup 파일 위치 후보

| 경로 | 장점 | 단점 |
|---|---|---|
| `src/lib/mock/sample-listings.ts` | 단일 파일, codex-fast 가능, UI 미리보기에 즉시 사용 | DB seed 별도 |
| `prisma/seed.ts` 수정 | DB에 들어가 e2e 가능 | strict + claude reviewer + human checkpoint, cross-cutting 위험 |
| `tests/fixtures/listings.ts` | 테스트 픽스처 표준 | 페이지 미리보기에 직접 사용 X |

**추천**: 1단계로 `src/lib/mock/sample-listings.ts` (codex-fast TASK), 2단계로 `prisma/seed.ts`에 import (strict TASK).

### 4.3 mockup에 포함할 필드 셋

이어카 + K카 합본:
```ts
type SampleListing = {
  // 기본
  id, type, status, createdAt, updatedAt,
  // 차량 식별
  brand, model, year, trim, plateNumber, vin, color,
  registrationDate, fuelType, transmission, displacement,
  bodyType, drivetrain, seatingCapacity, mileage,
  fuelEfficiency, fuelEfficiencyGrade, lowEmissionGrade,
  // 금융 (승계 핵심)
  monthlyPayment, totalPrice, initialCost,
  remainingMonths, contractMonths, contractEndDate,
  capitalCompany, transferFee, mileageLimit,
  acquisitionMethod, residualValue, driverMinAge,
  // 신뢰 / 검사
  accidentCount, ownerCount, mileageVerified,
  damageHistory, cautionHistory[],
  exteriorGrade, interiorGrade,
  inspectionReportUrl, inspectionDate,
  inspectionChecklist: {
    exteriorPanel: { repaint, replace },
    mainFrame: { repaint, replace },
    interior: { issues },
    tires: { issues },
    consumables: { issues },
    chassis: { issues },
    notes: [],
  },
  manufacturerWarrantyRemaining: { months, km },
  // 표시
  description, registrationRegion,
  options: [], optionsByCategory: { ... },
  images: [{ url, position, order, isPrimary }],
  // 통계
  viewCount, favoriteCount, chatCount,
  // 부가
  promotion: { isQuickTransfer: bool, supportAmount: int },
}
```

샘플 갯수 권고: **6건** (승계 3 + 중고리스 2 + 중고렌트 1) — 메인 캐러셀/리스트/상세/추천 모두 커버.
