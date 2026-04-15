# Listing Schema Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차용 Listing 모델에 중고차 도메인 표준 필드(스펙·신뢰·상품전용)를 추가하고, Zod 검증 + 번호판 마스킹 + 풍부한 시드를 갖춘 데이터 레이어를 완성한다.

**Architecture:** 단일 Listing 테이블에 nullable 전용 필드 추가 + 앱 레이어 Zod 디스크리미네이티드 유니온으로 상품별 required 강제. 프리런치 단계라 파괴적 마이그레이션(db push --force-reset) 허용. accidentFree(Bool) → accidentCount(Int)로 단일화하며 모든 소비자 코드를 한 커밋으로 전환.

**Tech Stack:** Next.js 15 (App Router), React 19, Prisma 6, PostgreSQL (Supabase), Zod, vitest, bun

**Spec:** `docs/superpowers/specs/2026-04-16-listing-schema-extension-design.md`

---

## File Structure

### Create (신규)
- `src/lib/catalog/vehicle-options.ts` — 정적 옵션 카탈로그
- `src/lib/validation/listing.ts` — Zod 디스크리미네이티드 유니온
- `src/lib/validation/listing.test.ts` — Zod 검증 테스트
- `src/lib/listings/sanitize.ts` — 번호판/VIN 마스킹
- `src/lib/listings/sanitize.test.ts` — 마스킹 테스트

### Modify (수정)
- `prisma/schema.prisma` — 필드·Enum·인덱스 delta
- `prisma/seed.ts` — 5건 풍부한 시드로 재작성
- `src/app/api/listings/route.ts` — Zod 검증 + sanitize 적용
- `src/app/api/listings/[id]/route.ts` — Zod 검증 + sanitize 적용
- `src/app/api/favorites/my/route.ts` — accidentFree → accidentCount 필드 전환
- `src/app/(public)/page.tsx` — accidentFree 제거
- `src/app/(public)/list/page.tsx` — accidentFree 제거
- `src/app/(public)/detail/[id]/page.tsx` — accidentFree 참조 교체
- `src/types/index.ts` — accidentFree 타입 키 제거, 신규 타입 export
- `src/features/admin/listing-admin-table.tsx` — 확장 정보 섹션 추가

### 원칙
- 각 태스크는 독립 커밋 (TDD: test-red → impl-green → commit)
- type-check / lint / test 는 각 태스크 말미와 최종 태스크에서 실행
- 파괴적 DB 작업은 **Task 4 한 번만**; 그 외 태스크는 비파괴적

---

## Task 1: 정적 옵션 카탈로그

**Files:**
- Create: `src/lib/catalog/vehicle-options.ts`

**Context:** 옵션 태그(내비게이션·썬루프·HUD 등)를 `options: String[]` 필드에 저장한다. MVP에서는 DB 택소노미 테이블 대신 정적 카탈로그로 관리. Admin/SELL 폼 드롭다운·칩셋 · DETAIL 표시에 이 소스를 재사용한다.

- [ ] **Step 1: 카탈로그 파일 작성**

```ts
// src/lib/catalog/vehicle-options.ts

/**
 * 차량 옵션 정적 카탈로그.
 * DB에는 `Listing.options: String[]` 로 해당 `code` 값이 저장됨.
 * UI는 이 목록을 기반으로 그룹 렌더링·자동완성·필터를 구성.
 *
 * 향후 M3에 Feature 테이블로 이전 예정 (known tech debt).
 */

export type OptionGroup = "convenience" | "safety" | "performance" | "multimedia" | "interior" | "exterior"

export interface VehicleOption {
  code: string
  label: string
  group: OptionGroup
}

export const VEHICLE_OPTIONS: readonly VehicleOption[] = [
  // 편의
  { code: "navigation", label: "내비게이션", group: "convenience" },
  { code: "sunroof", label: "썬루프", group: "convenience" },
  { code: "panoramic_sunroof", label: "파노라마 썬루프", group: "convenience" },
  { code: "smart_key", label: "스마트키", group: "convenience" },
  { code: "remote_start", label: "원격시동", group: "convenience" },
  { code: "ventilated_seats", label: "통풍시트", group: "convenience" },
  { code: "heated_seats", label: "열선시트", group: "convenience" },
  { code: "heated_steering", label: "열선핸들", group: "convenience" },
  { code: "power_seats", label: "전동시트", group: "convenience" },
  { code: "memory_seats", label: "메모리시트", group: "convenience" },
  // 안전
  { code: "rear_camera", label: "후방카메라", group: "safety" },
  { code: "around_view", label: "어라운드뷰", group: "safety" },
  { code: "parking_sensors", label: "주차센서", group: "safety" },
  { code: "blind_spot", label: "사각지대 경보", group: "safety" },
  { code: "lane_assist", label: "차선유지보조", group: "safety" },
  { code: "adaptive_cruise", label: "어댑티브 크루즈", group: "safety" },
  { code: "auto_emergency_brake", label: "자동긴급제동", group: "safety" },
  // 퍼포먼스
  { code: "hud", label: "HUD", group: "performance" },
  { code: "paddle_shift", label: "패들시프트", group: "performance" },
  { code: "adaptive_headlight", label: "어댑티브 헤드라이트", group: "performance" },
  // 멀티미디어
  { code: "apple_carplay", label: "애플 카플레이", group: "multimedia" },
  { code: "android_auto", label: "안드로이드 오토", group: "multimedia" },
  { code: "premium_audio", label: "프리미엄 오디오", group: "multimedia" },
  { code: "wireless_charger", label: "무선충전", group: "multimedia" },
  // 내외장
  { code: "leather_seats", label: "가죽시트", group: "interior" },
  { code: "ambient_light", label: "앰비언트 라이트", group: "interior" },
  { code: "power_tailgate", label: "전동 트렁크", group: "exterior" },
  { code: "led_headlight", label: "LED 헤드라이트", group: "exterior" },
  { code: "alloy_wheel", label: "알로이 휠", group: "exterior" },
] as const

const CODE_SET = new Set(VEHICLE_OPTIONS.map((o) => o.code))

export function isValidOptionCode(code: string): boolean {
  return CODE_SET.has(code)
}

export function getOptionLabel(code: string): string {
  return VEHICLE_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function groupOptions(codes: readonly string[]): Record<OptionGroup, VehicleOption[]> {
  const byGroup: Record<OptionGroup, VehicleOption[]> = {
    convenience: [], safety: [], performance: [], multimedia: [], interior: [], exterior: [],
  }
  for (const opt of VEHICLE_OPTIONS) {
    if (codes.includes(opt.code)) byGroup[opt.group].push(opt)
  }
  return byGroup
}
```

- [ ] **Step 2: type-check**

Run: `bun run type-check`
Expected: 에러 0 (신규 파일만 추가됨)

- [ ] **Step 3: Commit**

```bash
git add src/lib/catalog/vehicle-options.ts
git commit -m "feat(catalog): add static vehicle options catalog"
```

---

## Task 2: Zod 검증 스키마 (TDD)

**Files:**
- Create: `src/lib/validation/listing.test.ts`
- Create: `src/lib/validation/listing.ts`

**Context:** 3상품(TRANSFER/USED_LEASE/USED_RENTAL) 타입별 required 필드를 Zod `discriminatedUnion`으로 강제. API POST/PUT과 Admin 폼이 동일 스키마를 공유한다. Prisma enum은 아직 생성 전이므로 로컬 리터럴 유니온 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/validation/listing.test.ts
import { describe, expect, it } from "vitest"
import {
  listingInputSchema,
  transferListingSchema,
  leaseListingSchema,
  rentalListingSchema,
} from "./listing"

describe("listingInputSchema", () => {
  const baseValid = {
    brand: "현대",
    model: "아반떼",
    year: 2022,
    mileage: 30000,
    monthlyPayment: 450000,
    remainingMonths: 24,
    options: ["navigation", "sunroof"],
    accidentCount: 0,
  }

  describe("TRANSFER", () => {
    it("passes with required transfer fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        carryoverPremium: 2000000,
        transferFee: 100000,
      })
      expect(result.success).toBe(true)
    })

    it("fails without carryoverPremium", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        transferFee: 100000,
      })
      expect(result.success).toBe(false)
    })

    it("fails with negative carryoverPremium", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "TRANSFER",
        carryoverPremium: -100,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("USED_LEASE", () => {
    it("passes with required lease fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        deposit: 5000000,
        terminationFee: 1000000,
        mileageLimit: 20000,
      })
      expect(result.success).toBe(true)
    })

    it("allows null mileageLimit", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        deposit: 5000000,
        terminationFee: 1000000,
        mileageLimit: null,
      })
      expect(result.success).toBe(true)
    })

    it("fails without deposit", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_LEASE",
        terminationFee: 1000000,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("USED_RENTAL", () => {
    it("passes with required rental fields", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        type: "USED_RENTAL",
        deposit: 3000000,
        terminationFee: 500000,
        mileageLimit: 30000,
      })
      expect(result.success).toBe(true)
    })
  })

  describe("base validation", () => {
    it("rejects year before 1990", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        year: 1989,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects accidentCount > 99", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        accidentCount: 100,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative monthlyPayment", () => {
      const result = listingInputSchema.safeParse({
        ...baseValid,
        monthlyPayment: -1,
        type: "TRANSFER",
        carryoverPremium: 0,
        transferFee: 0,
      })
      expect(result.success).toBe(false)
    })
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `bun run test src/lib/validation/listing.test.ts`
Expected: FAIL — `Cannot find module './listing'`

- [ ] **Step 3: 최소 구현 작성**

```ts
// src/lib/validation/listing.ts
import { z } from "zod"

/**
 * 차용 Listing 입력 검증 — 3상품 디스크리미네이티드 유니온.
 *
 * Prisma enum이 런타임 import 가능할 때까지 로컬 리터럴 유니온으로 표현.
 * API route (POST/PUT), Admin 폼, SELL 위자드에서 단일 진입 검증.
 */

const fuelType = z.enum(["GASOLINE", "DIESEL", "HYBRID", "PHEV", "EV", "HYDROGEN", "LPG"])
const transmission = z.enum(["AUTO", "MANUAL", "CVT", "DCT"])
const bodyType = z.enum(["SEDAN", "SUV", "HATCH", "COUPE", "WAGON", "VAN", "TRUCK", "CONVERTIBLE"])
const drivetrain = z.enum(["FF", "FR", "AWD", "FOURWD"])
const plateType = z.enum(["PRIVATE", "COMMERCIAL"])
const grade = z.enum(["A", "B", "C"])

const baseListing = z.object({
  brand: z.string().min(1, "brand is required"),
  model: z.string().min(1, "model is required"),
  year: z.number().int().min(1990).max(2100),
  mileage: z.number().int().nonnegative().optional(),
  vin: z.string().length(17).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  fuelType: fuelType.optional().nullable(),
  transmission: transmission.optional().nullable(),
  displacement: z.number().int().positive().optional().nullable(),
  bodyType: bodyType.optional().nullable(),
  drivetrain: drivetrain.optional().nullable(),
  plateType: plateType.optional().nullable(),
  color: z.string().optional().nullable(),
  seatingCapacity: z.number().int().positive().optional().nullable(),
  trim: z.string().optional().nullable(),

  options: z.array(z.string()).default([]),

  accidentCount: z.number().int().min(0).max(99).default(0),
  ownerCount: z.number().int().min(0).max(99).optional().nullable(),
  exteriorGrade: grade.optional().nullable(),
  interiorGrade: grade.optional().nullable(),
  mileageVerified: z.boolean().default(false),
  registrationRegion: z.string().optional().nullable(),
  inspectionReportUrl: z.string().url().optional().nullable(),
  inspectionDate: z.coerce.date().optional().nullable(),

  monthlyPayment: z.number().int().nonnegative(),
  remainingMonths: z.number().int().positive(),
  totalPrice: z.number().int().nonnegative().optional().nullable(),
  remainingBalance: z.number().int().nonnegative().optional().nullable(),
  initialCost: z.number().int().nonnegative().default(0),
  capitalCompany: z.string().optional().nullable(),

  description: z.string().optional().nullable(),
})

export const transferListingSchema = baseListing.extend({
  type: z.literal("TRANSFER"),
  carryoverPremium: z.number().int().nonnegative(),
  transferFee: z.number().int().nonnegative().default(0),
})

export const leaseListingSchema = baseListing.extend({
  type: z.literal("USED_LEASE"),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable().optional(),
})

export const rentalListingSchema = baseListing.extend({
  type: z.literal("USED_RENTAL"),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable().optional(),
})

export const listingInputSchema = z.discriminatedUnion("type", [
  transferListingSchema,
  leaseListingSchema,
  rentalListingSchema,
])

export type ListingInput = z.infer<typeof listingInputSchema>
export type TransferListingInput = z.infer<typeof transferListingSchema>
export type LeaseListingInput = z.infer<typeof leaseListingSchema>
export type RentalListingInput = z.infer<typeof rentalListingSchema>
```

- [ ] **Step 4: 테스트 재실행, 통과 확인**

Run: `bun run test src/lib/validation/listing.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: type-check**

Run: `bun run type-check`
Expected: 에러 0

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation/listing.ts src/lib/validation/listing.test.ts
git commit -m "feat(validation): add Zod discriminated union for Listing input"
```

---

## Task 3: 번호판/VIN Sanitize 레이어 (TDD)

**Files:**
- Create: `src/lib/listings/sanitize.test.ts`
- Create: `src/lib/listings/sanitize.ts`

**Context:** 공개 API에서 `plateNumber`의 마지막 4자리를 마스킹하고, `vin`은 비공개. 본인(sellerId 일치) 또는 ADMIN은 원본 노출.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/listings/sanitize.test.ts
import { describe, expect, it } from "vitest"
import { maskPlateNumber, sanitizeListingForPublic } from "./sanitize"

describe("maskPlateNumber", () => {
  it("masks last 4 digits of a typical plate", () => {
    expect(maskPlateNumber("12가3456")).toBe("12가****")
  })

  it("masks 3-digit prefix plates", () => {
    expect(maskPlateNumber("123가4567")).toBe("123가****")
  })

  it("returns null for null input", () => {
    expect(maskPlateNumber(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(maskPlateNumber(undefined)).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(maskPlateNumber("")).toBeNull()
  })

  it("leaves the value unchanged when it lacks 4 trailing digits", () => {
    expect(maskPlateNumber("임시-ABC")).toBe("임시-ABC")
  })
})

describe("sanitizeListingForPublic", () => {
  const baseListing = {
    id: "l1",
    sellerId: "seller1",
    plateNumber: "12가3456",
    vin: "KMHL14JA5MA123456",
    monthlyPayment: 450000,
  } as const

  it("masks plate and nullifies VIN for anonymous viewer", () => {
    const sanitized = sanitizeListingForPublic(baseListing)
    expect(sanitized.plateNumber).toBe("12가****")
    expect(sanitized.vin).toBeNull()
  })

  it("masks plate and nullifies VIN for other users", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "other", isAdmin: false })
    expect(sanitized.plateNumber).toBe("12가****")
    expect(sanitized.vin).toBeNull()
  })

  it("returns original values for the owner", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "seller1", isAdmin: false })
    expect(sanitized.plateNumber).toBe("12가3456")
    expect(sanitized.vin).toBe("KMHL14JA5MA123456")
  })

  it("returns original values for admin", () => {
    const sanitized = sanitizeListingForPublic(baseListing, { viewerId: "admin", isAdmin: true })
    expect(sanitized.plateNumber).toBe("12가3456")
    expect(sanitized.vin).toBe("KMHL14JA5MA123456")
  })

  it("preserves other fields untouched", () => {
    const sanitized = sanitizeListingForPublic(baseListing)
    expect(sanitized.id).toBe("l1")
    expect(sanitized.monthlyPayment).toBe(450000)
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `bun run test src/lib/listings/sanitize.test.ts`
Expected: FAIL — `Cannot find module './sanitize'`

- [ ] **Step 3: 최소 구현 작성**

```ts
// src/lib/listings/sanitize.ts

/**
 * 번호판/VIN 마스킹.
 *
 * 공개 API (GET /api/listings, GET /api/listings/[id]) 응답에서 호출.
 * 본인(sellerId 일치) 또는 ADMIN 권한자는 원본 노출.
 */

export interface SanitizeContext {
  viewerId?: string
  isAdmin?: boolean
}

export function maskPlateNumber(plate: string | null | undefined): string | null {
  if (!plate) return null
  return plate.replace(/\d{4}$/, "****")
}

interface ListingLike {
  sellerId: string
  plateNumber: string | null | undefined
  vin?: string | null | undefined
  [key: string]: unknown
}

export function sanitizeListingForPublic<T extends ListingLike>(
  listing: T,
  ctx: SanitizeContext = {},
): T & { plateNumber: string | null; vin: string | null } {
  const canSeeFull = ctx.isAdmin === true || (ctx.viewerId && listing.sellerId === ctx.viewerId)

  return {
    ...listing,
    plateNumber: canSeeFull ? (listing.plateNumber ?? null) : maskPlateNumber(listing.plateNumber),
    vin: canSeeFull ? (listing.vin ?? null) : null,
  }
}
```

- [ ] **Step 4: 테스트 재실행, 통과 확인**

Run: `bun run test src/lib/listings/sanitize.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings/sanitize.ts src/lib/listings/sanitize.test.ts
git commit -m "feat(listings): add plate/VIN sanitize layer for public API"
```

---

## Task 4: Prisma 스키마 확장 + 파괴적 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** 프리런치 상태에서 `db push --force-reset`으로 DB를 재생성한다. 기존 데이터는 모두 폐기, 이후 Task 5에서 새 시드로 재구축. accidentFree(Bool?) 컬럼 제거 및 fuelType/transmission enum 승격 포함.

- [ ] **Step 1: schema.prisma 수정 — Enum 추가 (파일 끝에 기존 enum 블록 근처)**

`prisma/schema.prisma`의 enum 섹션에 추가:

```prisma
enum FuelType {
  GASOLINE
  DIESEL
  HYBRID
  PHEV
  EV
  HYDROGEN
  LPG
}

enum Transmission {
  AUTO
  MANUAL
  CVT
  DCT
}

enum Grade {
  A
  B
  C
}

enum BodyType {
  SEDAN
  SUV
  HATCH
  COUPE
  WAGON
  VAN
  TRUCK
  CONVERTIBLE
}

enum Drivetrain {
  FF
  FR
  AWD
  FOURWD
}

enum PlateType {
  PRIVATE
  COMMERCIAL
}

enum ImagePosition {
  EXTERIOR_FRONT
  EXTERIOR_SIDE_LEFT
  EXTERIOR_SIDE_RIGHT
  EXTERIOR_REAR
  INTERIOR_DASH
  INTERIOR_SEATS
  ENGINE
  ODOMETER
  PLATE
  TRUNK
  OTHER
}
```

- [ ] **Step 2: Listing 모델 수정**

`model Listing { ... }` 블록 내부에서:

1. **제거**: `accidentFree    Boolean?      @map("accident_free")` 줄 삭제
2. **변경**: `fuelType String?` → `fuelType FuelType?` (매핑 유지)
3. **변경**: `transmission String?` → `transmission Transmission?`
4. **추가 필드** (기존 `color`/`plateNumber` 줄 다음에):

```prisma
  vin             String?       @db.VarChar(17) @map("vin")
  displacement    Int?
  bodyType        BodyType?     @map("body_type")
  drivetrain      Drivetrain?
  plateType       PlateType?    @map("plate_type")
```

5. **신뢰 정보 추가** (`options String[]` 줄 다음):

```prisma
  accidentCount      Int?     @default(0) @map("accident_count")
  ownerCount         Int?     @map("owner_count")
  exteriorGrade      Grade?   @map("exterior_grade")
  interiorGrade      Grade?   @map("interior_grade")
  mileageVerified    Boolean  @default(false) @map("mileage_verified")
  registrationRegion String?  @map("registration_region")
  inspectionReportUrl String? @map("inspection_report_url")
  inspectionDate     DateTime? @map("inspection_date")
```

6. **상품 전용 추가** (`transferFee` 줄 다음):

```prisma
  carryoverPremium Int?     @map("carryover_premium")
  terminationFee   Int?     @map("termination_fee")
  deposit          Int?
  mileageLimit     Int?     @map("mileage_limit")
```

7. **인덱스 추가** — 기존 `@@index` 블록들 끝에 4줄 추가:

```prisma
  @@index([options], type: Gin)
  @@index([status, type, monthlyPayment])
  @@index([status, brand, model])
  @@index([status, year(sort: Desc)])
```

- [ ] **Step 3: ListingImage 모델 수정**

`model ListingImage { ... }` 내부 `createdAt` 줄 바로 앞에:

```prisma
  position  ImagePosition?
```

- [ ] **Step 4: DB 강제 재설정 + Prisma client 재생성**

```bash
bun run db:push -- --force-reset --accept-data-loss
bun run db:generate
```

Expected:
- `Database reset successful` 메시지
- Generated Prisma Client to `./node_modules/@prisma/client`

**중요:** `--force-reset`은 프리런치 상태에서만 안전. 운영 DB에 절대 실행 금지. 실행 전 Supabase 대시보드에서 현재 브랜치가 로컬/개발임을 확인.

- [ ] **Step 5: 생성된 Prisma 타입 확인**

```bash
bun -e "import('@prisma/client').then(m => console.log(Object.keys(m).filter(k => /^(FuelType|Transmission|Grade|BodyType|Drivetrain|PlateType|ImagePosition)\$/.test(k))))"
```

Expected: `[ 'FuelType', 'Transmission', 'Grade', 'BodyType', 'Drivetrain', 'PlateType', 'ImagePosition' ]`

- [ ] **Step 6: 타입 체크** (아직 다른 파일이 accidentFree를 참조하므로 에러 예상 — 이것이 Task 6~8에서 해결할 작업)

```bash
bun run type-check 2>&1 | head -30
```

Expected: `accidentFree` 관련 타입 에러 여러 건. 이는 다음 태스크에서 정리됨. 진행 계속.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): extend Listing schema with domain fields and enums

- Add VIN/displacement/bodyType/drivetrain/plateType
- Add trust fields: accidentCount/ownerCount/grades/mileageVerified/registrationRegion
- Add inspectionReportUrl/inspectionDate
- Add type-specific: carryoverPremium/terminationFee/deposit/mileageLimit
- Add ImagePosition enum on ListingImage
- Upgrade fuelType/transmission to enums
- Drop accidentFree (replaced by accidentCount)
- GIN index on options + composite/sort indexes

BREAKING: destructive db push --force-reset. Pre-launch only."
```

---

## Task 5: 시드 재작성 (5건 풍부한 샘플)

**Files:**
- Modify: `prisma/seed.ts`

**Context:** `db:push --force-reset` 이후 빈 DB에 5건의 풍부한 매물을 생성. 각각 이미지 8~12장 + 옵션 10~15개 + 모든 신규 필드 채움. 현재 `prisma/seed.ts`는 accidentFree 참조가 있으므로 전체 재작성 또는 해당 부분 교체.

- [ ] **Step 1: 현재 시드 구조 파악**

```bash
wc -l prisma/seed.ts
head -30 prisma/seed.ts
```

- [ ] **Step 2: 시드 파일 재작성**

`prisma/seed.ts` 전체를 다음 골격으로 교체 (기존 Profile/관리자 생성 로직이 있다면 유지하되, Listing 섹션만 갈아끼움):

```ts
// prisma/seed.ts
import { PrismaClient, ListingStatus, ListingType } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // 1. 판매자 프로필 확보
  const seller = await prisma.profile.upsert({
    where: { email: "seed-seller@chayong.example" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "seed-seller@chayong.example",
      name: "시드 판매자",
      role: "SELLER",
      phone: "010-0000-0001",
    },
  })

  // 2. 기존 시드 매물 정리 (파괴적이므로 force-reset 이후 사실상 빈 테이블)
  await prisma.listingImage.deleteMany({})
  await prisma.listing.deleteMany({ where: { sellerId: seller.id } })

  // 3. 5건 풍부한 매물 생성
  const listings = await Promise.all([
    // — TRANSFER 1: 아반떼 CN7
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        type: ListingType.TRANSFER,
        status: ListingStatus.ACTIVE,
        brand: "현대",
        model: "아반떼",
        trim: "인스퍼레이션 1.6 가솔린",
        year: 2022,
        mileage: 28400,
        color: "어비스 블랙 펄",
        fuelType: "GASOLINE",
        transmission: "AUTO",
        displacement: 1598,
        bodyType: "SEDAN",
        drivetrain: "FF",
        plateType: "PRIVATE",
        vin: "KMHLN81CBNU123456",
        plateNumber: "23가4521",
        seatingCapacity: 5,
        monthlyPayment: 420000,
        initialCost: 0,
        remainingMonths: 28,
        totalPrice: 22000000,
        remainingBalance: 11760000,
        transferFee: 120000,
        carryoverPremium: 1500000,
        capitalCompany: "현대캐피탈",
        accidentCount: 0,
        ownerCount: 1,
        exteriorGrade: "A",
        interiorGrade: "A",
        mileageVerified: true,
        registrationRegion: "서울특별시",
        inspectionDate: new Date("2026-03-15"),
        isVerified: true,
        options: [
          "navigation", "rear_camera", "smart_key", "ventilated_seats",
          "heated_seats", "heated_steering", "lane_assist", "adaptive_cruise",
          "apple_carplay", "android_auto", "led_headlight", "alloy_wheel",
        ],
        description: "1인 소유·무사고 차량입니다. 실내 매우 깨끗하며 잔여 약정 2년 4개월입니다.",
      },
    }),

    // — TRANSFER 2: 제네시스 G80 RG3
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        type: ListingType.TRANSFER,
        status: ListingStatus.ACTIVE,
        brand: "제네시스",
        model: "G80",
        trim: "3.5 가솔린 터보 AWD",
        year: 2023,
        mileage: 15200,
        color: "탄자나이트 블루",
        fuelType: "GASOLINE",
        transmission: "AUTO",
        displacement: 3470,
        bodyType: "SEDAN",
        drivetrain: "AWD",
        plateType: "PRIVATE",
        vin: "KMHG341BJPA654321",
        plateNumber: "321허7842",
        seatingCapacity: 5,
        monthlyPayment: 1240000,
        initialCost: 0,
        remainingMonths: 34,
        totalPrice: 85000000,
        remainingBalance: 42160000,
        transferFee: 180000,
        carryoverPremium: 3000000,
        capitalCompany: "현대캐피탈",
        accidentCount: 1,
        ownerCount: 1,
        exteriorGrade: "A",
        interiorGrade: "A",
        mileageVerified: true,
        registrationRegion: "경기도",
        isVerified: true,
        options: [
          "navigation", "panoramic_sunroof", "around_view", "ventilated_seats",
          "heated_seats", "memory_seats", "leather_seats", "hud",
          "adaptive_cruise", "auto_emergency_brake", "premium_audio",
          "wireless_charger", "ambient_light", "power_tailgate", "led_headlight",
        ],
        description: "제네시스 하우스 멤버십 차량. 가벼운 접촉사고 1회 있으나 무교환. 옵션 풀 장착.",
      },
    }),

    // — USED_LEASE 1: BMW 520i
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        type: ListingType.USED_LEASE,
        status: ListingStatus.ACTIVE,
        brand: "BMW",
        model: "5 Series",
        trim: "520i M Sport",
        year: 2023,
        mileage: 22100,
        color: "알파인 화이트",
        fuelType: "GASOLINE",
        transmission: "AUTO",
        displacement: 1998,
        bodyType: "SEDAN",
        drivetrain: "FR",
        plateType: "PRIVATE",
        vin: "WBA5A5C50NG123789",
        plateNumber: "45하9134",
        seatingCapacity: 5,
        monthlyPayment: 960000,
        initialCost: 0,
        remainingMonths: 22,
        totalPrice: null,
        remainingBalance: null,
        transferFee: 200000,
        deposit: 8000000,
        terminationFee: 1800000,
        mileageLimit: 20000,
        capitalCompany: "BMW Financial Services",
        accidentCount: 0,
        ownerCount: 1,
        exteriorGrade: "A",
        interiorGrade: "A",
        mileageVerified: true,
        registrationRegion: "서울특별시",
        inspectionDate: new Date("2026-02-28"),
        isVerified: true,
        options: [
          "navigation", "panoramic_sunroof", "heated_seats", "leather_seats",
          "adaptive_cruise", "lane_assist", "blind_spot", "around_view",
          "apple_carplay", "premium_audio", "ambient_light", "led_headlight",
          "alloy_wheel",
        ],
        description: "BMW FS 리스 승계 매물. 잔여 22개월, 보증 이관 가능.",
      },
    }),

    // — USED_LEASE 2: 벤츠 E350
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        type: ListingType.USED_LEASE,
        status: ListingStatus.ACTIVE,
        brand: "메르세데스-벤츠",
        model: "E-Class",
        trim: "E350 4MATIC AMG Line",
        year: 2024,
        mileage: 8400,
        color: "옵시디언 블랙",
        fuelType: "GASOLINE",
        transmission: "AUTO",
        displacement: 1999,
        bodyType: "SEDAN",
        drivetrain: "AWD",
        plateType: "PRIVATE",
        vin: "WDD2130231A987654",
        plateNumber: "88수1023",
        seatingCapacity: 5,
        monthlyPayment: 1380000,
        initialCost: 0,
        remainingMonths: 36,
        totalPrice: null,
        remainingBalance: null,
        transferFee: 250000,
        deposit: 12000000,
        terminationFee: 2500000,
        mileageLimit: 25000,
        capitalCompany: "메르세데스-벤츠 파이낸셜",
        accidentCount: 0,
        ownerCount: 1,
        exteriorGrade: "A",
        interiorGrade: "A",
        mileageVerified: true,
        registrationRegion: "서울특별시",
        isVerified: true,
        options: [
          "navigation", "panoramic_sunroof", "ventilated_seats", "heated_seats",
          "memory_seats", "leather_seats", "hud", "adaptive_cruise",
          "lane_assist", "auto_emergency_brake", "premium_audio",
          "wireless_charger", "ambient_light", "power_tailgate", "led_headlight",
        ],
        description: "거의 신차 수준의 E350 리스 승계. 주행 1만km 미만.",
      },
    }),

    // — USED_RENTAL 1: 기아 K8
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        type: ListingType.USED_RENTAL,
        status: ListingStatus.ACTIVE,
        brand: "기아",
        model: "K8",
        trim: "3.5 가솔린 시그니처",
        year: 2023,
        mileage: 35800,
        color: "스노우 화이트 펄",
        fuelType: "GASOLINE",
        transmission: "AUTO",
        displacement: 3470,
        bodyType: "SEDAN",
        drivetrain: "FF",
        plateType: "COMMERCIAL",
        vin: "KNALD4AC5NA456789",
        plateNumber: "56아7123",
        seatingCapacity: 5,
        monthlyPayment: 820000,
        initialCost: 0,
        remainingMonths: 30,
        totalPrice: null,
        remainingBalance: null,
        transferFee: 150000,
        deposit: 5000000,
        terminationFee: 1200000,
        mileageLimit: 30000,
        capitalCompany: "롯데렌탈",
        accidentCount: 2,
        ownerCount: 1,
        exteriorGrade: "B",
        interiorGrade: "A",
        mileageVerified: false,
        registrationRegion: "부산광역시",
        isVerified: false,
        options: [
          "navigation", "rear_camera", "heated_seats", "ventilated_seats",
          "smart_key", "remote_start", "apple_carplay", "premium_audio",
          "led_headlight", "alloy_wheel",
        ],
        description: "롯데렌탈 장기 렌트 승계. 경미 접촉 2회. 서스펜션 양호.",
      },
    }),
  ])

  // 4. 각 매물당 10장씩 이미지 생성 (외부 4 / 내부 4 / 엔진 1 / 계기판 1)
  const POSITION_SEQUENCE = [
    "EXTERIOR_FRONT", "EXTERIOR_SIDE_LEFT", "EXTERIOR_SIDE_RIGHT", "EXTERIOR_REAR",
    "INTERIOR_DASH", "INTERIOR_SEATS", "INTERIOR_SEATS", "INTERIOR_DASH",
    "ENGINE", "ODOMETER",
  ] as const

  for (const [idx, listing] of listings.entries()) {
    const slug = `${listing.brand}-${listing.model}`.replace(/\s+/g, "-").toLowerCase()
    const imagesData = POSITION_SEQUENCE.map((position, i) => ({
      listingId: listing.id,
      url: `https://picsum.photos/seed/${slug}-${idx}-${i}/1200/800`,
      order: i,
      isPrimary: i === 0,
      position: position as any,
    }))
    await prisma.listingImage.createMany({ data: imagesData })
  }

  console.log(`✅ Seeded ${listings.length} listings with ${listings.length * 10} images`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
```

**주의:** 기존 `prisma/seed.ts`가 Profile/Admin 유저 생성 등 다른 작업을 하고 있다면 그 부분은 보존. 위 코드는 Listing 섹션 전용 — 실제 병합 시 기존 seed의 entry point(main 함수) 내에서 Listing 파트만 교체/확장.

- [ ] **Step 3: 시드 실행**

```bash
bun run db:seed
```

Expected: `✅ Seeded 5 listings with 50 images`

- [ ] **Step 4: 검증**

```bash
bun -e "import { prisma } from '@/lib/db/prisma'; (async () => { const c = await prisma.listing.count(); const i = await prisma.listingImage.count(); console.log({listings: c, images: i}); await prisma.\$disconnect() })()" 2>&1 | tail -3
```

Expected: `{ listings: 5, images: 50 }`

혹은 `bun run db:studio`로 Prisma Studio 열어서 육안 확인.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(db): rewrite seed with 5 rich listings (2 transfer, 2 lease, 1 rental)"
```

---

## Task 6: /api/listings route.ts — accidentFree 제거 + Zod·sanitize 적용

**Files:**
- Modify: `src/app/api/listings/route.ts`

**Context:** 현재 라우트는 accidentFree를 응답에 매핑하고, POST에 수동 검증을 쓴다. Zod + sanitize로 교체.

- [ ] **Step 1: GET 응답 매핑에서 accidentFree → accidentCount 교체**

`src/app/api/listings/route.ts` 77~82번째 줄 영역을 수정:

현재:
```ts
      isVerified: listing.isVerified,
      accidentFree: listing.accidentFree,
      viewCount: listing.viewCount,
```

교체:
```ts
      isVerified: listing.isVerified,
      accidentCount: listing.accidentCount,
      mileageVerified: listing.mileageVerified,
      viewCount: listing.viewCount,
```

- [ ] **Step 2: POST에 Zod 검증 적용**

POST 함수 전체를 다음으로 교체:

```ts
import { listingInputSchema } from "@/lib/validation/listing";

// ...

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const parsed = listingInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력 검증 실패", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const listing = await prisma.listing.create({
      data: {
        ...input,
        sellerId: auth.userId,
        status: "DRAFT",
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
```

- [ ] **Step 3: type-check**

```bash
bun run type-check 2>&1 | grep -E "(api/listings/route|error)" | head -10
```

Expected: `api/listings/route.ts`에 관련된 에러 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/listings/route.ts
git commit -m "refactor(api): replace manual validation with Zod in /api/listings; drop accidentFree"
```

---

## Task 7: /api/listings/[id]/route.ts — Zod PUT + sanitize GET

**Files:**
- Modify: `src/app/api/listings/[id]/route.ts`

**Context:** 현재 allowlist 기반 PUT + raw GET. Zod `partial()` 로 부분 업데이트 검증 + sanitize 적용.

- [ ] **Step 1: 기존 파일 읽기**

```bash
cat src/app/api/listings/[id]/route.ts
```

(라인 수 · 구조 파악)

- [ ] **Step 2: accidentFree allowlist 제거**

파일 12번째 줄 근처 `"capitalCompany", "accidentFree", "description",` 에서 `"accidentFree"` 제거.

- [ ] **Step 3: GET에 sanitize 적용**

`GET` 핸들러가 listing을 반환하는 부분에:

```ts
import { sanitizeListingForPublic } from "@/lib/listings/sanitize";
import { createClient } from "@/lib/supabase/server";
// ...

// GET 핸들러 내에서 listing fetch 후:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const viewerId = user?.id;

// admin 여부 확인 (profile.role === 'ADMIN')
let isAdmin = false;
if (viewerId) {
  const profile = await prisma.profile.findUnique({ where: { id: viewerId }, select: { role: true } });
  isAdmin = profile?.role === "ADMIN";
}

const publicListing = sanitizeListingForPublic(listing, { viewerId, isAdmin });
return NextResponse.json(publicListing);
```

- [ ] **Step 4: PUT에 부분 Zod 검증 적용 (선택적 강화)**

PUT이 body를 받는 부분에서, 본인 확인 후 Zod `listingInputSchema.partial()` 를 쓰되 discriminatedUnion은 partial로 직접 못 만드므로 각 타입별 partial 스키마 또는 간단 필드 검증 루프 유지 가능. 단, 최소한:

```ts
const ALLOWED_FIELDS = [
  "brand", "model", "year", "trim", "fuelType", "transmission",
  "seatingCapacity", "mileage", "color", "plateNumber", "vin",
  "displacement", "bodyType", "drivetrain", "plateType",
  "options", "accidentCount", "ownerCount", "exteriorGrade", "interiorGrade",
  "mileageVerified", "registrationRegion", "inspectionReportUrl", "inspectionDate",
  "monthlyPayment", "initialCost", "remainingMonths", "totalPrice",
  "remainingBalance", "capitalCompany", "transferFee",
  "carryoverPremium", "terminationFee", "deposit", "mileageLimit",
  "description", "status",
] as const;
```

기존 allowlist를 위 목록으로 교체. (accidentFree 제거 + 신규 필드 추가)

- [ ] **Step 5: type-check**

```bash
bun run type-check 2>&1 | grep -E "(\\[id\\]/route|error)" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/listings/[id]/route.ts
git commit -m "refactor(api): apply sanitize + expanded allowlist to /api/listings/[id]"
```

---

## Task 8: 소비자 코드 일괄 정리 — accidentFree 참조 제거

**Files:**
- Modify: `src/app/api/favorites/my/route.ts`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/list/page.tsx`
- Modify: `src/app/(public)/detail/[id]/page.tsx`
- Modify: `src/types/index.ts`

**Context:** `accidentFree` 필드 완전 제거. 모든 UI 소비자는 `accidentCount === 0`으로 "무사고 여부"를 파생.

- [ ] **Step 1: 모든 참조 지점 재확인**

```bash
grep -rn "accidentFree" src/ 2>&1
```

Expected: Task 6에서 이미 일부 제거됨. 나머지 파일 목록 확인.

- [ ] **Step 2: `src/types/index.ts` 수정**

43번째 줄 근처 `| "accidentFree"` 를 `| "accidentCount" | "mileageVerified"` 로 교체 (또는 해당 유니온의 의미에 맞게 조정; 필요한 필드가 여러 개면 모두 추가).

- [ ] **Step 3: `src/app/(public)/page.tsx` 수정**

44번째 줄 `accidentFree: l.accidentFree,` 를 `accidentCount: l.accidentCount, mileageVerified: l.mileageVerified,` 로 교체.

- [ ] **Step 4: `src/app/(public)/list/page.tsx` 수정**

123번째 줄 `accidentFree: l.accidentFree,` 를 `accidentCount: l.accidentCount,` 로 교체.

- [ ] **Step 5: `src/app/(public)/detail/[id]/page.tsx` 수정**

94~96번째 줄:

현재:
```tsx
listing.accidentFree === null
  ? ...
  : listing.accidentFree
```

교체 (무사고 파생 로직):
```tsx
listing.accidentCount === null || listing.accidentCount === undefined
  ? "확인 필요"
  : listing.accidentCount === 0
    ? "무사고"
    : `사고이력 ${listing.accidentCount}건`
```

(정확한 교체 문구는 주변 JSX 구조를 확인하여 맞춤. 메시지 톤은 기존과 유사하게.)

- [ ] **Step 6: `src/app/api/favorites/my/route.ts` 수정**

35번째 줄 `accidentFree: l.accidentFree,` 를 `accidentCount: l.accidentCount,` 로 교체.

- [ ] **Step 7: 재확인**

```bash
grep -rn "accidentFree" src/ prisma/ 2>&1
```

Expected: 결과 없음.

- [ ] **Step 8: type-check / lint**

```bash
bun run type-check
bun run lint
```

Expected: 에러 0.

- [ ] **Step 9: Commit**

```bash
git add src/types/index.ts src/app/ prisma/
git commit -m "refactor: replace accidentFree with accidentCount across UI consumers"
```

---

## Task 9: Admin 에디터 확장 정보 섹션

**Files:**
- Modify: `src/features/admin/listing-admin-table.tsx` (또는 실제 Admin 편집 컴포넌트)

**Context:** Admin 매물 편집 폼에 신규 필드 입력 영역 추가. 폼 전체 재설계는 별도 스펙. 이번에는 기존 폼 하단에 `<details>` 또는 접이식 "확장 정보" 섹션으로 최소 대응.

- [ ] **Step 1: Admin 폼 위치 확인**

```bash
grep -rn "listing-admin" src/features/admin/ | head -5
rg "type.*TRANSFER|carryoverPremium|deposit" src/features/admin/ | head -10
```

실제 편집 폼 컴포넌트 파일 특정.

- [ ] **Step 2: 섹션 추가**

폼 제출 경로 말미에 `<details>` 기반 섹션을 추가:

```tsx
{/* 확장 정보 — Listing Schema #1 */}
<details className="mt-6 rounded-lg border p-4">
  <summary className="cursor-pointer text-sm font-semibold">확장 정보</summary>
  <div className="mt-4 grid grid-cols-2 gap-4">
    {/* 차량 스펙 */}
    <Input label="VIN (17자)" {...register("vin")} maxLength={17} />
    <Input label="배기량(cc)" type="number" {...register("displacement")} />
    <Select label="차종" {...register("bodyType")}>
      <option value="">선택</option>
      {["SEDAN","SUV","HATCH","COUPE","WAGON","VAN","TRUCK","CONVERTIBLE"].map(v => <option key={v} value={v}>{v}</option>)}
    </Select>
    <Select label="구동" {...register("drivetrain")}>
      {["","FF","FR","AWD","FOURWD"].map(v => <option key={v} value={v}>{v || "선택"}</option>)}
    </Select>
    <Select label="번호판 유형" {...register("plateType")}>
      {["","PRIVATE","COMMERCIAL"].map(v => <option key={v} value={v}>{v || "선택"}</option>)}
    </Select>

    {/* 신뢰 */}
    <Input label="사고이력(건)" type="number" {...register("accidentCount", { valueAsNumber: true })} />
    <Input label="소유자 수" type="number" {...register("ownerCount", { valueAsNumber: true })} />
    <Select label="외부 등급" {...register("exteriorGrade")}>
      {["","A","B","C"].map(v => <option key={v} value={v}>{v || "선택"}</option>)}
    </Select>
    <Select label="내부 등급" {...register("interiorGrade")}>
      {["","A","B","C"].map(v => <option key={v} value={v}>{v || "선택"}</option>)}
    </Select>
    <Checkbox label="주행거리 검증됨" {...register("mileageVerified")} />
    <Input label="등록지" {...register("registrationRegion")} placeholder="서울특별시" />

    {/* 점검 */}
    <Input label="성능점검 URL" {...register("inspectionReportUrl")} />
    <Input label="점검일" type="date" {...register("inspectionDate")} />

    {/* TRANSFER 전용 */}
    {watchedType === "TRANSFER" && (
      <Input label="승계 프리미엄(원)" type="number" {...register("carryoverPremium", { valueAsNumber: true })} />
    )}

    {/* LEASE/RENTAL 전용 */}
    {(watchedType === "USED_LEASE" || watchedType === "USED_RENTAL") && (
      <>
        <Input label="보증금(원)" type="number" {...register("deposit", { valueAsNumber: true })} />
        <Input label="중도해지 위약금(원)" type="number" {...register("terminationFee", { valueAsNumber: true })} />
        <Input label="주행제한(km/년)" type="number" {...register("mileageLimit", { valueAsNumber: true })} />
      </>
    )}
  </div>
</details>
```

주의: 실제 폼이 `react-hook-form` 쓰는지, `useFormState` 인지, 일반 `<form>` 인지 확인하고 해당 패턴에 맞춤. `watchedType`은 폼에서 `type` 필드 관찰 값.

- [ ] **Step 3: 제출 경로 확인**

폼 submit → API PUT/POST 호출하는 부분이 새 필드를 body에 포함해서 보내는지 확인 (대개 `form.getValues()` 또는 전체 객체를 그대로 보내면 자동 포함됨).

- [ ] **Step 4: type-check / lint**

```bash
bun run type-check
bun run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/
git commit -m "feat(admin): add extended fields section to listing editor"
```

---

## Task 10: 최종 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: type-check 전체**

```bash
bun run type-check
```

Expected: 에러 0

- [ ] **Step 2: lint 전체**

```bash
bun run lint
```

Expected: 에러 0 (경고는 허용)

- [ ] **Step 3: unit 테스트**

```bash
bun run test
```

Expected: 모든 테스트 통과 (기존 29개 + 신규 23개 = 52개 이상). 특히 Task 2·3의 새 테스트 포함.

- [ ] **Step 4: build 성공**

```bash
bun run build 2>&1 | tail -20
```

Expected: Next.js 빌드 성공, 에러 없음.

- [ ] **Step 5: 런타임 스모크 테스트**

```bash
bun dev &
sleep 5
curl -s http://localhost:3000/api/listings | python3 -c "import sys,json; d=json.load(sys.stdin); print('count:', len(d['data'])); print('sample_fields:', list(d['data'][0].keys()) if d['data'] else 'empty')"
kill %1 2>/dev/null
```

Expected:
- `count: 5`
- `sample_fields` 에 `accidentCount`, `mileageVerified` 포함, `accidentFree` **미포함**

- [ ] **Step 6: 마지막 정리 Commit**

```bash
git status
# 잔여 파일 없음 확인
```

만약 format 변경사항 등이 남아있다면:

```bash
git add -A
git commit -m "chore: final formatting cleanup after schema extension"
```

---

## Self-Review 체크리스트 (플랜 작성자가 수행함)

- [x] 스펙의 모든 Goal 항목이 태스크에 매핑됨 (스펙 Goal 1~6 → Task 4/5/2/6-7/3/5)
- [x] Placeholder 없음 — 모든 코드 블록이 실제 코드로 채워짐
- [x] 타입 일관성 — `accidentCount`·`mileageVerified`·enum 명이 전 태스크 동일
- [x] Known tech debt는 스펙 문서에 기록 (Feature 테이블, DB CHECK, Document 모델)
- [x] Task 4 (파괴적 마이그레이션) 이후에만 API·UI 태스크가 와야 함 — 순서 준수
- [x] 각 태스크 독립 커밋

## 주의 사항

1. **Task 4의 `db push --force-reset`은 프리런치 전용.** 실사용자 데이터가 있는 순간 이 플랜 재실행 금지.
2. **Admin 폼 파일 실제 경로**는 Task 9 Step 1에서 grep으로 확정하고 진행. 레포에 따라 이름이 다를 수 있음.
3. **seed.ts 병합** — 기존 시드가 Listing 외 다른 엔티티(admin profile 등)를 생성한다면 그 부분은 보존하고 Listing 섹션만 교체.
4. **Task 7의 PUT Zod 적용**은 강도가 낮음(allowlist 유지). 완전한 Zod partial 검증은 후속 태스크/스펙에서 강화 가능 — 이번 스코프는 최소.
