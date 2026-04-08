# Track 1: Schema Optimization + KOTSA Preparation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the Prisma schema for v3.0, build KOTSA 176-field type system with mock adapter, create vehicle report UI, and refactor KCB eKYC to adapter pattern.

**Architecture:** Adapter pattern for external services (KOTSA, KCB) — interface + mock now, real adapter later. KOTSA data stored as typed JSON in existing `Vehicle.inspectionData` field. Zod schemas validate API responses and form inputs.

**Tech Stack:** Prisma, Zod 4, TypeScript, Next.js App Router, React 19, Tailwind CSS 4, vitest

---

## Task 1: Prisma Schema — Add Indexes + v3.0 Enums

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `bun run db:generate` (validates schema)

- [ ] **Step 1: Add composite indexes to Vehicle model**

Add to `prisma/schema.prisma` inside the `Vehicle` model, before `@@map("vehicles")`:

```prisma
  @@index([status, approvalStatus])
  @@index([dealerId, status])
  @@index([year])
```

- [ ] **Step 2: Add composite indexes to contract models**

Add to `RentalContract` before `@@map`:
```prisma
  @@index([customerId, status])
  @@index([dealerId, status])
```

Add to `LeaseContract` before `@@map`:
```prisma
  @@index([customerId, status])
  @@index([dealerId, status])
```

Add to `Payment` before `@@map`:
```prisma
  @@index([rentalContractId])
  @@index([leaseContractId])
```

- [ ] **Step 3: Add v3.0 enums for quote/bid system**

Add after the existing enums section (after `ImageCategory`):

```prisma
enum QuoteRequestStatus {
  OPEN
  BIDDING
  COMPARING
  SELECTED
  CONTRACTED
  EXPIRED
}

enum BidStatus {
  PENDING
  SUBMITTED
  SELECTED
  REJECTED
  WITHDRAWN
}
```

- [ ] **Step 4: Add CI/DI fields to EkycVerification**

Modify the `EkycVerification` model — add after `gender` field:

```prisma
  ci          String?   @db.VarChar(88)    // 연계정보 (cross-site ID)
  di          String?   @db.VarChar(64)    // 중복가입확인정보 (site-unique ID)
```

- [ ] **Step 5: Validate schema and generate client**

Run:
```bash
bun run db:generate
```
Expected: Prisma client generated successfully with no errors.

- [ ] **Step 6: Create migration**

Run:
```bash
bunx prisma migrate dev --name add-v3-indexes-enums-ekyc-fields
```
Expected: Migration created and applied successfully.

- [ ] **Step 7: Commit**

```bash
git add prisma/
git commit -m "feat(schema): add v3.0 indexes, quote/bid enums, eKYC CI/DI fields"
```

---

## Task 2: KOTSA Types — Basic Info + Spec (70 fields)

**Files:**
- Create: `src/lib/kotsa/types/basic-info.ts`
- Create: `src/lib/kotsa/types/spec.ts`
- Create: `src/lib/kotsa/types/index.ts`
- Test: `tests/unit/lib/kotsa/types.test.ts`

- [ ] **Step 1: Write type tests**

Create `tests/unit/lib/kotsa/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  KotsaBasicInfo,
  KotsaSpec,
  KotsaVehicleData,
} from '@/lib/kotsa/types'

describe('KOTSA types', () => {
  it('KotsaBasicInfo has required fields', () => {
    const info: KotsaBasicInfo = {
      vin: 'KMHD341CBLU123456',
      registrationNumber: '서울12가3456',
      ownerName: '홍길동',
      registrationDate: '2023-01-15',
      firstRegistrationDate: '2023-01-15',
      vehicleType: '승용',
      vehicleUse: '자가용',
      manufacturer: '현대',
      modelName: '아반떼',
      modelYear: 2023,
      color: '흰색',
      displacement: 1598,
      fuelType: '가솔린',
      maxPower: '123/6300',
      transmissionType: '자동6단',
      numberOfSeats: 5,
      totalWeight: 1810,
      curbWeight: 1310,
      numberOfOwnerChanges: 0,
      hasSeizure: false,
      hasMortgage: false,
      insuranceExpiryDate: '2024-01-15',
      inspectionExpiryDate: '2025-01-15',
      mileage: 15000,
      mileageDate: '2024-06-01',
      isCommercial: false,
      isPenalized: false,
      registrationStatus: '정상',
      cancelDate: null,
      exportDate: null,
      scrappedDate: null,
      remarks: null,
      lastUpdated: '2024-06-01',
      dataSource: 'KOTSA',
      responseCode: '00',
    }
    expect(info.vin).toBe('KMHD341CBLU123456')
    expect(info.numberOfOwnerChanges).toBe(0)
  })

  it('KotsaSpec has engine and body fields', () => {
    const spec: KotsaSpec = {
      engine: {
        type: '직렬4기통',
        displacement: 1598,
        fuelType: '가솔린',
        fuelSystem: 'GDI',
        maxPower: '123/6300',
        maxTorque: '15.0/4500',
        emissionStandard: '유로6',
        catalyticConverter: '삼원촉매',
        turbocharger: false,
        hybridType: null,
        evRange: null,
        batteryCapacity: null,
        chargingType: null,
        hydrogenTankCapacity: null,
        fuelTankCapacity: 50,
        fuelEfficiency: 15.2,
        co2Emission: 120,
      },
      transmission: {
        type: '자동',
        gears: 6,
        driveType: 'FF',
      },
      body: {
        type: '세단',
        numberOfDoors: 4,
        length: 4650,
        width: 1825,
        height: 1435,
        wheelbase: 2720,
        trackFront: 1573,
        trackRear: 1577,
        overhangFront: 895,
        overhangRear: 1035,
        groundClearance: 150,
        curbWeight: 1310,
        grossWeight: 1810,
        maxPayload: 500,
        towingCapacity: null,
      },
      tire: {
        frontSize: '205/55R16',
        rearSize: '205/55R16',
        spareTire: '응급용',
      },
      suspension: {
        front: '맥퍼슨 스트럿',
        rear: '멀티링크',
      },
      brake: {
        front: '벤틸레이티드 디스크',
        rear: '디스크',
        parkingBrake: '전자식',
      },
      steering: {
        type: 'MDPS',
        turningRadius: 5.3,
      },
    }
    expect(spec.engine.displacement).toBe(1598)
    expect(spec.body.numberOfDoors).toBe(4)
  })

  it('KotsaVehicleData combines all sections', () => {
    // Type-level check — just ensure the type compiles
    const partial: Partial<KotsaVehicleData> = {
      basicInfo: {} as KotsaBasicInfo,
      spec: {} as KotsaSpec,
    }
    expect(partial).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/kotsa/types.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create basic-info types**

Create `src/lib/kotsa/types/basic-info.ts`:

```typescript
/** 자동차기본정보 — KOTSA API 응답 34필드 */
export type KotsaBasicInfo = {
  /** 차대번호 (VIN) */
  vin: string
  /** 차량 등록번호 */
  registrationNumber: string
  /** 소유자 성명 */
  ownerName: string
  /** 등록일자 */
  registrationDate: string
  /** 최초등록일자 */
  firstRegistrationDate: string
  /** 차종 (승용, 승합, 화물, 특수) */
  vehicleType: string
  /** 용도 (자가용, 영업용, 관용) */
  vehicleUse: string
  /** 제조사 */
  manufacturer: string
  /** 차명 */
  modelName: string
  /** 연식 */
  modelYear: number
  /** 색상 */
  color: string
  /** 배기량 (cc) */
  displacement: number
  /** 연료 */
  fuelType: string
  /** 최고출력 (ps/rpm) */
  maxPower: string
  /** 변속기 */
  transmissionType: string
  /** 승차정원 */
  numberOfSeats: number
  /** 총중량 (kg) */
  totalWeight: number
  /** 공차중량 (kg) */
  curbWeight: number
  /** 소유자 변경 횟수 */
  numberOfOwnerChanges: number
  /** 압류 여부 */
  hasSeizure: boolean
  /** 저당 여부 */
  hasMortgage: boolean
  /** 보험 만료일 */
  insuranceExpiryDate: string | null
  /** 검사 만료일 */
  inspectionExpiryDate: string | null
  /** 주행거리 (km) */
  mileage: number
  /** 주행거리 측정일 */
  mileageDate: string
  /** 사업용 여부 */
  isCommercial: boolean
  /** 과태료 여부 */
  isPenalized: boolean
  /** 등록상태 */
  registrationStatus: string
  /** 말소일 */
  cancelDate: string | null
  /** 수출일 */
  exportDate: string | null
  /** 폐차일 */
  scrappedDate: string | null
  /** 비고 */
  remarks: string | null
  /** 최종 갱신일 */
  lastUpdated: string
  /** 데이터 출처 */
  dataSource: string
  /** 응답 코드 */
  responseCode: string
}
```

- [ ] **Step 4: Create spec types**

Create `src/lib/kotsa/types/spec.ts`:

```typescript
/** 제원정보 1+2 — KOTSA API 70필드 (엔진/변속기/차체/타이어/서스/브레이크/조향) */

export type KotsaEngineSpec = {
  type: string
  displacement: number
  fuelType: string
  fuelSystem: string
  maxPower: string
  maxTorque: string
  emissionStandard: string
  catalyticConverter: string
  turbocharger: boolean
  hybridType: string | null
  evRange: number | null
  batteryCapacity: number | null
  chargingType: string | null
  hydrogenTankCapacity: number | null
  fuelTankCapacity: number
  fuelEfficiency: number
  co2Emission: number
}

export type KotsaTransmissionSpec = {
  type: string
  gears: number
  driveType: string
}

export type KotsaBodySpec = {
  type: string
  numberOfDoors: number
  length: number
  width: number
  height: number
  wheelbase: number
  trackFront: number
  trackRear: number
  overhangFront: number
  overhangRear: number
  groundClearance: number
  curbWeight: number
  grossWeight: number
  maxPayload: number
  towingCapacity: number | null
}

export type KotsaTireSpec = {
  frontSize: string
  rearSize: string
  spareTire: string
}

export type KotsaSuspensionSpec = {
  front: string
  rear: string
}

export type KotsaBrakeSpec = {
  front: string
  rear: string
  parkingBrake: string
}

export type KotsaSteeringSpec = {
  type: string
  turningRadius: number
}

export type KotsaSpec = {
  engine: KotsaEngineSpec
  transmission: KotsaTransmissionSpec
  body: KotsaBodySpec
  tire: KotsaTireSpec
  suspension: KotsaSuspensionSpec
  brake: KotsaBrakeSpec
  steering: KotsaSteeringSpec
}
```

- [ ] **Step 5: Create index barrel**

Create `src/lib/kotsa/types/index.ts`:

```typescript
export type { KotsaBasicInfo } from './basic-info'
export type {
  KotsaSpec,
  KotsaEngineSpec,
  KotsaTransmissionSpec,
  KotsaBodySpec,
  KotsaTireSpec,
  KotsaSuspensionSpec,
  KotsaBrakeSpec,
  KotsaSteeringSpec,
} from './spec'
export type {
  KotsaMaintenanceRecord,
  KotsaMaintenanceHistory,
} from './maintenance'
export type {
  KotsaInspection,
  KotsaInspectionDetail,
} from './inspection'

/** Combined KOTSA vehicle data — all 176+ fields */
export type KotsaVehicleData = {
  basicInfo: import('./basic-info').KotsaBasicInfo
  spec: import('./spec').KotsaSpec
  maintenance: import('./maintenance').KotsaMaintenanceHistory
  inspection: import('./inspection').KotsaInspection
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun run test tests/unit/lib/kotsa/types.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib/kotsa/types/ tests/unit/lib/kotsa/
git commit -m "feat(kotsa): add basic-info and spec type definitions (70 fields)"
```

---

## Task 3: KOTSA Types — Maintenance + Inspection (72 fields)

**Files:**
- Create: `src/lib/kotsa/types/maintenance.ts`
- Create: `src/lib/kotsa/types/inspection.ts`
- Test: `tests/unit/lib/kotsa/types.test.ts` (extend)

- [ ] **Step 1: Add maintenance and inspection tests**

Append to `tests/unit/lib/kotsa/types.test.ts`:

```typescript
import type {
  KotsaMaintenanceHistory,
  KotsaMaintenanceRecord,
  KotsaInspection,
} from '@/lib/kotsa/types'

describe('KOTSA maintenance types', () => {
  it('KotsaMaintenanceRecord has required fields', () => {
    const record: KotsaMaintenanceRecord = {
      date: '2024-03-15',
      mileage: 15000,
      shopName: '현대오토서비스',
      shopType: '직영',
      category: '정기점검',
      description: '엔진오일 교환',
      parts: [{ name: '엔진오일', quantity: 1, price: 50000 }],
      laborCost: 30000,
      totalCost: 80000,
      nextMaintenanceDate: '2024-09-15',
      nextMaintenanceMileage: 25000,
      warranty: true,
      recallRelated: false,
      technicianId: 'T-1234',
      reportNumber: 'MR-2024-0315',
    }
    expect(record.category).toBe('정기점검')
  })

  it('KotsaMaintenanceHistory contains records array', () => {
    const history: KotsaMaintenanceHistory = {
      totalRecords: 1,
      records: [],
      lastMaintenanceDate: null,
      lastMaintenanceMileage: null,
    }
    expect(history.totalRecords).toBe(1)
  })
})

describe('KOTSA inspection types', () => {
  it('KotsaInspection has required sections', () => {
    const inspection: Partial<KotsaInspection> = {
      accidentHistory: {
        hasAccident: false,
        accidentCount: 0,
        totalRepairCost: 0,
        floodDamage: false,
        fireDamage: false,
        majorAccident: false,
        details: [],
      },
    }
    expect(inspection.accidentHistory?.hasAccident).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/kotsa/types.test.ts`
Expected: FAIL — maintenance/inspection modules not found

- [ ] **Step 3: Create maintenance types**

Create `src/lib/kotsa/types/maintenance.ts`:

```typescript
/** 정비이력정보 — KOTSA API 16필드 */

export type KotsaMaintenancePart = {
  name: string
  quantity: number
  price: number
}

export type KotsaMaintenanceRecord = {
  /** 정비일자 */
  date: string
  /** 주행거리 (km) */
  mileage: number
  /** 정비업소명 */
  shopName: string
  /** 정비업소 유형 (직영, 일반) */
  shopType: string
  /** 정비 분류 (정기점검, 일반수리, 사고수리, 리콜) */
  category: string
  /** 정비 내역 */
  description: string
  /** 부품 목록 */
  parts: KotsaMaintenancePart[]
  /** 공임비 */
  laborCost: number
  /** 총 비용 */
  totalCost: number
  /** 다음 정비 예정일 */
  nextMaintenanceDate: string | null
  /** 다음 정비 예정 주행거리 */
  nextMaintenanceMileage: number | null
  /** 보증수리 여부 */
  warranty: boolean
  /** 리콜 관련 여부 */
  recallRelated: boolean
  /** 정비사 ID */
  technicianId: string | null
  /** 정비 보고서 번호 */
  reportNumber: string | null
}

export type KotsaMaintenanceHistory = {
  totalRecords: number
  records: KotsaMaintenanceRecord[]
  lastMaintenanceDate: string | null
  lastMaintenanceMileage: number | null
}
```

- [ ] **Step 4: Create inspection types**

Create `src/lib/kotsa/types/inspection.ts`:

```typescript
/** 성능점검정보 1+2 — KOTSA API 56필드 */

export type KotsaAccidentDetail = {
  date: string
  type: string
  repairCost: number
  affectedParts: string[]
  repairShop: string
}

export type KotsaAccidentHistory = {
  hasAccident: boolean
  accidentCount: number
  totalRepairCost: number
  floodDamage: boolean
  fireDamage: boolean
  majorAccident: boolean
  details: KotsaAccidentDetail[]
}

export type KotsaPanelCondition = {
  status: 'normal' | 'repainted' | 'replaced' | 'damaged'
  detail: string | null
}

export type KotsaExteriorInspection = {
  hood: KotsaPanelCondition
  frontBumper: KotsaPanelCondition
  rearBumper: KotsaPanelCondition
  trunk: KotsaPanelCondition
  roof: KotsaPanelCondition
  frontLeftFender: KotsaPanelCondition
  frontRightFender: KotsaPanelCondition
  rearLeftFender: KotsaPanelCondition
  rearRightFender: KotsaPanelCondition
  frontLeftDoor: KotsaPanelCondition
  frontRightDoor: KotsaPanelCondition
  rearLeftDoor: KotsaPanelCondition
  rearRightDoor: KotsaPanelCondition
  leftRocker: KotsaPanelCondition
  rightRocker: KotsaPanelCondition
  corrosion: boolean
  unevenGaps: boolean
}

export type KotsaMechanicalInspection = {
  engineCondition: string
  oilLeak: boolean
  coolantLeak: boolean
  transmissionCondition: string
  transmissionNoise: boolean
  clutchCondition: string | null
  driveShaft: string
  steeringPlay: boolean
  powerSteeringLeak: boolean
  brakeCondition: string
  brakePadRemaining: number
  absFunction: boolean
  exhaustSystem: string
  emissionTestResult: string | null
  suspensionCondition: string
  shockAbsorber: string
  wheelBearing: string
  tireCondition: string
  tireTreadDepth: number[]
}

export type KotsaInteriorInspection = {
  dashboardCondition: string
  seatCondition: string
  airConditioner: string
  heater: string
  powerWindows: boolean
  powerDoorLocks: boolean
  audioSystem: string
  navigationSystem: string | null
  rearCamera: boolean
  airbagWarningLight: boolean
  absWarningLight: boolean
  engineWarningLight: boolean
  odometerTampering: boolean
  mileageAtInspection: number
}

export type KotsaInspectionDetail = {
  inspectorName: string
  inspectorLicense: string
  inspectionCenter: string
  inspectionDate: string
  expiryDate: string
  overallGrade: 'A_PLUS' | 'A' | 'B_PLUS' | 'B' | 'C'
  overallScore: number
}

export type KotsaInspection = {
  accidentHistory: KotsaAccidentHistory
  exterior: KotsaExteriorInspection
  mechanical: KotsaMechanicalInspection
  interior: KotsaInteriorInspection
  detail: KotsaInspectionDetail
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test tests/unit/lib/kotsa/types.test.ts`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/kotsa/types/ tests/unit/lib/kotsa/
git commit -m "feat(kotsa): add maintenance and inspection type definitions (72 fields)"
```

---

## Task 4: KOTSA Zod Schemas + Validation

**Files:**
- Create: `src/lib/kotsa/schemas/basic-info.schema.ts`
- Create: `src/lib/kotsa/schemas/spec.schema.ts`
- Create: `src/lib/kotsa/schemas/maintenance.schema.ts`
- Create: `src/lib/kotsa/schemas/inspection.schema.ts`
- Create: `src/lib/kotsa/schemas/index.ts`
- Test: `tests/unit/lib/kotsa/schemas.test.ts`

- [ ] **Step 1: Write schema validation tests**

Create `tests/unit/lib/kotsa/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  kotsaBasicInfoSchema,
  kotsaSpecSchema,
  kotsaMaintenanceHistorySchema,
  kotsaInspectionSchema,
  kotsaVehicleDataSchema,
} from '@/lib/kotsa/schemas'
import { createMockKotsaVehicleData } from '@/lib/kotsa/adapters/mock-adapter'

describe('KOTSA schemas', () => {
  it('validates basic info', () => {
    const mockData = createMockKotsaVehicleData()
    const result = kotsaBasicInfoSchema.safeParse(mockData.basicInfo)
    expect(result.success).toBe(true)
  })

  it('rejects invalid basic info', () => {
    const result = kotsaBasicInfoSchema.safeParse({ vin: 123 })
    expect(result.success).toBe(false)
  })

  it('validates spec', () => {
    const mockData = createMockKotsaVehicleData()
    const result = kotsaSpecSchema.safeParse(mockData.spec)
    expect(result.success).toBe(true)
  })

  it('validates maintenance history', () => {
    const mockData = createMockKotsaVehicleData()
    const result = kotsaMaintenanceHistorySchema.safeParse(mockData.maintenance)
    expect(result.success).toBe(true)
  })

  it('validates inspection', () => {
    const mockData = createMockKotsaVehicleData()
    const result = kotsaInspectionSchema.safeParse(mockData.inspection)
    expect(result.success).toBe(true)
  })

  it('validates full vehicle data', () => {
    const mockData = createMockKotsaVehicleData()
    const result = kotsaVehicleDataSchema.safeParse(mockData)
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/kotsa/schemas.test.ts`
Expected: FAIL — schemas not found

- [ ] **Step 3: Create Zod schemas for each section**

Create `src/lib/kotsa/schemas/basic-info.schema.ts`:

```typescript
import { z } from 'zod'

export const kotsaBasicInfoSchema = z.object({
  vin: z.string().min(17).max(17),
  registrationNumber: z.string(),
  ownerName: z.string(),
  registrationDate: z.string(),
  firstRegistrationDate: z.string(),
  vehicleType: z.string(),
  vehicleUse: z.string(),
  manufacturer: z.string(),
  modelName: z.string(),
  modelYear: z.number().int(),
  color: z.string(),
  displacement: z.number(),
  fuelType: z.string(),
  maxPower: z.string(),
  transmissionType: z.string(),
  numberOfSeats: z.number().int(),
  totalWeight: z.number(),
  curbWeight: z.number(),
  numberOfOwnerChanges: z.number().int().min(0),
  hasSeizure: z.boolean(),
  hasMortgage: z.boolean(),
  insuranceExpiryDate: z.string().nullable(),
  inspectionExpiryDate: z.string().nullable(),
  mileage: z.number().int().min(0),
  mileageDate: z.string(),
  isCommercial: z.boolean(),
  isPenalized: z.boolean(),
  registrationStatus: z.string(),
  cancelDate: z.string().nullable(),
  exportDate: z.string().nullable(),
  scrappedDate: z.string().nullable(),
  remarks: z.string().nullable(),
  lastUpdated: z.string(),
  dataSource: z.string(),
  responseCode: z.string(),
})
```

Create `src/lib/kotsa/schemas/spec.schema.ts`:

```typescript
import { z } from 'zod'

const engineSpecSchema = z.object({
  type: z.string(),
  displacement: z.number(),
  fuelType: z.string(),
  fuelSystem: z.string(),
  maxPower: z.string(),
  maxTorque: z.string(),
  emissionStandard: z.string(),
  catalyticConverter: z.string(),
  turbocharger: z.boolean(),
  hybridType: z.string().nullable(),
  evRange: z.number().nullable(),
  batteryCapacity: z.number().nullable(),
  chargingType: z.string().nullable(),
  hydrogenTankCapacity: z.number().nullable(),
  fuelTankCapacity: z.number(),
  fuelEfficiency: z.number(),
  co2Emission: z.number(),
})

const transmissionSpecSchema = z.object({
  type: z.string(),
  gears: z.number().int(),
  driveType: z.string(),
})

const bodySpecSchema = z.object({
  type: z.string(),
  numberOfDoors: z.number().int(),
  length: z.number(),
  width: z.number(),
  height: z.number(),
  wheelbase: z.number(),
  trackFront: z.number(),
  trackRear: z.number(),
  overhangFront: z.number(),
  overhangRear: z.number(),
  groundClearance: z.number(),
  curbWeight: z.number(),
  grossWeight: z.number(),
  maxPayload: z.number(),
  towingCapacity: z.number().nullable(),
})

const tireSpecSchema = z.object({
  frontSize: z.string(),
  rearSize: z.string(),
  spareTire: z.string(),
})

const suspensionSpecSchema = z.object({
  front: z.string(),
  rear: z.string(),
})

const brakeSpecSchema = z.object({
  front: z.string(),
  rear: z.string(),
  parkingBrake: z.string(),
})

const steeringSpecSchema = z.object({
  type: z.string(),
  turningRadius: z.number(),
})

export const kotsaSpecSchema = z.object({
  engine: engineSpecSchema,
  transmission: transmissionSpecSchema,
  body: bodySpecSchema,
  tire: tireSpecSchema,
  suspension: suspensionSpecSchema,
  brake: brakeSpecSchema,
  steering: steeringSpecSchema,
})
```

Create `src/lib/kotsa/schemas/maintenance.schema.ts`:

```typescript
import { z } from 'zod'

const maintenancePartSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
})

const maintenanceRecordSchema = z.object({
  date: z.string(),
  mileage: z.number(),
  shopName: z.string(),
  shopType: z.string(),
  category: z.string(),
  description: z.string(),
  parts: z.array(maintenancePartSchema),
  laborCost: z.number(),
  totalCost: z.number(),
  nextMaintenanceDate: z.string().nullable(),
  nextMaintenanceMileage: z.number().nullable(),
  warranty: z.boolean(),
  recallRelated: z.boolean(),
  technicianId: z.string().nullable(),
  reportNumber: z.string().nullable(),
})

export const kotsaMaintenanceHistorySchema = z.object({
  totalRecords: z.number().int(),
  records: z.array(maintenanceRecordSchema),
  lastMaintenanceDate: z.string().nullable(),
  lastMaintenanceMileage: z.number().nullable(),
})
```

Create `src/lib/kotsa/schemas/inspection.schema.ts`:

```typescript
import { z } from 'zod'

const panelConditionSchema = z.object({
  status: z.enum(['normal', 'repainted', 'replaced', 'damaged']),
  detail: z.string().nullable(),
})

const accidentDetailSchema = z.object({
  date: z.string(),
  type: z.string(),
  repairCost: z.number(),
  affectedParts: z.array(z.string()),
  repairShop: z.string(),
})

const accidentHistorySchema = z.object({
  hasAccident: z.boolean(),
  accidentCount: z.number().int(),
  totalRepairCost: z.number(),
  floodDamage: z.boolean(),
  fireDamage: z.boolean(),
  majorAccident: z.boolean(),
  details: z.array(accidentDetailSchema),
})

const exteriorInspectionSchema = z.object({
  hood: panelConditionSchema,
  frontBumper: panelConditionSchema,
  rearBumper: panelConditionSchema,
  trunk: panelConditionSchema,
  roof: panelConditionSchema,
  frontLeftFender: panelConditionSchema,
  frontRightFender: panelConditionSchema,
  rearLeftFender: panelConditionSchema,
  rearRightFender: panelConditionSchema,
  frontLeftDoor: panelConditionSchema,
  frontRightDoor: panelConditionSchema,
  rearLeftDoor: panelConditionSchema,
  rearRightDoor: panelConditionSchema,
  leftRocker: panelConditionSchema,
  rightRocker: panelConditionSchema,
  corrosion: z.boolean(),
  unevenGaps: z.boolean(),
})

const mechanicalInspectionSchema = z.object({
  engineCondition: z.string(),
  oilLeak: z.boolean(),
  coolantLeak: z.boolean(),
  transmissionCondition: z.string(),
  transmissionNoise: z.boolean(),
  clutchCondition: z.string().nullable(),
  driveShaft: z.string(),
  steeringPlay: z.boolean(),
  powerSteeringLeak: z.boolean(),
  brakeCondition: z.string(),
  brakePadRemaining: z.number(),
  absFunction: z.boolean(),
  exhaustSystem: z.string(),
  emissionTestResult: z.string().nullable(),
  suspensionCondition: z.string(),
  shockAbsorber: z.string(),
  wheelBearing: z.string(),
  tireCondition: z.string(),
  tireTreadDepth: z.array(z.number()),
})

const interiorInspectionSchema = z.object({
  dashboardCondition: z.string(),
  seatCondition: z.string(),
  airConditioner: z.string(),
  heater: z.string(),
  powerWindows: z.boolean(),
  powerDoorLocks: z.boolean(),
  audioSystem: z.string(),
  navigationSystem: z.string().nullable(),
  rearCamera: z.boolean(),
  airbagWarningLight: z.boolean(),
  absWarningLight: z.boolean(),
  engineWarningLight: z.boolean(),
  odometerTampering: z.boolean(),
  mileageAtInspection: z.number(),
})

const inspectionDetailSchema = z.object({
  inspectorName: z.string(),
  inspectorLicense: z.string(),
  inspectionCenter: z.string(),
  inspectionDate: z.string(),
  expiryDate: z.string(),
  overallGrade: z.enum(['A_PLUS', 'A', 'B_PLUS', 'B', 'C']),
  overallScore: z.number().min(0).max(100),
})

export const kotsaInspectionSchema = z.object({
  accidentHistory: accidentHistorySchema,
  exterior: exteriorInspectionSchema,
  mechanical: mechanicalInspectionSchema,
  interior: interiorInspectionSchema,
  detail: inspectionDetailSchema,
})
```

Create `src/lib/kotsa/schemas/index.ts`:

```typescript
export { kotsaBasicInfoSchema } from './basic-info.schema'
export { kotsaSpecSchema } from './spec.schema'
export { kotsaMaintenanceHistorySchema } from './maintenance.schema'
export { kotsaInspectionSchema } from './inspection.schema'
import { z } from 'zod'
import { kotsaBasicInfoSchema } from './basic-info.schema'
import { kotsaSpecSchema } from './spec.schema'
import { kotsaMaintenanceHistorySchema } from './maintenance.schema'
import { kotsaInspectionSchema } from './inspection.schema'

export const kotsaVehicleDataSchema = z.object({
  basicInfo: kotsaBasicInfoSchema,
  spec: kotsaSpecSchema,
  maintenance: kotsaMaintenanceHistorySchema,
  inspection: kotsaInspectionSchema,
})
```

- [ ] **Step 4: Run test (will still fail — needs mock adapter)**

Run: `bun run test tests/unit/lib/kotsa/schemas.test.ts`
Expected: FAIL — `createMockKotsaVehicleData` not found (created in Task 5)

- [ ] **Step 5: Commit schemas (tests will pass after Task 5)**

```bash
git add src/lib/kotsa/schemas/
git commit -m "feat(kotsa): add Zod validation schemas for all KOTSA sections"
```

---

## Task 5: KOTSA Adapter — Interface + Mock

**Files:**
- Create: `src/lib/kotsa/adapters/kotsa-adapter.ts`
- Create: `src/lib/kotsa/adapters/mock-adapter.ts`
- Create: `src/lib/kotsa/index.ts`
- Test: `tests/unit/lib/kotsa/adapter.test.ts`

- [ ] **Step 1: Write adapter tests**

Create `tests/unit/lib/kotsa/adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  createMockKotsaVehicleData,
  MockKotsaAdapter,
} from '@/lib/kotsa/adapters/mock-adapter'
import type { KotsaAdapter } from '@/lib/kotsa/adapters/kotsa-adapter'
import { kotsaVehicleDataSchema } from '@/lib/kotsa/schemas'

describe('MockKotsaAdapter', () => {
  const adapter: KotsaAdapter = new MockKotsaAdapter()

  it('fetchVehicleInfo returns valid data', async () => {
    const result = await adapter.fetchVehicleInfo('서울12가3456', 'test-ci')
    expect(result).toBeDefined()
    expect(result.basicInfo.registrationNumber).toBe('서울12가3456')
  })

  it('returned data passes Zod validation', async () => {
    const result = await adapter.fetchVehicleInfo('서울12가3456', 'test-ci')
    const parsed = kotsaVehicleDataSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('throws on invalid registration number', async () => {
    await expect(
      adapter.fetchVehicleInfo('', 'test-ci')
    ).rejects.toThrow('차량 등록번호가 필요합니다')
  })
})

describe('createMockKotsaVehicleData', () => {
  it('creates complete mock data', () => {
    const data = createMockKotsaVehicleData()
    expect(data.basicInfo).toBeDefined()
    expect(data.spec).toBeDefined()
    expect(data.maintenance).toBeDefined()
    expect(data.inspection).toBeDefined()
  })

  it('allows overrides', () => {
    const data = createMockKotsaVehicleData({
      basicInfo: { modelYear: 2025 },
    })
    expect(data.basicInfo.modelYear).toBe(2025)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/kotsa/adapter.test.ts`
Expected: FAIL — adapter not found

- [ ] **Step 3: Create adapter interface**

Create `src/lib/kotsa/adapters/kotsa-adapter.ts`:

```typescript
import type { KotsaVehicleData } from '../types'

/**
 * KOTSA 자동차종합정보 API adapter interface.
 *
 * Implementations:
 * - MockKotsaAdapter: development/testing (returns fixture data)
 * - RealKotsaAdapter: production (calls KOTSA API — created after API key issuance)
 */
export type KotsaAdapter = {
  /** Fetch vehicle info by registration number + CI from KCB auth */
  fetchVehicleInfo(
    registrationNumber: string,
    ci: string,
  ): Promise<KotsaVehicleData>
}
```

- [ ] **Step 4: Create mock adapter with fixture data**

Create `src/lib/kotsa/adapters/mock-adapter.ts`:

```typescript
import type { KotsaVehicleData } from '../types'
import type { KotsaAdapter } from './kotsa-adapter'

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

const DEFAULT_BASIC_INFO = {
  vin: 'KMHD341CBLU123456',
  registrationNumber: '서울12가3456',
  ownerName: '홍길동',
  registrationDate: '2023-01-15',
  firstRegistrationDate: '2023-01-15',
  vehicleType: '승용',
  vehicleUse: '자가용',
  manufacturer: '현대',
  modelName: '아반떼 CN7',
  modelYear: 2023,
  color: '아틀라스 화이트',
  displacement: 1598,
  fuelType: '가솔린',
  maxPower: '123/6300',
  transmissionType: '자동6단',
  numberOfSeats: 5,
  totalWeight: 1810,
  curbWeight: 1310,
  numberOfOwnerChanges: 0,
  hasSeizure: false,
  hasMortgage: false,
  insuranceExpiryDate: '2025-01-15',
  inspectionExpiryDate: '2026-01-15',
  mileage: 15000,
  mileageDate: '2024-06-01',
  isCommercial: false,
  isPenalized: false,
  registrationStatus: '정상',
  cancelDate: null,
  exportDate: null,
  scrappedDate: null,
  remarks: null,
  lastUpdated: '2024-06-01',
  dataSource: 'KOTSA',
  responseCode: '00',
} as const

const DEFAULT_SPEC = {
  engine: {
    type: '직렬4기통',
    displacement: 1598,
    fuelType: '가솔린',
    fuelSystem: 'GDI',
    maxPower: '123/6300',
    maxTorque: '15.0/4500',
    emissionStandard: '유로6',
    catalyticConverter: '삼원촉매',
    turbocharger: false,
    hybridType: null,
    evRange: null,
    batteryCapacity: null,
    chargingType: null,
    hydrogenTankCapacity: null,
    fuelTankCapacity: 50,
    fuelEfficiency: 15.2,
    co2Emission: 120,
  },
  transmission: { type: '자동', gears: 6, driveType: 'FF' },
  body: {
    type: '세단', numberOfDoors: 4, length: 4650, width: 1825,
    height: 1435, wheelbase: 2720, trackFront: 1573, trackRear: 1577,
    overhangFront: 895, overhangRear: 1035, groundClearance: 150,
    curbWeight: 1310, grossWeight: 1810, maxPayload: 500, towingCapacity: null,
  },
  tire: { frontSize: '205/55R16', rearSize: '205/55R16', spareTire: '응급용' },
  suspension: { front: '맥퍼슨 스트럿', rear: '멀티링크' },
  brake: { front: '벤틸레이티드 디스크', rear: '디스크', parkingBrake: '전자식' },
  steering: { type: 'MDPS', turningRadius: 5.3 },
} as const

const DEFAULT_MAINTENANCE = {
  totalRecords: 3,
  records: [
    {
      date: '2024-06-01', mileage: 15000, shopName: '현대오토서비스 강남',
      shopType: '직영', category: '정기점검', description: '엔진오일 교환, 에어필터 교환',
      parts: [
        { name: '엔진오일 5W-30', quantity: 4, price: 12000 },
        { name: '에어필터', quantity: 1, price: 15000 },
      ],
      laborCost: 30000, totalCost: 93000,
      nextMaintenanceDate: '2024-12-01', nextMaintenanceMileage: 25000,
      warranty: false, recallRelated: false, technicianId: 'T-5521', reportNumber: 'MR-2024-0601',
    },
    {
      date: '2024-01-15', mileage: 10000, shopName: '현대오토서비스 강남',
      shopType: '직영', category: '정기점검', description: '1만km 정기점검',
      parts: [{ name: '와이퍼 블레이드', quantity: 2, price: 18000 }],
      laborCost: 0, totalCost: 36000,
      nextMaintenanceDate: '2024-07-15', nextMaintenanceMileage: 15000,
      warranty: true, recallRelated: false, technicianId: 'T-5521', reportNumber: 'MR-2024-0115',
    },
    {
      date: '2023-07-20', mileage: 5000, shopName: '현대오토서비스 서초',
      shopType: '직영', category: '리콜', description: 'BCM 소프트웨어 업데이트',
      parts: [], laborCost: 0, totalCost: 0,
      nextMaintenanceDate: null, nextMaintenanceMileage: null,
      warranty: true, recallRelated: true, technicianId: 'T-3301', reportNumber: 'RC-2023-0720',
    },
  ],
  lastMaintenanceDate: '2024-06-01',
  lastMaintenanceMileage: 15000,
} as const

const normalPanel = { status: 'normal' as const, detail: null }

const DEFAULT_INSPECTION = {
  accidentHistory: {
    hasAccident: false, accidentCount: 0, totalRepairCost: 0,
    floodDamage: false, fireDamage: false, majorAccident: false, details: [],
  },
  exterior: {
    hood: normalPanel, frontBumper: normalPanel, rearBumper: { status: 'repainted' as const, detail: '경미한 접촉사고 도색' },
    trunk: normalPanel, roof: normalPanel,
    frontLeftFender: normalPanel, frontRightFender: normalPanel,
    rearLeftFender: normalPanel, rearRightFender: normalPanel,
    frontLeftDoor: normalPanel, frontRightDoor: normalPanel,
    rearLeftDoor: normalPanel, rearRightDoor: normalPanel,
    leftRocker: normalPanel, rightRocker: normalPanel,
    corrosion: false, unevenGaps: false,
  },
  mechanical: {
    engineCondition: '양호', oilLeak: false, coolantLeak: false,
    transmissionCondition: '양호', transmissionNoise: false, clutchCondition: null,
    driveShaft: '양호', steeringPlay: false, powerSteeringLeak: false,
    brakeCondition: '양호', brakePadRemaining: 70, absFunction: true,
    exhaustSystem: '양호', emissionTestResult: '합격',
    suspensionCondition: '양호', shockAbsorber: '양호', wheelBearing: '양호',
    tireCondition: '양호', tireTreadDepth: [6.5, 6.5, 7.0, 7.0],
  },
  interior: {
    dashboardCondition: '양호', seatCondition: '양호',
    airConditioner: '정상', heater: '정상',
    powerWindows: true, powerDoorLocks: true,
    audioSystem: '정상', navigationSystem: '정상',
    rearCamera: true, airbagWarningLight: false,
    absWarningLight: false, engineWarningLight: false,
    odometerTampering: false, mileageAtInspection: 15000,
  },
  detail: {
    inspectorName: '김정비', inspectorLicense: 'KI-2024-1234',
    inspectionCenter: '한국교통안전공단 서울검사소',
    inspectionDate: '2024-05-15', expiryDate: '2026-05-15',
    overallGrade: 'A' as const, overallScore: 88,
  },
} as const

/** Create mock KOTSA vehicle data with optional overrides */
export function createMockKotsaVehicleData(
  overrides?: DeepPartial<KotsaVehicleData>,
): KotsaVehicleData {
  return {
    basicInfo: { ...DEFAULT_BASIC_INFO, ...overrides?.basicInfo } as KotsaVehicleData['basicInfo'],
    spec: overrides?.spec
      ? deepMerge(DEFAULT_SPEC, overrides.spec) as KotsaVehicleData['spec']
      : { ...DEFAULT_SPEC } as unknown as KotsaVehicleData['spec'],
    maintenance: overrides?.maintenance
      ? deepMerge(DEFAULT_MAINTENANCE, overrides.maintenance) as KotsaVehicleData['maintenance']
      : { ...DEFAULT_MAINTENANCE } as unknown as KotsaVehicleData['maintenance'],
    inspection: overrides?.inspection
      ? deepMerge(DEFAULT_INSPECTION, overrides.inspection) as KotsaVehicleData['inspection']
      : { ...DEFAULT_INSPECTION } as unknown as KotsaVehicleData['inspection'],
  }
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      ) as T[keyof T]
    } else if (val !== undefined) {
      result[key] = val as T[keyof T]
    }
  }
  return result
}

export class MockKotsaAdapter {
  async fetchVehicleInfo(
    registrationNumber: string,
    _ci: string,
  ): Promise<KotsaVehicleData> {
    if (!registrationNumber) {
      throw new Error('차량 등록번호가 필요합니다')
    }
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300))
    return createMockKotsaVehicleData({
      basicInfo: { registrationNumber },
    })
  }
}
```

- [ ] **Step 5: Create module index**

Create `src/lib/kotsa/index.ts`:

```typescript
export type { KotsaAdapter } from './adapters/kotsa-adapter'
export { MockKotsaAdapter, createMockKotsaVehicleData } from './adapters/mock-adapter'
export type { KotsaVehicleData, KotsaBasicInfo, KotsaSpec } from './types'
export { kotsaVehicleDataSchema } from './schemas'
```

- [ ] **Step 6: Run all KOTSA tests**

Run: `bun run test tests/unit/lib/kotsa/`
Expected: PASS (all tests in types, schemas, adapter)

- [ ] **Step 7: Commit**

```bash
git add src/lib/kotsa/ tests/unit/lib/kotsa/
git commit -m "feat(kotsa): add adapter interface, mock implementation, and Zod schemas"
```

---

## Task 6: KOTSA Mapper — API Response → Vehicle Model

**Files:**
- Create: `src/lib/kotsa/utils/mapper.ts`
- Test: `tests/unit/lib/kotsa/mapper.test.ts`

- [ ] **Step 1: Write mapper tests**

Create `tests/unit/lib/kotsa/mapper.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mapKotsaToInspectionData } from '@/lib/kotsa/utils/mapper'
import { createMockKotsaVehicleData } from '@/lib/kotsa/adapters/mock-adapter'
import { inspectionDataSchema } from '@/features/vehicles/schemas/inspection-data'

describe('mapKotsaToInspectionData', () => {
  it('maps KOTSA data to existing InspectionData format', () => {
    const kotsaData = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(kotsaData)

    expect(result.overallGrade).toBe('A')
    expect(result.overallScore).toBe(88)
    expect(result.panels.hood).toBe('normal')
    expect(result.panels.rearBumper).toBe('repainted')
    expect(result.accidentDiagnosis).toBe('none')
  })

  it('result validates against existing inspectionDataSchema', () => {
    const kotsaData = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(kotsaData)
    const parsed = inspectionDataSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('maps accident history correctly', () => {
    const kotsaData = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: true,
          accidentCount: 1,
          totalRepairCost: 500000,
          majorAccident: false,
        },
      },
    })
    const result = mapKotsaToInspectionData(kotsaData)
    expect(result.accidentDiagnosis).toBe('minor')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/kotsa/mapper.test.ts`
Expected: FAIL — mapper not found

- [ ] **Step 3: Implement mapper**

Create `src/lib/kotsa/utils/mapper.ts`:

```typescript
import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'
import type { KotsaVehicleData } from '../types'
import type { KotsaPanelCondition } from '../types/inspection'

/**
 * Map KOTSA vehicle data to the existing InspectionData format
 * stored in Vehicle.inspectionData JSON field.
 */
export function mapKotsaToInspectionData(
  data: KotsaVehicleData,
): InspectionData {
  const { inspection } = data
  const ext = inspection.exterior

  return {
    overallScore: inspection.detail.overallScore,
    overallGrade: inspection.detail.overallGrade,
    panels: {
      hood: toPanelStatus(ext.hood),
      frontBumper: toPanelStatus(ext.frontBumper),
      rearBumper: toPanelStatus(ext.rearBumper),
      trunk: toPanelStatus(ext.trunk),
      roof: toPanelStatus(ext.roof),
      frontLeftFender: toPanelStatus(ext.frontLeftFender),
      frontRightFender: toPanelStatus(ext.frontRightFender),
      rearLeftFender: toPanelStatus(ext.rearLeftFender),
      rearRightFender: toPanelStatus(ext.rearRightFender),
      frontLeftDoor: toPanelStatus(ext.frontLeftDoor),
      frontRightDoor: toPanelStatus(ext.frontRightDoor),
      rearLeftDoor: toPanelStatus(ext.rearLeftDoor),
      rearRightDoor: toPanelStatus(ext.rearRightDoor),
      leftRocker: toPanelStatus(ext.leftRocker),
      rightRocker: toPanelStatus(ext.rightRocker),
    },
    repaintCount: countPanels(ext, 'repainted'),
    replacedCount: countPanels(ext, 'replaced'),
    categories: {
      interior: scoreFromCondition(inspection.interior.dashboardCondition, inspection.interior.seatCondition),
      exterior: { score: inspection.detail.overallScore, totalItems: 15, passedItems: 15 - countPanels(ext, 'repainted') - countPanels(ext, 'replaced'), warningItems: countPanels(ext, 'repainted'), failedItems: countPanels(ext, 'replaced') },
      tires: { score: avgTreadScore(inspection.mechanical.tireTreadDepth), totalItems: 4, passedItems: inspection.mechanical.tireTreadDepth.filter(d => d >= 3).length, warningItems: inspection.mechanical.tireTreadDepth.filter(d => d >= 1.6 && d < 3).length, failedItems: inspection.mechanical.tireTreadDepth.filter(d => d < 1.6).length },
      consumables: { score: 85, totalItems: 6, passedItems: 5, warningItems: 1, failedItems: 0 },
      undercarriage: scoreFromCondition(inspection.mechanical.suspensionCondition, inspection.mechanical.driveShaft),
    },
    accidentDiagnosis: mapAccidentDiagnosis(inspection.accidentHistory),
    evaluator: {
      name: inspection.detail.inspectorName,
      branch: inspection.detail.inspectionCenter,
      employeeId: inspection.detail.inspectorLicense,
      photoUrl: null,
      recommendation: inspection.detail.overallGrade === 'A_PLUS' || inspection.detail.overallGrade === 'A' ? '추천' : '보통',
    },
    inspectedAt: inspection.detail.inspectionDate,
  }
}

function toPanelStatus(panel: KotsaPanelCondition): 'normal' | 'repainted' | 'replaced' {
  if (panel.status === 'damaged') return 'replaced'
  return panel.status
}

function countPanels(
  ext: KotsaVehicleData['inspection']['exterior'],
  status: string,
): number {
  const panels = [
    ext.hood, ext.frontBumper, ext.rearBumper, ext.trunk, ext.roof,
    ext.frontLeftFender, ext.frontRightFender, ext.rearLeftFender, ext.rearRightFender,
    ext.frontLeftDoor, ext.frontRightDoor, ext.rearLeftDoor, ext.rearRightDoor,
    ext.leftRocker, ext.rightRocker,
  ]
  return panels.filter((p) => p.status === status).length
}

function mapAccidentDiagnosis(
  history: KotsaVehicleData['inspection']['accidentHistory'],
): 'none' | 'minor' | 'moderate' | 'severe' {
  if (!history.hasAccident) return 'none'
  if (history.majorAccident) return 'severe'
  if (history.totalRepairCost > 2_000_000) return 'moderate'
  return 'minor'
}

function scoreFromCondition(...conditions: string[]) {
  const scores = conditions.map((c) => (c === '양호' ? 95 : c === '보통' ? 70 : 40))
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const total = conditions.length
  const passed = conditions.filter((c) => c === '양호').length
  const warning = conditions.filter((c) => c === '보통').length
  const failed = total - passed - warning
  return { score: Math.round(avg), totalItems: total, passedItems: passed, warningItems: warning, failedItems: failed }
}

function avgTreadScore(depths: number[]): number {
  const avg = depths.reduce((a, b) => a + b, 0) / depths.length
  return Math.min(100, Math.round((avg / 8) * 100))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test tests/unit/lib/kotsa/mapper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/kotsa/utils/ tests/unit/lib/kotsa/mapper.test.ts
git commit -m "feat(kotsa): add mapper from KOTSA data to InspectionData format"
```

---

## Task 7: KCB eKYC Adapter Refactor

**Files:**
- Create: `src/lib/ekyc/adapter.ts`
- Create: `src/lib/ekyc/mock-adapter.ts`
- Create: `src/lib/ekyc/index.ts`
- Modify: `src/features/contracts/utils/mock-ekyc.ts` → re-export from new location
- Test: `tests/unit/lib/ekyc/adapter.test.ts`

- [ ] **Step 1: Write adapter tests**

Create `tests/unit/lib/ekyc/adapter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockKcbAdapter } from '@/lib/ekyc/mock-adapter'
import type { KcbAdapter } from '@/lib/ekyc/adapter'

describe('MockKcbAdapter', () => {
  let adapter: KcbAdapter

  beforeEach(() => {
    vi.useFakeTimers()
    adapter = new MockKcbAdapter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sendVerificationCode returns sent: true', async () => {
    const promise = adapter.sendVerificationCode('01012345678')
    vi.advanceTimersByTime(500)
    const result = await promise
    expect(result).toEqual({ sent: true })
  })

  it('verifyIdentity succeeds with correct code', async () => {
    const promise = adapter.verifyIdentity({
      name: '홍길동',
      phone: '01012345678',
      carrier: 'SKT',
      birthDate: '1990-01-01',
      gender: 'M',
      verificationCode: '123456',
    })
    vi.advanceTimersByTime(500)
    const result = await promise
    expect(result.verified).toBe(true)
    expect(result.ci).toBeDefined()
    expect(result.di).toBeDefined()
    expect(result.ci?.length).toBe(88)
    expect(result.di?.length).toBe(64)
  })

  it('verifyIdentity fails with wrong code', async () => {
    const promise = adapter.verifyIdentity({
      name: '홍길동',
      phone: '01012345678',
      carrier: 'SKT',
      birthDate: '1990-01-01',
      gender: 'M',
      verificationCode: '999999',
    })
    vi.advanceTimersByTime(500)
    await expect(promise).rejects.toThrow('인증번호가 일치하지 않습니다')
  })

  it('enforces rate limit on sendVerificationCode', async () => {
    // Send 3 codes (limit)
    for (let i = 0; i < 3; i++) {
      const p = adapter.sendVerificationCode('01012345678')
      vi.advanceTimersByTime(500)
      await p
    }
    // 4th should fail
    const p = adapter.sendVerificationCode('01012345678')
    vi.advanceTimersByTime(500)
    await expect(p).rejects.toThrow('인증번호 발송 횟수를 초과했습니다')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/lib/ekyc/adapter.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create adapter interface**

Create `src/lib/ekyc/adapter.ts`:

```typescript
export type KcbVerifyInput = {
  name: string
  phone: string
  carrier: string
  birthDate: string
  gender: string
  verificationCode: string
}

export type KcbVerifyResult = {
  verified: boolean
  name: string
  phone: string
  carrier: 'SKT' | 'KT' | 'LGU'
  birthDate: string
  gender: 'M' | 'F'
  verifiedAt: Date
  /** 연계정보 — 88 bytes, cross-site user ID */
  ci: string | null
  /** 중복가입확인정보 — 64 bytes, site-unique user ID */
  di: string | null
}

/**
 * KCB 본인인증 adapter interface.
 *
 * Implementations:
 * - MockKcbAdapter: development/testing
 * - RealKcbAdapter: production (created after KCB license receipt)
 */
export type KcbAdapter = {
  sendVerificationCode(phone: string): Promise<{ sent: true }>
  verifyIdentity(input: KcbVerifyInput): Promise<KcbVerifyResult>
}
```

- [ ] **Step 4: Create mock adapter with rate limiting**

Create `src/lib/ekyc/mock-adapter.ts`:

```typescript
import type { KcbAdapter, KcbVerifyInput, KcbVerifyResult } from './adapter'

const MAX_SEND_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const CODE_EXPIRY_MS = 3 * 60 * 1000 // 3 minutes
const MAX_VERIFY_ATTEMPTS = 5

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockKcbAdapter implements KcbAdapter {
  private sendAttempts = new Map<string, { count: number; firstAttemptAt: number }>()
  private verifyAttempts = new Map<string, number>()

  async sendVerificationCode(phone: string): Promise<{ sent: true }> {
    const now = Date.now()
    const record = this.sendAttempts.get(phone)

    if (record) {
      if (now - record.firstAttemptAt < RATE_LIMIT_WINDOW_MS) {
        if (record.count >= MAX_SEND_ATTEMPTS) {
          throw new Error('인증번호 발송 횟수를 초과했습니다 (5분 후 재시도)')
        }
        record.count++
      } else {
        this.sendAttempts.set(phone, { count: 1, firstAttemptAt: now })
      }
    } else {
      this.sendAttempts.set(phone, { count: 1, firstAttemptAt: now })
    }

    await delay(500)
    return { sent: true }
  }

  async verifyIdentity(input: KcbVerifyInput): Promise<KcbVerifyResult> {
    const attempts = this.verifyAttempts.get(input.phone) ?? 0
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new Error('인증 시도 횟수를 초과했습니다 (30분 후 재시도)')
    }
    this.verifyAttempts.set(input.phone, attempts + 1)

    await delay(500)

    if (input.verificationCode !== '123456') {
      throw new Error('인증번호가 일치하지 않습니다.')
    }

    // Generate deterministic mock CI/DI based on phone
    const ci = generateMockCI(input.phone)
    const di = generateMockDI(input.phone)

    return {
      verified: true,
      name: input.name,
      phone: input.phone,
      carrier: input.carrier as 'SKT' | 'KT' | 'LGU',
      birthDate: input.birthDate,
      gender: input.gender as 'M' | 'F',
      verifiedAt: new Date(),
      ci,
      di,
    }
  }
}

function generateMockCI(phone: string): string {
  const base = Buffer.from(`CI-MOCK-${phone}-NAVID`).toString('base64')
  return base.padEnd(88, '0').slice(0, 88)
}

function generateMockDI(phone: string): string {
  const base = Buffer.from(`DI-MOCK-${phone}-NAVID`).toString('base64')
  return base.padEnd(64, '0').slice(0, 64)
}
```

- [ ] **Step 5: Create index + backwards-compatible re-export**

Create `src/lib/ekyc/index.ts`:

```typescript
export type { KcbAdapter, KcbVerifyInput, KcbVerifyResult } from './adapter'
export { MockKcbAdapter } from './mock-adapter'
```

Update `src/features/contracts/utils/mock-ekyc.ts` — add re-export comment at top:

```typescript
/**
 * @deprecated Use `@/lib/ekyc` instead. This file is kept for backwards compatibility.
 */
// ... existing code remains unchanged
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun run test tests/unit/lib/ekyc/adapter.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib/ekyc/ tests/unit/lib/ekyc/
git commit -m "feat(ekyc): refactor to adapter pattern with rate limiting and CI/DI support"
```

---

## Task 8: Vehicle Report Page — Data Layer + API

**Files:**
- Create: `src/features/vehicles/queries/report.ts`
- Create: `src/app/api/vehicles/[id]/report/route.ts`
- Test: `tests/unit/features/vehicles/queries/report.test.ts`

- [ ] **Step 1: Write query tests**

Create `tests/unit/features/vehicles/queries/report.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getVehicleReport } from '@/features/vehicles/queries/report'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    vehicle: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-id',
        inspectionData: null,
        trim: {
          name: 'Smart Stream',
          generation: {
            name: 'CN7',
            carModel: { name: '아반떼', brand: { name: '현대' } },
          },
        },
      }),
    },
  },
}))

describe('getVehicleReport', () => {
  it('returns vehicle with KOTSA mock data when no inspectionData', async () => {
    const result = await getVehicleReport('test-id')
    expect(result).toBeDefined()
    expect(result?.kotsaData).toBeDefined()
    expect(result?.kotsaData.basicInfo).toBeDefined()
  })

  it('returns null for non-existent vehicle', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValueOnce(null)
    const result = await getVehicleReport('non-existent')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/features/vehicles/queries/report.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement report query**

Create `src/features/vehicles/queries/report.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'
import { createMockKotsaVehicleData } from '@/lib/kotsa'
import { mapKotsaToInspectionData } from '@/lib/kotsa/utils/mapper'
import type { KotsaVehicleData } from '@/lib/kotsa/types'
import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'

export type VehicleReportData = {
  vehicleId: string
  brandName: string
  modelName: string
  generationName: string
  trimName: string
  kotsaData: KotsaVehicleData
  inspectionData: InspectionData
}

export async function getVehicleReport(
  vehicleId: string,
): Promise<VehicleReportData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      trim: {
        include: {
          generation: {
            include: {
              carModel: {
                include: { brand: true },
              },
            },
          },
        },
      },
    },
  })

  if (!vehicle) return null

  // Use KOTSA mock adapter for now — will switch to real adapter after API key
  const kotsaData = createMockKotsaVehicleData({
    basicInfo: {
      manufacturer: vehicle.trim.generation.carModel.brand.name,
      modelName: vehicle.trim.generation.carModel.name,
      modelYear: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color,
    },
  })

  const inspectionData = mapKotsaToInspectionData(kotsaData)

  return {
    vehicleId: vehicle.id,
    brandName: vehicle.trim.generation.carModel.brand.name,
    modelName: vehicle.trim.generation.carModel.name,
    generationName: vehicle.trim.generation.name,
    trimName: vehicle.trim.name,
    kotsaData,
    inspectionData,
  }
}
```

- [ ] **Step 4: Create API route**

Create `src/app/api/vehicles/[id]/report/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getVehicleReport } from '@/features/vehicles/queries/report'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const report = await getVehicleReport(id)
  if (!report) {
    return apiError('차량을 찾을 수 없습니다', 404)
  }

  return apiSuccess(report)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test tests/unit/features/vehicles/queries/report.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/vehicles/queries/report.ts src/app/api/vehicles/\[id\]/report/
git add tests/unit/features/vehicles/queries/report.test.ts
git commit -m "feat(vehicles): add vehicle report query and API endpoint with KOTSA mock data"
```

---

## Task 9: Vehicle Report Page — UI Components

**Files:**
- Create: `src/app/(public)/vehicles/[id]/report/page.tsx`
- Create: `src/features/vehicles/components/report/report-summary-card.tsx`
- Create: `src/features/vehicles/components/report/panel-diagram.tsx`
- Create: `src/features/vehicles/components/report/maintenance-timeline.tsx`
- Create: `src/features/vehicles/components/report/spec-table.tsx`
- Create: `src/features/vehicles/components/report/index.ts`

- [ ] **Step 1: Create report page (Server Component)**

Create `src/app/(public)/vehicles/[id]/report/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getVehicleReport } from '@/features/vehicles/queries/report'
import {
  ReportSummaryCard,
  PanelDiagram,
  MaintenanceTimeline,
  SpecTable,
} from '@/features/vehicles/components/report'

type Props = {
  params: Promise<{ id: string }>
}

export default async function VehicleReportPage({ params }: Props) {
  const { id } = await params
  const report = await getVehicleReport(id)

  if (!report) notFound()

  const { kotsaData, inspectionData } = report

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">
          {report.brandName} {report.modelName} {report.generationName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {report.trimName} · {kotsaData.basicInfo.modelYear}년식 ·{' '}
          {kotsaData.basicInfo.mileage.toLocaleString()}km
        </p>
      </header>

      <ReportSummaryCard
        grade={inspectionData.overallGrade}
        score={inspectionData.overallScore}
        accidentDiagnosis={inspectionData.accidentDiagnosis}
        ownerChanges={kotsaData.basicInfo.numberOfOwnerChanges}
        hasSeizure={kotsaData.basicInfo.hasSeizure}
        hasMortgage={kotsaData.basicInfo.hasMortgage}
      />

      <PanelDiagram panels={inspectionData.panels} />

      <SpecTable spec={kotsaData.spec} basicInfo={kotsaData.basicInfo} />

      <MaintenanceTimeline records={kotsaData.maintenance.records} />
    </div>
  )
}
```

- [ ] **Step 2: Create ReportSummaryCard**

Create `src/features/vehicles/components/report/report-summary-card.tsx`:

```tsx
const GRADE_COLORS: Record<string, string> = {
  A_PLUS: 'bg-emerald-500',
  A: 'bg-green-500',
  B_PLUS: 'bg-yellow-500',
  B: 'bg-orange-500',
  C: 'bg-red-500',
}

const GRADE_LABELS: Record<string, string> = {
  A_PLUS: 'A+',
  A: 'A',
  B_PLUS: 'B+',
  B: 'B',
  C: 'C',
}

const ACCIDENT_LABELS: Record<string, string> = {
  none: '무사고',
  minor: '경미',
  moderate: '보통',
  severe: '중대사고',
}

type Props = {
  grade: string
  score: number
  accidentDiagnosis: string
  ownerChanges: number
  hasSeizure: boolean
  hasMortgage: boolean
}

export function ReportSummaryCard({
  grade,
  score,
  accidentDiagnosis,
  ownerChanges,
  hasSeizure,
  hasMortgage,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-xl border p-4 text-center">
        <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ${GRADE_COLORS[grade] ?? 'bg-gray-500'}`}>
          {GRADE_LABELS[grade] ?? grade}
        </div>
        <p className="text-muted-foreground text-sm">종합 등급</p>
        <p className="text-lg font-semibold">{score}점</p>
      </div>

      <div className="rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-sm">사고 이력</p>
        <p className={`text-lg font-semibold ${accidentDiagnosis === 'none' ? 'text-green-600' : 'text-red-600'}`}>
          {ACCIDENT_LABELS[accidentDiagnosis] ?? accidentDiagnosis}
        </p>
      </div>

      <div className="rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-sm">소유자 변경</p>
        <p className="text-lg font-semibold">{ownerChanges}회</p>
      </div>

      <div className="rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-sm">압류/저당</p>
        <p className={`text-lg font-semibold ${!hasSeizure && !hasMortgage ? 'text-green-600' : 'text-red-600'}`}>
          {!hasSeizure && !hasMortgage ? '없음' : `${hasSeizure ? '압류' : ''} ${hasMortgage ? '저당' : ''}`.trim()}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create PanelDiagram**

Create `src/features/vehicles/components/report/panel-diagram.tsx`:

```tsx
type PanelStatus = 'normal' | 'repainted' | 'replaced'
type Panels = Record<string, PanelStatus>

const STATUS_COLORS: Record<PanelStatus, string> = {
  normal: 'bg-green-100 border-green-300 text-green-700',
  repainted: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  replaced: 'bg-red-100 border-red-300 text-red-700',
}

const STATUS_LABELS: Record<PanelStatus, string> = {
  normal: '정상',
  repainted: '도색',
  replaced: '교체',
}

const PANEL_LABELS: Record<string, string> = {
  hood: '후드', frontBumper: '전면범퍼', rearBumper: '후면범퍼',
  trunk: '트렁크', roof: '루프',
  frontLeftFender: '좌전펜더', frontRightFender: '우전펜더',
  rearLeftFender: '좌후펜더', rearRightFender: '우후펜더',
  frontLeftDoor: '좌전도어', frontRightDoor: '우전도어',
  rearLeftDoor: '좌후도어', rearRightDoor: '우후도어',
  leftRocker: '좌로커', rightRocker: '우로커',
}

type Props = { panels: Panels }

export function PanelDiagram({ panels }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">외판 상태</h2>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {Object.entries(panels).map(([key, status]) => (
          <div
            key={key}
            className={`rounded-lg border p-3 text-center text-sm ${STATUS_COLORS[status]}`}
          >
            <p className="font-medium">{PANEL_LABELS[key] ?? key}</p>
            <p className="text-xs">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm border ${STATUS_COLORS[status as PanelStatus]}`} />
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create MaintenanceTimeline**

Create `src/features/vehicles/components/report/maintenance-timeline.tsx`:

```tsx
import type { KotsaMaintenanceRecord } from '@/lib/kotsa/types/maintenance'

type Props = { records: readonly KotsaMaintenanceRecord[] | KotsaMaintenanceRecord[] }

export function MaintenanceTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold">정비 이력</h2>
        <p className="text-muted-foreground">정비 이력이 없습니다.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">정비 이력 ({records.length}건)</h2>
      <div className="space-y-4">
        {records.map((record, i) => (
          <div key={i} className="relative border-l-2 border-blue-200 pl-6">
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-blue-400 bg-white" />
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{record.date}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {record.category}
                </span>
              </div>
              <p className="mt-1 text-sm">{record.description}</p>
              <div className="text-muted-foreground mt-2 flex gap-4 text-xs">
                <span>{record.mileage.toLocaleString()}km</span>
                <span>{record.shopName}</span>
                <span>{record.totalCost.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create SpecTable**

Create `src/features/vehicles/components/report/spec-table.tsx`:

```tsx
import type { KotsaSpec } from '@/lib/kotsa/types/spec'
import type { KotsaBasicInfo } from '@/lib/kotsa/types/basic-info'

type Props = {
  spec: KotsaSpec
  basicInfo: KotsaBasicInfo
}

export function SpecTable({ spec, basicInfo }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">제원 정보</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <SpecGroup title="기본 정보" items={[
          ['차대번호', basicInfo.vin],
          ['최초등록일', basicInfo.firstRegistrationDate],
          ['연료', basicInfo.fuelType],
          ['배기량', `${basicInfo.displacement}cc`],
          ['변속기', basicInfo.transmissionType],
          ['승차정원', `${basicInfo.numberOfSeats}명`],
        ]} />

        <SpecGroup title="엔진" items={[
          ['형식', spec.engine.type],
          ['최고출력', spec.engine.maxPower],
          ['최대토크', spec.engine.maxTorque],
          ['연비', `${spec.engine.fuelEfficiency}km/L`],
          ['CO2', `${spec.engine.co2Emission}g/km`],
          ['배출가스', spec.engine.emissionStandard],
        ]} />

        <SpecGroup title="차체" items={[
          ['전장×전폭×전고', `${spec.body.length}×${spec.body.width}×${spec.body.height}mm`],
          ['축거', `${spec.body.wheelbase}mm`],
          ['공차중량', `${spec.body.curbWeight}kg`],
          ['구동방식', spec.transmission.driveType],
        ]} />

        <SpecGroup title="하체" items={[
          ['전륜 서스펜션', spec.suspension.front],
          ['후륜 서스펜션', spec.suspension.rear],
          ['전륜 브레이크', spec.brake.front],
          ['후륜 브레이크', spec.brake.rear],
          ['타이어(전)', spec.tire.frontSize],
          ['조향', spec.steering.type],
        ]} />
      </div>
    </section>
  )
}

function SpecGroup({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-lg border">
      <h3 className="border-b bg-muted/50 px-4 py-2 text-sm font-medium">{title}</h3>
      <dl className="divide-y">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 6: Create barrel export**

Create `src/features/vehicles/components/report/index.ts`:

```typescript
export { ReportSummaryCard } from './report-summary-card'
export { PanelDiagram } from './panel-diagram'
export { MaintenanceTimeline } from './maintenance-timeline'
export { SpecTable } from './spec-table'
```

- [ ] **Step 7: Run type check**

Run: `bun run type-check`
Expected: No type errors

- [ ] **Step 8: Commit**

```bash
git add src/app/\(public\)/vehicles/\[id\]/report/ src/features/vehicles/components/report/
git commit -m "feat(vehicles): add vehicle condition report page with KOTSA data"
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|-----------|
| 1 | Schema indexes + v3.0 enums + CI/DI fields | — |
| 2 | KOTSA types: basic-info + spec (70 fields) | — |
| 3 | KOTSA types: maintenance + inspection (72 fields) | — |
| 4 | KOTSA Zod schemas | Tasks 2, 3 |
| 5 | KOTSA adapter interface + mock | Task 4 |
| 6 | KOTSA mapper (API → Vehicle model) | Task 5 |
| 7 | KCB eKYC adapter refactor | Task 1 |
| 8 | Vehicle report data layer + API | Tasks 5, 6 |
| 9 | Vehicle report UI components | Task 8 |

**Parallelization:** Tasks 1, 2, 3 can run in parallel. Task 7 is independent of Tasks 2-6.
