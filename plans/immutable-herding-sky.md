# Migration Plan: yarn → bun + Server Actions → REST API (OpenAPI + Orval + Zod)

## Context

Navid Auto는 v2.1까지 20 Phases를 완료한 중고차 렌탈/리스 플랫폼. v3.0 진입 전 기술 스택을 현대화한다:
1. **yarn → bun**: 패키지 매니저 + 런타임 전환 (빌드/설치 속도 향상)
2. **Server Actions → REST API**: OpenAPI 3.1 스펙 기반, Orval로 타입 안전한 API 클라이언트 자동 생성

### 현재 상태
- 28개 서버 액션 파일, 55+ 함수, 45개 클라이언트 컴포넌트가 호출
- REST API 3개만 존재 (images, pdf x2)
- Zod v4 이미 사용 중 (폼 검증)
- 439 테스트 / 50 파일, 빌드 정상

---

## Phase 1: yarn → bun 전환

### 1.1 bun 설치 및 lockfile 교체
- `bun install` → `bun.lock` 생성
- `yarn.lock`, `.yarnrc.yml` 삭제

### 1.2 설정 파일 업데이트

| 파일 | 변경 |
|------|------|
| `vercel.json` | `installCommand: "bun install"`, `buildCommand: "bun run build"` |
| `playwright.config.ts:23` | `command: 'bun run dev'` |
| `package.json:57` prisma.seed | `"seed": "bun prisma/seed.ts"` (tsx 불필요) |

### 1.3 CLAUDE.md 업데이트
- `yarn` → `bun` 모든 참조 교체
- Package Manager 섹션 변경

### 1.4 devDependencies 정리
- `tsx` 제거 (bun이 TS 네이티브 실행)

### 1.5 검증
```bash
bun run dev          # Next.js 16 Turbopack 정상 기동
bun run build        # 프로덕션 빌드
bun run type-check   # 타입 체크
bun test             # vitest 439 테스트 통과
bun run lint         # ESLint
bun run db:generate  # Prisma 클라이언트 생성
```

### 1.6 커밋
`chore: migrate from yarn to bun (package manager + runtime)`

---

## Phase 2: REST API 인프라 구축

### 2.1 API 헬퍼 생성

**`src/lib/api/auth.ts`** — 인증 래퍼
```
requireAuth() → UserProfile | Response(401)
requireAdmin() → UserProfile(ADMIN) | Response(403)
```
기존 `src/lib/auth/helpers.ts`의 `getCurrentUser()` 재사용.

**`src/lib/api/response.ts`** — 응답 표준화
```
apiSuccess(data, status?) → NextResponse
apiError(message, status) → NextResponse
apiValidationError(zodError) → NextResponse
```

**`src/lib/api/validation.ts`** — 요청 파싱
```
parseBody(schema, request) → data | throw
parseQuery(schema, request) → data | throw
```

### 2.2 커밋
`feat: add REST API infrastructure (auth, response, validation helpers)`

---

## Phase 3: OpenAPI 스펙 + Orval 설정

### 3.1 OpenAPI 3.1 스펙 작성

```
src/openapi/
├── openapi.yaml          # 루트 ($ref로 피처 스펙 합성)
├── auth.yaml             # 3 endpoints
├── vehicles.yaml         # 18 endpoints
├── contracts.yaml        # 7 endpoints
├── admin.yaml            # 4 endpoints
├── inventory.yaml        # 7 endpoints
├── pricing.yaml          # 4 endpoints
├── inquiry.yaml          # 2 endpoints
└── settings.yaml         # 7 endpoints
```

총 **52 REST endpoints** (기존 서버 액션 55개 함수 매핑).

### 3.2 엔드포인트 매핑 (핵심)

**Auth** — login/signup/logout은 Server Action 유지 (redirect + cookie 처리)
| Action | Endpoint | 비고 |
|--------|----------|------|
| updateProfile | `PATCH /api/auth/profile` | REST 전환 |
| changeUserRole | `PATCH /api/admin/users/[id]/role` | REST 전환 |

**Vehicles**
| Action | Endpoint | Method |
|--------|----------|--------|
| createVehicle | `/api/vehicles` | POST |
| updateVehicle | `/api/vehicles/[id]` | PATCH |
| deleteVehicle | `/api/vehicles/[id]` | DELETE |
| updateStatus | `/api/vehicles/[id]/status` | PATCH |
| approveVehicle | `/api/vehicles/[id]/approve` | POST |
| batchApproveVehicles | `/api/vehicles/batch-approve` | POST |
| resubmitVehicle | `/api/vehicles/[id]/resubmit` | POST |
| restoreVehicle | `/api/vehicles/[id]/restore` | POST |
| uploadVehicleImage | `/api/vehicles/[id]/images` | POST (multipart) |
| deleteVehicleImage | `/api/vehicles/[id]/images/[imageId]` | DELETE |
| reorderVehicleImages | `/api/vehicles/[id]/images/reorder` | PATCH |
| loadMoreVehicles | `/api/vehicles` | GET |
| getBrands | `/api/vehicles/brands` | GET |
| getModelsByBrand | `/api/vehicles/brands/[id]/models` | GET |
| getGenerationsByModel | `/api/vehicles/models/[id]/generations` | GET |
| getTrimsByGeneration | `/api/vehicles/generations/[id]/trims` | GET |
| lookupPlateAction | `/api/vehicles/lookup-plate` | GET |
| createInquiry | `/api/vehicles/[id]/inquiry` | POST |

**Contracts**
| Action | Endpoint | Method |
|--------|----------|--------|
| createContract | `/api/contracts` | POST |
| approveContract | `/api/contracts/[id]/approve` | POST |
| submitEkyc | `/api/contracts/[id]/ekyc` | POST |
| sendVerificationCode | `/api/contracts/ekyc/send-code` | POST |
| getMyContracts | `/api/contracts/my` | GET |
| updateContractStatus | `/api/contracts/[id]/status` | PATCH |
| PDF (기존) | `/api/contracts/[id]/pdf` | GET |

**Admin / Inventory / Pricing / Settings** — 동일 패턴으로 REST 전환

### 3.3 Orval 설정

```bash
bun add -D orval
```

`orval.config.ts`:
- input: `src/openapi/openapi.yaml`
- output.client: `fetch` (axios 불필요)
- output.override.zod: `true` (API Zod 스키마 자동 생성)
- output.target: `src/lib/api/generated/`
- output.mode: `tags-split` (피처별 파일 분리)

```bash
# package.json scripts 추가
"api:generate": "orval"
"api:validate": "orval --validate"
```

생성 결과:
```
src/lib/api/generated/
├── vehicles.ts       # fetch 함수 + Zod 스키마
├── contracts.ts
├── auth.ts
├── admin.ts
├── inventory.ts
├── pricing.ts
├── inquiry.ts
├── settings.ts
└── model/            # 공유 타입
```

### 3.4 커밋
`feat: add OpenAPI 3.1 spec and Orval code generation`

---

## Phase 4: 비즈니스 로직 분리 (queries/ 레이어)

서버 액션 → REST 전환 전, 비즈니스 로직을 재사용 가능하게 분리.

### 4.1 queries/ 디렉토리 생성

```
src/features/*/queries/   # 순수 Prisma 쿼리 (use server 없음)
src/features/*/mutations/  # 순수 비즈니스 로직 (use server 없음)
```

**핵심 원칙**: Server Action에서 비즈니스 로직 추출 → queries/mutations에 배치 → API Route와 Server Component 모두 재사용.

| 원본 | 추출 위치 |
|------|----------|
| `get-cascade-data.ts` | `vehicles/queries/cascade.ts` |
| `load-more-vehicles.ts` | `vehicles/queries/search.ts` |
| `get-dashboard-stats.ts` | `admin/queries/dashboard.ts` |
| `create-vehicle.ts` 로직 | `vehicles/mutations/create.ts` |
| `create-contract.ts` 로직 | `contracts/mutations/create.ts` |
| 기타 모든 액션 | 동일 패턴 |

### 4.2 커밋
`refactor: extract business logic into queries/ and mutations/ layers`

---

## Phase 5: REST API Route 구현

### 5.1 Read-Only (GET) 먼저 — 저위험
- Cascade data (brands, models, generations, trims)
- Vehicle search (loadMoreVehicles → GET /api/vehicles)
- Dashboard stats, inventory items, pricing rates, settings

### 5.2 Mutations (POST/PATCH/DELETE) — 피처별 순서
1. Vehicles CRUD + status + approval
2. Vehicles images (multipart)
3. Contracts (create, approve, ekyc, status)
4. Admin (update, soft-delete, deactivate)
5. Inventory (load, upload, quote)
6. Pricing + Settings

### 5.3 Route Handler 패턴
```typescript
// src/app/api/vehicles/route.ts
import { requireAuth } from '@/lib/api/auth'
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { createVehicle } from '@/features/vehicles/mutations/create'
import { createVehicleSchema } from '@/features/vehicles/schemas/vehicle'

export async function POST(request: Request) {
  const user = await requireAuth()
  if (user instanceof Response) return user

  const body = await parseBody(createVehicleSchema, request)
  if (body instanceof Response) return body

  const result = await createVehicle(body, user)
  if ('error' in result) return apiError(result.error, 400)
  return apiSuccess(result, 201)
}
```

### 5.4 Auth 결정
- **login/signup/logout**: Server Action 유지 (redirect + Supabase cookie)
- **나머지 전부**: REST API로 전환
- `getCurrentUser()` → Route Handler에서도 동일하게 동작 (cookie 기반)

### 5.5 revalidatePath 처리
- Route Handler에서도 `revalidatePath()` 호출 가능 (Next.js App Router 지원)

### 5.6 커밋 (배치별)
- `feat: implement read-only REST API endpoints`
- `feat: implement vehicle mutation REST API endpoints`
- `feat: implement contract/admin/inventory REST API endpoints`

---

## Phase 6: 클라이언트 컴포넌트 와이어링

### 6.1 Orval 생성 클라이언트로 교체

45개 클라이언트 컴포넌트에서 `import ... from 'actions/'` → Orval 생성 클라이언트로 교체.

**Before:**
```typescript
import { approveVehicle } from '@/features/vehicles/actions/approve-vehicle'
startTransition(async () => {
  const result = await approveVehicle(vehicleId, action, reason)
})
```

**After:**
```typescript
import { postVehicleApprove } from '@/lib/api/generated/vehicles'
startTransition(async () => {
  const { data } = await postVehicleApprove(vehicleId, { action, reason })
})
```

### 6.2 Server Component 직접 호출
Dashboard, MyPage 등 Server Component는 REST가 아닌 `queries/` 직접 import.
```typescript
// src/app/admin/dashboard/page.tsx
import { getDashboardStats } from '@/features/admin/queries/dashboard'
const stats = await getDashboardStats()  // Prisma 직접, HTTP 루프백 없음
```

### 6.3 타입 이동
액션 파일에서 export하던 타입 → `features/*/types/`로 이동 또는 Orval 생성 타입 사용.

### 6.4 커밋
`refactor: wire client components to Orval-generated API clients`

---

## Phase 7: 테스트 마이그레이션 + 정리

### 7.1 테스트 업데이트
- 기존 서버 액션 테스트 → `queries/` / `mutations/` 테스트로 전환
- API Route 통합 테스트 추가 (선택)
- Auth 테스트 (login/signup/logout) 그대로 유지

### 7.2 서버 액션 파일 삭제
- `features/*/actions/*.ts` 전부 삭제 (**auth 3개 제외**: login, signup, logout)

### 7.3 최종 검증
```bash
bun test              # >= 439 테스트 통과
bun run build         # 프로덕션 빌드 성공
bun run type-check    # 타입 에러 0
bun run api:validate  # OpenAPI 스펙 유효
```

### 7.4 커밋
`chore: remove deprecated server actions and finalize migration`

---

## 수정 대상 핵심 파일

| 파일 | 변경 유형 |
|------|----------|
| `package.json` | bun 스크립트, orval devDep, api:generate 추가, tsx 제거 |
| `vercel.json` | installCommand, buildCommand → bun |
| `playwright.config.ts` | webServer command → bun |
| `.yarnrc.yml` | 삭제 |
| `yarn.lock` | 삭제 → `bun.lock` 대체 |
| `CLAUDE.md` (3곳) | yarn → bun 참조 교체 |
| `src/lib/api/auth.ts` | 신규 — API 인증 헬퍼 |
| `src/lib/api/response.ts` | 신규 — 응답 표준화 |
| `src/lib/api/validation.ts` | 신규 — 요청 파싱 |
| `src/openapi/*.yaml` | 신규 — OpenAPI 3.1 스펙 (9파일) |
| `orval.config.ts` | 신규 — Orval 설정 |
| `src/lib/api/generated/` | 자동 생성 — Orval 클라이언트 |
| `src/features/*/queries/` | 신규 — 비즈니스 로직 추출 |
| `src/features/*/mutations/` | 신규 — 비즈니스 로직 추출 |
| `src/app/api/**` | 신규/수정 — REST Route Handler (~50개) |
| `src/features/*/components/*.tsx` | 수정 — Orval 클라이언트 와이어링 (45개) |
| `src/features/*/actions/*.ts` | 삭제 (auth 3개 제외) |

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| bun + @react-pdf/renderer 호환성 | serverExternalPackages로 Node.js 서버에서 실행, Phase 1에서 즉시 검증 |
| Orval Zod v4 호환성 | Orval은 Zod v3 기본, v4 호환 여부 Phase 3에서 확인. 미호환 시 zod-to-json-schema 브릿지 |
| 45개 컴포넌트 일괄 교체 위험 | dual-phase: 기존 액션 유지하며 점진 교체, Phase 7에서 최종 삭제 |
| multipart 업로드 (images, CSV) | Orval이 multipart/form-data OpenAPI 스펙 지원. 생성 클라이언트가 FormData 자동 처리 |
