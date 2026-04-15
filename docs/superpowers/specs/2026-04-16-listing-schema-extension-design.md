# Listing 스키마 확장 — Design Spec

- **작성**: 2026-04-16
- **담당 스펙 범위**: 데이터 모델 (Spec #1 of 3). 후속은 ② DETAIL 재설계, ③ LIST·HOME·상담 퍼널.
- **목표**: 차용(Chayong) 전환 퍼널 완성을 위한 데이터 레이어 준비. DETAIL/LIST/SELL이 소비할 수 있는 신뢰·스펙·상품별 필드를 Prisma 스키마에 확장한다.

## Context

차용 2026-04-16 디자인 리뷰에서 경쟁사(엔카·KB차차차·케이카·헤이딜러) 대비 DETAIL 페이지의 **신뢰·스펙 정보 밀도**가 결정적으로 얇다는 것이 핵심 격차로 드러났다. 현 Listing 모델은 금융 필드(월납입금·잔여월수·총가격·인도금)는 잘 구성되어 있으나, 중고차 거래에서 표준인 **사고이력 건수·소유자수·성능점검·옵션 태그·차대번호·배기량/차종/구동** 등이 빠져 있다.

프리런치 단계이며, 실사용자 데이터 보존 부담이 없으므로 스키마 확장에 자유롭다. 이번 마이그레이션에서 **향후 6개월 내 다시 뒤집지 않을 수준**까지 필드를 확보한다.

## Goals

1. **중고차 도메인 표준 필드 확보**: 엔카·KB 필터 항목에 1:1 대응되는 차량 스펙·신뢰 정보 컬럼 세트 추가.
2. **3상품(TRANSFER/USED_LEASE/USED_RENTAL) 전용 필드 분리**: 상품별 의미가 다른 비용·계약 필드를 명확히 분리하되 단일 테이블 내 nullable 칼럼으로 유지.
3. **타입 안전 검증**: 앱 레이어 Zod 디스크리미네이티드 유니온으로 상품별 required 필드를 강제.
4. **쿼리 성능**: LIST 페이지의 정렬·필터 대응 인덱스 추가.
5. **개인정보 보호**: 번호판을 공개 API에서 마스킹.
6. **풍부한 시드**: DETAIL/LIST 디자인이 시작될 수 있는 현실감 있는 샘플 매물 5건 생성.

## Non-Goals

- DETAIL/LIST 페이지 UI 변경 (→ Spec #2, #3)
- Feature 택소노미 테이블 도입 (기술 부채로 기록, M3 예정)
- 인스펙션 문서 별도 모델(Document 테이블) (→ 문서 여러 종류 요구될 때)
- SELL 페이지 차량번호 자동조회 API 연동 (별도 스펙)
- 관리자 UI 폼 재설계 (별도 태스크, 이 스펙에서는 admin에 필드 입력란만 추가)

## Architecture / Data Model

### Listing 모델 — 추가 필드 (delta-only)

기존 필드는 **그대로 유지**하며, 다음을 신규 추가한다. 기존 재사용 필드는 중복 제안하지 않는다.

```prisma
model Listing {
  // ... 기존 필드 유지 ...

  // ── 차량 식별 ──────────────────────────────────────────
  vin                 String?      @db.VarChar(17) @map("vin")
    /// 차대번호. plateNumber(번호판)와 별개. 17자 고정.

  // ── 차량 기본 스펙 (신규) ──────────────────────────────
  displacement        Int?
    /// 배기량 cc. EV/HYDROGEN은 null 허용.
  bodyType            BodyType?    @map("body_type")
  drivetrain          Drivetrain?
  plateType           PlateType?   @map("plate_type")
    /// 자가용/영업용. 영업용 렌트 승계 시 중요.

  // ── 신뢰 정보 (신규) ────────────────────────────────────
  accidentCount       Int?         @default(0) @map("accident_count")
  ownerCount          Int?         @map("owner_count")
  exteriorGrade       Grade?       @map("exterior_grade")
  interiorGrade       Grade?       @map("interior_grade")
  mileageVerified     Boolean      @default(false) @map("mileage_verified")
  registrationRegion  String?      @map("registration_region")
    /// "서울특별시", "경기도" 등 시·도 단위 표기.

  // ── 점검 문서 (신규) ────────────────────────────────────
  inspectionReportUrl String?      @map("inspection_report_url")
  inspectionDate      DateTime?    @map("inspection_date")

  // ── 상품 전용 (신규) ────────────────────────────────────
  // TRANSFER 전용
  carryoverPremium    Int?         @map("carryover_premium")
    /// 승계 프리미엄 (구매자가 판매자에게 지급하는 인수금 상회 웃돈).

  // USED_LEASE / USED_RENTAL 공통 전용
  terminationFee      Int?         @map("termination_fee")
    /// 중도해지 위약금. 기존 transferFee(=명의이전수수료)와 의미상 별개.
  deposit             Int?
    /// 보증금. 리스/렌트 계약 개시 시 납부.
  mileageLimit        Int?         @map("mileage_limit")
    /// 계약상 연간 주행 제한 km.

  // ── 기존 필드 중 변경 ────────────────────────────────
  // fuelType      String?  →  FuelType?      (enum 승격)
  // transmission  String?  →  Transmission?  (enum 승격)
  // accidentFree  Boolean? →  제거 (accidentCount == 0 으로 파생)

  // ── 인덱스 (추가) ────────────────────────────────────
  @@index([options], type: Gin)
  @@index([status, type, monthlyPayment])
  @@index([status, brand, model])
  @@index([status, year(sort: Desc)])
}
```

### 신규 Enum

```prisma
enum FuelType      { GASOLINE DIESEL HYBRID PHEV EV HYDROGEN LPG }
enum Transmission  { AUTO MANUAL CVT DCT }
enum Grade         { A B C }
enum BodyType      { SEDAN SUV HATCH COUPE WAGON VAN TRUCK CONVERTIBLE }
enum Drivetrain    { FF FR AWD FOURWD }
enum PlateType     { PRIVATE COMMERCIAL }

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

### ListingImage 확장

```prisma
model ListingImage {
  // ... 기존 필드 유지 ...
  position ImagePosition?
    /// 사진 위치 태그. 기존 레코드 호환을 위해 nullable.
}
```

### Partial Index & CHECK 제약 (raw SQL)

Prisma가 표현 못하는 제약은 마이그레이션의 `BEGIN`/`END` 블록에 추가한다:

```sql
-- 핫 경로 부분 인덱스
CREATE INDEX idx_listings_active_price
  ON listings (monthly_payment)
  WHERE status = 'ACTIVE';

-- 값 범위 제약
ALTER TABLE listings
  ADD CONSTRAINT chk_monthly_payment_nonneg CHECK (monthly_payment >= 0),
  ADD CONSTRAINT chk_mileage_nonneg        CHECK (mileage IS NULL OR mileage >= 0),
  ADD CONSTRAINT chk_year_range            CHECK (year IS NULL OR (year BETWEEN 1990 AND 2100)),
  ADD CONSTRAINT chk_accident_count_range  CHECK (accident_count IS NULL OR (accident_count BETWEEN 0 AND 99)),
  ADD CONSTRAINT chk_vin_length            CHECK (vin IS NULL OR char_length(vin) = 17);
```

타입별 required 제약(예: `TRANSFER`이면 `carryover_premium NOT NULL`)은 **데이터 안정화 후** 추가. MVP에서는 Zod에서만 강제.

## Validation Layer

`src/lib/validation/listing.ts` 신설.

```ts
import { z } from 'zod'

const baseListing = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2100),
  mileage: z.number().int().nonnegative().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  displacement: z.number().int().positive().optional(),
  bodyType: z.nativeEnum(BodyType).optional(),
  options: z.array(z.string()).default([]),
  accidentCount: z.number().int().min(0).max(99).default(0),
  monthlyPayment: z.number().int().nonnegative(),
  remainingMonths: z.number().int().positive(),
})

const transferSchema = baseListing.extend({
  type: z.literal('TRANSFER'),
  carryoverPremium: z.number().int().nonnegative(),
  transferFee: z.number().int().nonnegative(),
})

const leaseSchema = baseListing.extend({
  type: z.literal('USED_LEASE'),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable(),
})

const rentalSchema = baseListing.extend({
  type: z.literal('USED_RENTAL'),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable(),
})

export const listingInputSchema = z.discriminatedUnion('type', [
  transferSchema,
  leaseSchema,
  rentalSchema,
])
```

API route (`POST /api/listings`, `PUT /api/listings/[id]`) 와 Admin 폼 제출 경로에서 단일하게 이 스키마를 사용한다. `src/features/admin/listing-admin-table.tsx` 와 `src/features/sell/sell-wizard.tsx` 에서 공유.

## 번호판 마스킹 (API 레이어)

`src/lib/listings/sanitize.ts` 신설.

```ts
export function maskPlateNumber(plate: string | null | undefined): string | null {
  if (!plate) return null
  // "12가3456" → "12가****"
  return plate.replace(/\d{4}$/, '****')
}

export function sanitizeListingForPublic(l: Listing, viewerId?: string): PublicListing {
  const isOwner = viewerId && l.sellerId === viewerId
  return {
    ...l,
    plateNumber: isOwner ? l.plateNumber : maskPlateNumber(l.plateNumber),
    vin: isOwner ? l.vin : null, // VIN은 비공개
  }
}
```

`GET /api/listings` · `GET /api/listings/[id]` 응답 경로와 서버 컴포넌트 fetcher에 적용.

## Seed 전략

`prisma/seed.ts` 업데이트:

- 기존 시드 매물 수 유지 또는 확장
- **최소 현실감 있는 샘플 5건**을 새 필드 모두 채워서 생성
  - 2건: `TRANSFER` (현대 아반떼 CN7 / 제네시스 G80 RG3)
  - 2건: `USED_LEASE` (BMW 520i / 벤츠 E350)
  - 1건: `USED_RENTAL` (기아 K8)
- 각 매물마다:
  - ListingImage 8~12장 × position 태그 (EXTERIOR_FRONT/SIDE_LEFT/.../ENGINE/ODOMETER/PLATE)
  - options 배열 10~15개 (실제 사용 용어: "내비게이션", "썬루프", "통풍시트", "후방카메라", "어라운드뷰", "HUD" 등)
  - 신뢰 필드 다양하게 분포 (accidentCount 0·1·3, mileageVerified 일부 true)
- 이미지 URL: 기존 시드가 플레이스홀더 깨짐(`??+차종`) 이슈 있음 — 공용 무료 자동차 스톡 이미지 URL(예: Unsplash Source) 또는 로컬 고정 PNG 사용.

실제 이미지 업로드 인프라는 Supabase Storage 사용(이미 구축됨). Seed에서는 외부 URL 그대로 저장.

## Migration 전략

단일 Prisma 마이그레이션으로 수행 가능. 단계:

1. **Prisma schema 수정** — 위 delta 반영
2. **Enum 전환 대비** — 기존 fuelType/transmission String을 enum으로 바꿀 때:
   - Prisma는 String↔Enum 직접 변환을 자동 생성하지 않으므로 **수동 SQL**로 데이터 이관 필요
   - 기존 데이터는 시드/임시 데이터 뿐이라 `TRUNCATE listings CASCADE` 후 `db push --force-reset` 허용 (프리런치라 가능)
3. **accidentFree 제거** — `DROP COLUMN accident_free` (시드 데이터 재생성)
4. **raw SQL 블록** — Partial index, CHECK 제약 추가
5. **`bun run db:generate`** — Prisma client 재생성
6. **`bun run db:seed`** — 새 시드 실행

프리런치 상태의 이점을 활용해 **파괴적 reset을 허용**한다. 향후 실사용자 진입 후에는 모든 변경이 non-destructive여야 함을 Spec #2·#3에서 강조.

## Admin UI (최소 대응)

이 스펙에서는 Admin UI를 **재설계하지 않는다**. 단, 새 필드 입력이 가능해야 스펙이 실제로 쓰이므로:

- `src/features/admin/listing-admin-table.tsx` 와 관련 에디터 컴포넌트에 새 필드 입력 영역 추가 (기존 섹션 하단에 "확장 정보" 폴드 섹션으로 배치)
- 타입별 조건부 렌더링: `type === TRANSFER` → carryoverPremium만, `type === USED_LEASE|RENTAL` → deposit/terminationFee/mileageLimit 표시
- Zod 스키마(위) 그대로 사용 — API 레벨과 폼 레벨 검증 일원화

SELL 위자드(`src/features/sell/sell-wizard.tsx`)는 이번 스펙에서 건드리지 않는다 (Spec #3 소속). 단, 제출된 데이터가 새 스키마의 required 필드를 채우지 못하면 저장 실패 — **SELL이 기본 필드만 저장하고 상세 필드는 Admin에서 보강** 하는 흐름을 유지.

## Testing

### Unit

`src/lib/validation/listing.test.ts`:
- 각 상품 타입의 성공 케이스
- 누락된 required 필드 실패
- 음수 값 · 범위 외 값 실패
- 번호판 마스킹 (`"12가3456"` → `"12가****"`, null/undefined 처리)

`src/lib/listings/sanitize.test.ts`:
- owner / non-owner / anonymous 분기별 플레이트/VIN 반환

### Integration

`tests/integration/listings-api.test.ts`:
- `POST /api/listings` 각 타입
- `GET /api/listings/[id]` 응답에 마스킹 적용 확인
- 본인 조회 시 full 반환

### Seed 검증

`bun run db:seed` 후:
- 5개 매물 존재, 각 8~12장 이미지 + position 태그
- accidentCount·ownerCount·grade 분포 다양
- `prisma studio` 로 육안 확인

### Schema

- Prisma `bun run db:push` 성공
- `prisma format` 포맷팅 통과
- TypeScript `bun run type-check` 에러 0

## Known Tech Debt (기록)

1. **Feature 택소노미**: `options: String[]` 은 3개월 내 한계 예상. M3에 `Feature` + `ListingFeature` m:n 도입 계획. 현재는 `src/lib/catalog/vehicle-options.ts` 에 정적 카탈로그 정의로 보완.
2. **CHECK (type-specific)**: 타입별 required 필드 DB CHECK는 MVP 이후. 현재는 Zod만.
3. **Document 테이블**: 성능점검기록부 외 보험이력/정비이력 문서가 추가될 때 `Document` 모델 분리.
4. **accidentFree 제거**: 일부 클라이언트 코드(있다면)에서 이 필드 참조 여부 전수 조사 후 삭제. 본 스펙에서 grep으로 확인.

## Open Questions

없음. 모든 결정 완료.

## 산출물 체크리스트

- [ ] `prisma/schema.prisma` 업데이트 (delta 반영)
- [ ] Prisma 마이그레이션 생성 + raw SQL 블록 추가
- [ ] `src/lib/validation/listing.ts` 신설
- [ ] `src/lib/listings/sanitize.ts` 신설
- [ ] `src/lib/catalog/vehicle-options.ts` 신설 (정적 옵션 카탈로그)
- [ ] `prisma/seed.ts` 업데이트 (새 필드 포함 5건)
- [ ] Admin 에디터 "확장 정보" 섹션 추가
- [ ] `src/app/api/listings/*` 에서 Zod + sanitize 적용
- [ ] 테스트 (unit · integration · seed 검증) 작성
- [ ] `bun run type-check` · `bun run lint` · `bun run test` 통과

## 후속 스펙 링크

- **Spec #2** (예정): DETAIL 재설계 — 본 스키마의 데이터를 소비하는 페이지 UI 재구성 (갤러리·옵션칩·신뢰 섹션·유사매물)
- **Spec #3** (예정): LIST·HOME·상담 퍼널 — 사이드바 필터·정렬·상품 분류 타일·상담 채널 확장
