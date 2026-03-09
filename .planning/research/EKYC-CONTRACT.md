# eKYC & 전자계약 리서치

> Source: NotebookLM (bec37304 - 중고차 렌탈리스), 2026-03-09

## 1. 본인인증(eKYC) 절차

### 인증 방법
- 이동통신사(SKT, KT, U+, 알뜰폰) + 본인확인 대행기관(KG모빌리언스 등) 연동
- **휴대폰 본인인증(실명인증)** 방식이 주류

### 필수 수집 항목
- 이름, 휴대폰 번호, 이동통신사, 생년월일, 성별, 내/외국인 여부

### Mock eKYC 구현 시 필요 필드 (Phase 7)
```typescript
interface EKYCVerification {
  name: string;
  phoneNumber: string;
  carrier: 'SKT' | 'KT' | 'LGU' | 'MVNO';
  birthDate: string; // YYYYMMDD
  gender: 'M' | 'F';
  nationality: 'domestic' | 'foreign';
  verificationCode: string; // SMS 인증번호
  verifiedAt: Date;
  status: 'pending' | 'verified' | 'failed';
}
```

## 2. 전자계약서 필수 항목

### 공통 항목 (렌탈 & 리스)
| 카테고리 | 항목 |
|---------|------|
| 당사자 정보 | 계약자(개인/법인), 금융사/렌트사, 연대보증인 여부 |
| 차량 정보 | 차량명, 연식, 주행거리 + **성능·상태점검기록부** (법적 의무) |
| 계약 기간 | 12~60개월 |
| 월 납입금 | 대여료/리스료, 납부방식, 납부일자 |
| 초기 비용 | 보증금(만료 시 반환), 선납금(비반환) |
| 잔존가치 | 계약 종료 시점 예상 중고차 가치 |
| 약정 주행거리 | 연 2만~3만km, 초과 시 km당 80~150원 부담금 |
| 중도해지 | 리스: 미회수 원금 최대 50%, 렌탈: 잔여 렌탈비 20~30% |
| 승계 수수료 | 0.5~2% |
| 반납 감가 | 사고/훼손 평가, 감가율 0~18% |

### 렌탈 vs 리스 핵심 차이
| 구분 | 렌탈 (임대 상품) | 리스 (금융 상품) |
|------|-----------------|-----------------|
| 보험 | 렌트사 명의 (월 렌탈료 포함) | 이용자 본인 명의 직접 가입 |
| 세금/유지보수 | 전부 렌트료에 포함 | 이용자 부담 (포함 옵션 가능) |
| 신용도 영향 | 없음 (임대 계약) | 부채로 인식 → 신용/대출 한도 영향 |
| 번호판 | 렌터카 전용 (하/허/호) | 일반 자가용 번호판 |
| 주행거리 | 무제한 옵션 가능 | 엄격한 제한 (연 3만km 이하) |

### 법적 의무 사항
- **성능·상태점검기록부 교부**: 자동차관리법 제58조 1항 → 계약 전 서면 고지 필수
- 69개 체크항목: 주행거리, 불법구조변경, 사고/침수, 주요골격/외판 교환·수리 상태
- 인도 후 30일 또는 2,000km 이내 주요 장치 하자 보증

## 3. 전자서명 및 비대면 계약
- 별도 서류 없이 플랫폼 내 본인인증 → 전자서명으로 즉시 계약 체결
- 금융 약정 절차: 본인인증 → 한도조회 → 약정서 작성 → 매매계약서 전자서명 → 차량 인도
- 금융사고 시: 전자금융거래법 제9조, 전기통신기본법 제2조 적용

## 4. DB 스키마 설계 시사점 (Phase 7 계약 엔진)

```
Contract {
  id, type(rental|lease), status(state machine)

  // 당사자
  customer_id, dealer_id

  // 차량
  vehicle_id

  // 계약 조건
  contract_period_months (12-60)
  monthly_payment
  deposit (보증금)
  down_payment (선납금)
  residual_value (잔존가치)
  annual_mileage_limit
  mileage_overage_fee_per_km

  // eKYC
  ekyc_status, ekyc_verified_at

  // 중도해지
  early_termination_fee_rate
  transfer_fee_rate

  // 반납
  return_deduction_rate

  // 서명
  signed_at, contract_pdf_url
}
```

## 5. 잔존가치(Residual Value) 산정

### 기준
- **초기 감가 집중**: 출고 후 1~2년 사이 가격 최대 하락
- **3년(36개월) 기준**: 잔존가치 ≈ 신차 가격의 약 60%
- **실무 설정 구간**: 30% ~ 48% (차종별)
- **최대 보장 한도**: 국산차 56%, 수입차 46% (36개월 기준, KB캐피탈)

### 제조사별 차이
- 국산차 > 수입차 (감가 방어 유리)
- 대기업 인증 차량(현대/기아) 프리미엄 가치 인정

### 주행거리 보정
- 수입차: 연 2만km, 국산차: 연 3만km 이내 제한
- 초과 시 km당 80~150원 부담금

### 월 납입금 계산 공식
```
월 감가상각액 = (차량가격 - 잔존가치 - 선납금) ÷ 계약기간(월)
```

### Phase 6 잔존가치 테이블 설계
```
ResidualValueTable {
  id
  brand         // 현대, 기아, 제네시스...
  model         // 아반떼, K5, G80...
  year          // 2023, 2024...
  period_months // 12, 24, 36, 48, 60
  rate_percent  // 30~56%
  vehicle_type  // domestic | imported
}
```
