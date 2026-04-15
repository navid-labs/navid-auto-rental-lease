# Admin Listing 편집 페이지 설계

## 목적
Admin 매물 관리에서 매물 상세 정보를 조회하고 전체 필드를 편집할 수 있는 페이지 추가. 현재는 테이블에서 상태 변경만 가능.

## 범위
- `/admin/listings/[id]` 상세/편집 페이지 신규 생성
- PATCH API 확장 (전체 편집 가능 필드)
- 테이블에서 상세 페이지 링크 추가

## 아키텍처

### 라우트
`src/app/admin/listings/[id]/page.tsx` — 서버 컴포넌트
- `prisma.listing.findUnique({ where: { id }, include: { images: true, seller: true } })`
- UUID 검증 실패 또는 미존재 시 `notFound()`
- 전체 필드 직렬화 → `ListingEditForm`에 전달

### 폼 컴포넌트
`src/features/admin/components/listing-edit-form.tsx` — 클라이언트 컴포넌트

#### 섹션 구조
1. **상태 관리** (항상 표시)
   - status: Select (DRAFT/PENDING/ACTIVE/RESERVED/SOLD/HIDDEN)
   - isVerified: Checkbox

2. **차량 기본 정보** (`<details open>`)
   - brand, model: Input (text)
   - year, seatingCapacity, mileage: Input (number)
   - trim, color, plateNumber: Input (text)
   - fuelType: Select (GASOLINE/DIESEL/HYBRID/PHEV/EV/HYDROGEN/LPG)
   - transmission: Select (AUTO/MANUAL/CVT/DCT)

3. **확장 정보** (`<details>`)
   - vin: Input (text, maxLength=17)
   - displacement: Input (number)
   - bodyType: Select (SEDAN/SUV/HATCH/COUPE/WAGON/VAN/TRUCK/CONVERTIBLE)
   - drivetrain: Select (FF/FR/AWD/FOURWD)
   - plateType: Select (PRIVATE/COMMERCIAL)
   - options: Textarea (쉼표 구분 입력 → string[] 변환)
   - description: Textarea

4. **신뢰 정보** (`<details>`)
   - accidentCount, ownerCount: Input (number)
   - exteriorGrade, interiorGrade: Select (A/B/C)
   - mileageVerified: Checkbox
   - registrationRegion: Input (text)

#### 저장 동작
- PATCH `/api/admin/listings/[id]` 호출
- 성공: toast "저장되었습니다" + 데이터 새로고침 (`router.refresh()`)
- 실패: 에러 메시지 표시

### API 확장
`src/app/api/admin/listings/[id]/route.ts`

현재 allowlist: `status`, `isVerified`
확장 allowlist 추가:
- 차량 기본: brand, model, year, trim, color, plateNumber, fuelType, transmission, seatingCapacity, mileage
- 확장: vin, displacement, bodyType, drivetrain, plateType, options, description
- 신뢰: accidentCount, ownerCount, exteriorGrade, interiorGrade, mileageVerified, registrationRegion

Zod 스키마로 검증 (enum 값, number 범위, vin 길이 등).

### 테이블 링크
`src/features/admin/components/listing-admin-table.tsx`
- 매물명 셀을 `<Link href={/admin/listings/${row.id}}>` 로 감쌈

## 디자인 규칙
- `var(--chayong-*)` CSS vars 사용
- shadcn 컴포넌트 재사용 (Input, Select, Label, Checkbox, Textarea, Button)
- 반응형: 2-column grid on desktop, 1-column on mobile

## 파일 목록
| 파일 | 액션 |
|------|------|
| `src/app/admin/listings/[id]/page.tsx` | 신규 |
| `src/features/admin/components/listing-edit-form.tsx` | 신규 |
| `src/app/api/admin/listings/[id]/route.ts` | 수정 |
| `src/features/admin/components/listing-admin-table.tsx` | 수정 |

## 검증
1. `bun run type-check` — PR 범위 내 0 errors
2. `bun run test -- --run` — 전체 통과
3. 브라우저: `/admin/listings` → 매물 클릭 → 필드 편집 → 저장 → 값 반영 확인
