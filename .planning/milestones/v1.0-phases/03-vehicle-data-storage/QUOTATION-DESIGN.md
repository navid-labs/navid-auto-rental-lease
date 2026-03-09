# 견적 시스템 설계 (신한카드 엑셀 기반)

> 출처: ★중고차_운용리스_견적_202501.xlsx (신한카드 실무 견적서)

## 1. 견적 입력 파라미터

### 차량 정보 (Vehicle Info)
| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| brand | string | 브랜드 (국산/수입) | Mercedes Benz(인증) |
| model | string | 모델명 | G63 |
| year | number | 연식 | 2022 |
| vehiclePrice | number | 차량가격 | 220,000,000 |
| optionPrice | number | 옵션가 | 0 |
| discount | number | 할인금액 | 0 |
| displacement | number | 배기량 (cc) | 3470 |
| fuelType | enum | 유종 | M(보통휘발유)/D(경유)/L(LPG)/P(고급유)/E(전기)/T(하이브리드)/H(수소) |
| vehicleCategory | enum | 차량구분 | 승용/다인승/승합/경차 |
| isImport | boolean | 수입차 여부 | true |

### 리스 조건 (Lease Terms)
| 필드 | 타입 | 설명 | 옵션 |
|------|------|------|------|
| productType | enum | 상품구분 | 운용리스 / 금융리스 / 할부금융 |
| leasePeriod | enum | 리스기간 (개월) | 12 / 24 / 36 / 42 / 48 / 60 |
| annualMileage | enum | 약정거리 (km) | 20,000 / 30,000 |
| residualValueMethod | enum | 잔가산정방식 | 차량가방식 / 취득원가방식 |
| residualValueRate | number | 잔가율 (%) | 0~70% (기간별 최대치 있음) |
| depositRate | number | 보증금율 (%) | 0~40% |
| advancePayment | number | 선납금/선수금 (원) | 0 ~ 차량가 |
| taxInclusion | enum | 취득세 포함 여부 | 포함 / 별도부담 |
| carTaxInclusion | enum | 자동차세 포함 여부 | 포함 / 별도부담 |
| insuranceInclusion | enum | 보험료 포함 여부 | 포함 / 별도부담 |

### 등록 비용 (Registration Costs)
| 필드 | 타입 | 설명 | 계산 |
|------|------|------|------|
| acquisitionTax | number | 취득세 | 차량가 × 세율 (승용 7%, 다인승 5%, 경차 4%) |
| bond | number | 공채 | 지역별 + 차량구분별 |
| ancillaryCost | number | 부대비용 | 등록수수료 등 |
| deliveryFee | number | 탁송료 | 출고방식 × 지역별 |

## 2. 금리 체계 (IRR Structure)

### 브랜드별 IRR (수입차)
```
BMW: 0.04        벤츠: 0.04      아우디: 0.04
폭스바겐: 0.042   볼보: 0.046     포르쉐: 0.04
도요타: 0.045     렉서스: 0.042    포드: 0.042
```

### 신용등급별 금리 가산
```
1그룹 (우수): +0.044
2그룹 (보통): +0.045
3그룹 (일반): +0.048
```

### 채널별 가격군
| 채널 | 가격군 | 기준가격 | 마케팅비용 | 인센티브 |
|------|--------|----------|-----------|----------|
| 일반 | 일반 | 0.087 | 0 | 최대 0.099 |
| 한성/효성/KCC | 인증A군 | 0.072 | 0.005~0.015 | 최대 0.099 |
| PO | 인증B군 | 0.072 | 0.015 | 최대 0.099 |
| 케이카 | 제휴사 | 0.075 | 0 | 최대 0.047 |

### 기간별 잔가 상한 (운용리스)
| 기간 | 최대 잔가율 |
|------|------------|
| 12개월 | 65% |
| 24개월 | 55% |
| 36개월 | 45% |
| 42개월 | 40% |
| 48개월 | 35% |
| 60개월 | 30% |

## 3. 월 리스료 계산 공식

### 핵심 공식 (PMT 기반)
```
리스원금 = 차량가 + 취득세 + 공채 + 부대비용 + 탁송료
취득원가 = 리스원금
잔가기준액 = 차량가 (차량가방식) or 취득원가 (취득원가방식)
잔가금액 = 잔가기준액 × 잔가율

보증금 인정금액:
  - 40% 이하: 보증금 × 인정율 (0.72~0.8, 차량가별)
  - 40% 초과분: 100% 인정

실 리스원금 = 리스원금 - 보증금인정액 - 선납금
월 리스료 = PMT(월이자율, 기간, 실리스원금, -잔가금액)
```

### PMT 함수
```typescript
function pmt(rate: number, nper: number, pv: number, fv: number = 0): number {
  // rate: 월 이자율 (연이자율 / 12)
  // nper: 총 납입 개월수
  // pv: 현재가치 (리스원금)
  // fv: 미래가치 (-잔가, 음수)
  if (rate === 0) return -(pv + fv) / nper
  const factor = Math.pow(1 + rate, nper)
  return -(pv * factor + fv) * rate / (factor - 1)
}
```

## 4. 보증금 인정 체계

| 차량가격 | 40%이하 인정율 | 40%초과 인정율 |
|----------|---------------|---------------|
| 1.5억 이상 | 0.80 | 1.0 |
| 1.2억 이상 | 0.76 | 1.0 |
| 1억 이상 | 0.76 | 1.0 |
| 5천만 이상 | 0.72 | 1.0 |
| 5천만 미만 | 0.70 | 1.0 |

## 5. 취득세율 체계

| 차량구분 | 세율 | 비고 |
|----------|------|------|
| 승용 | 7% | 일반 |
| 다인승 (7인 이상) | 5% | |
| 승합 (11인 이상) | 5% | |
| 경차 | 4% | |
| 하이브리드 | 7% (140만원 감면) | |
| 전기차 | 면제 | |

## 6. 용품/부가 서비스 비용

| 항목 | 등급 | 가격 |
|------|------|------|
| 블랙박스 | 미제공 | 0 |
| 블랙박스 | 2채널(기본) | 150,000 |
| 블랙박스 | 2채널(상급) | 185,000 |
| 썬팅 | 기본(측후면) | 44,000~50,600 |
| 썬팅 | 중급(측후면) | 66,000~90,000 |
| 썬팅 | 기본(전면) | 76,000~99,000 |
| 썬팅 | 중급(전면) | 90,000~110,000 |
| 썬팅 | 썬루프 | 47,000~50,000 |
| 내비게이션 | 거치형 | 213,000~240,000 |
| 내비게이션 | 매립형 | 504,000~660,000 |
| 보조번호판 | 앞뒤 | 8,800~9,900 |

## 7. 탁송료 체계

| 출고방식 | 비용 |
|----------|------|
| 본사출고 | 26,000~49,500 (업체별 상이) |
| 대리점출고 | 47,000~49,500 |
| 제조사(딜러탁송) | 0 |
| 고객별도부담 | 0 |

## 8. 견적 출력 항목

### 고객용 견적서 (리스_출력용)
```
[헤더] 신한카드 운용리스
[고객정보] 고객명, 견적일자
[차량정보] 브랜드, 모델명, 년식, 차량가격, 옵션, 배기량, 탁송료, 구매가격
[리스조건]
  - 잔가 / 보증금 / 선수금
  - 취득세 / 공채 / 부대비용 / 탁송료
  - 리스기간 / 약정거리
  - 리스이용금액
  - 보증/선수금 합계
  - 취득&등록비용
  - 초기소요비용
  - 자동차세 / 보험료
[월 리스료]
  - 개인/법인 구분
  - 보증금 납입 효과 (절감액/절감율)
[필요서류] 법인/개인사업자/개인별 구분
[유의사항]
```

## 9. 나비드오토 견적 시스템 설계 제안

### Phase 구분
- **Phase 7 (계약 엔진)**: 견적 계산 로직 (`lib/finance/`)
- **Phase 3~4에서 UI 준비**: 견적 시뮬레이터 UI (차량 상세 페이지 내)

### 데이터 모델 (Prisma)

```prisma
// 견적 요청
model QuoteRequest {
  id              String   @id @default(uuid())
  vehicleId       String?  // 등록 차량 연결 (선택)
  customerId      String?  // 고객 연결 (선택)

  // 차량 정보
  brand           String
  model           String
  year            Int
  vehiclePrice    Int      // 원
  optionPrice     Int      @default(0)
  discount        Int      @default(0)
  displacement    Int
  fuelType        FuelType
  vehicleCategory VehicleCategory
  isImport        Boolean  @default(false)

  // 리스 조건
  productType     ProductType
  leasePeriod     Int      // 개월
  annualMileage   Int      @default(20000)
  residualMethod  ResidualMethod
  residualRate    Float    // 0~1
  depositRate     Float    @default(0) // 0~1
  advancePayment  Int      @default(0)

  // 포함 옵션
  includeTax      Boolean  @default(true)
  includeCarTax   Boolean  @default(false)
  includeInsurance Boolean @default(false)

  // 계산 결과
  results         QuoteResult[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("quote_requests")
}

// 견적 결과
model QuoteResult {
  id              String   @id @default(uuid())
  quoteRequestId  String
  quoteRequest    QuoteRequest @relation(fields: [quoteRequestId], references: [id])

  // 비용 내역
  acquisitionTax  Int      // 취득세
  bond            Int      // 공채
  ancillaryCost   Int      // 부대비용
  deliveryFee     Int      // 탁송료
  leasePrincipal  Int      // 리스원금
  residualValue   Int      // 잔가금액
  depositAmount   Int      // 보증금액

  // 금리
  irr             Float    // 내부수익률
  customerRate    Float    // 고객 적용금리
  creditGroup     Int      // 신용등급 그룹 (1/2/3)

  // 월 리스료
  monthlyPayment  Int      // 월 납입금
  initialCost     Int      // 초기 소요비용
  totalCost       Int      // 총 비용

  // 메타
  isSelected      Boolean  @default(false) // 고객 선택 여부

  createdAt       DateTime @default(now())

  @@map("quote_results")
}

enum FuelType {
  GASOLINE    // M: 보통휘발유
  PREMIUM     // P: 고급유
  DIESEL      // D: 경유
  LPG         // L: LPG
  ELECTRIC    // E: 전기
  HYBRID      // T: 하이브리드
  HYDROGEN    // H: 수소
}

enum VehicleCategory {
  SEDAN       // 승용
  MULTI       // 다인승 (7인+)
  VAN         // 승합 (11인+)
  COMPACT     // 경차
}

enum ProductType {
  OPERATING_LEASE   // 운용리스
  FINANCE_LEASE     // 금융리스
  INSTALLMENT       // 할부금융
}

enum ResidualMethod {
  VEHICLE_PRICE     // 차량가방식
  ACQUISITION_COST  // 취득원가방식
}
```

### 계산 모듈 구조

```
src/lib/finance/
├── types.ts              # 견적 관련 타입 정의
├── constants.ts          # IRR 테이블, 세율, 잔가 상한 등
├── pmt.ts               # PMT 계산 함수
├── acquisition-tax.ts    # 취득세 계산
├── residual-value.ts     # 잔가 계산
├── deposit-credit.ts     # 보증금 인정액 계산
├── monthly-payment.ts    # 월 리스료 종합 계산
├── quote-calculator.ts   # 견적 계산기 (통합)
└── __tests__/
    ├── pmt.test.ts
    ├── acquisition-tax.test.ts
    ├── residual-value.test.ts
    └── quote-calculator.test.ts
```

### UI 흐름 (고객용 견적 시뮬레이터)

```
1. 차량 선택 (또는 직접 입력)
   ↓
2. 리스 조건 설정
   - 상품 선택: 운용리스 / 금융리스 / 할부
   - 기간: 슬라이더 (12~60개월)
   - 잔가율: 슬라이더 (0~최대%)
   - 보증금율: 슬라이더 (0~40%)
   - 선납금: 입력
   ↓
3. 실시간 견적 결과
   - 월 리스료 (큰 숫자 강조)
   - 비용 내역 접기/펼치기
   - 비교 견적 (조건 2개 나란히)
   ↓
4. 견적서 PDF 다운로드 / 상담 신청
```

## 10. 주의사항

1. **잔가 △2%p 규칙**: 취득원가방식 선택 시 차량가방식 대비 잔가 -2%p (중고차 한정)
2. **무사고 기준**: 단순교환도 최대 잔가 적용 불가 → 개별 잔가 협의
3. **취급불가 차량**: 부활이력/구조변경/카히스토리 미확정 사고
4. **고잔가 수수료**: 특정 브랜드 고잔가 적용 시 별도 수수료 (차량가의 -0.5%~-1%)
5. **수입차 카드결제**: 이손액 효과에 영향
6. **인증중고차**: 브랜드별 별도 IRR 적용 (벤츠인증 +6, 포르쉐인증 +3 등)
