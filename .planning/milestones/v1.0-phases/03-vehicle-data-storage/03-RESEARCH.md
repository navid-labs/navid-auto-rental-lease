# Phase 3: Vehicle Data & Storage - Research

**Researched:** 2026-03-09
**Domain:** Vehicle CRUD, Image Upload (Supabase Storage), License Plate Lookup API, State Machine
**Confidence:** HIGH

## Summary

Phase 3 covers vehicle registration (CRUD), image upload to Supabase Storage, license plate auto-lookup, and vehicle status state machine. The project already has Prisma models (Vehicle, VehicleImage, Brand, CarModel, Generation, Trim) and enums (VehicleStatus) ready. The established pattern uses Server Actions with Zod validation and React Hook Form.

Key technical decisions: use Supabase Storage with a public bucket for vehicle images, `browser-image-compression` for client-side resize before upload, `@dnd-kit/core` + `@dnd-kit/sortable` for drag-to-reorder image thumbnails, and a typed state machine map for vehicle status transitions. The Korean government license plate API (data.go.kr) has availability concerns (service paused until system stabilization), so the implementation should use a pluggable adapter pattern with mock data for development and easy provider switching.

**Primary recommendation:** Build vehicle features as Server Actions with the admin Supabase client for Storage uploads (bypassing RLS), use client-side image compression before upload, and implement the state machine as a simple TypeScript map of allowed transitions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Multi-step wizard: Step 1 (License plate lookup or Brand/Model/Trim cascade) -> Step 2 (Details) -> Step 3 (Photos)
- Plate-first entry with "Enter manually" fallback to Brand->Model->Generation->Trim cascade
- Progressive disclosure for cascade selects
- Same form shared between dealer and admin, role-aware
- Drag-and-drop zone + click to browse for image upload
- Max 10 photos per vehicle, drag to reorder, first image = primary/thumbnail
- Supabase Storage public bucket for vehicle images
- Table view for dealer/admin vehicle list with thumbnail, brand/model, year, mileage, price, status badge, actions
- Basic status filter (tabs or dropdown)
- Soft delete via HIDDEN status with confirmation dialog, admin can restore
- Strict state machine with explicit allowed transitions only
- Permissions: dealer changes own vehicles only, admin can change any including force-transitions
- Confirmation dialog with optional note field for status changes, notes stored for audit
- Color-coded badges: green (Available), yellow (Reserved), blue (Rented/Leased), orange (Maintenance), gray (Hidden)

### Claude's Discretion
- License plate API provider selection (data.go.kr vs commercial)
- Image compression/resize approach before upload
- Exact wizard progress bar design
- Loading states and error handling throughout forms
- Vehicle detail page layout (info sections, photo gallery placement)
- RLS policy specifics for vehicle CRUD
- Accepted image file types and max file size per image

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VEHI-01 | Dealer can register vehicle with details (make, model, year, mileage, color, price) | Multi-step wizard form with Server Actions, Zod validation, cascade selects for Brand/Model/Generation/Trim |
| VEHI-02 | Dealer can upload multiple vehicle images | Supabase Storage public bucket, browser-image-compression for client-side resize, drag-and-drop with @dnd-kit/sortable |
| VEHI-03 | Dealer can edit/delete own vehicle listings | Server Actions with ownership check (dealerId === currentUser.id), soft delete to HIDDEN status |
| VEHI-04 | Admin can register/edit/delete vehicles (self-operated inventory) | Same form as dealer, role-aware logic, admin bypasses ownership checks |
| VEHI-05 | Vehicle status transitions (available -> reserved -> rented -> maintenance) | TypeScript state machine map with allowed transitions, permission-based enforcement |
| VEHI-06 | License plate auto-lookup via API with manual input fallback | Pluggable adapter pattern, mock provider for dev, data.go.kr or commercial provider for production |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.x | Drag-and-drop framework | Modern, accessible, tree-shakeable React DnD toolkit |
| @dnd-kit/sortable | ^10.x | Sortable preset for dnd-kit | Built-in sortable grid/list with useSortable hook |
| @dnd-kit/utilities | ^3.x | CSS transform utilities | Required for smooth drag animations |
| browser-image-compression | ^2.x | Client-side image compression | Compress/resize images before upload, Web Worker support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.98.0 | Storage API client | Already installed, use for bucket upload/download |
| react-hook-form | ^7.71.2 | Form state management | Already installed, multi-step wizard form |
| zod | ^4.3.6 | Validation schemas | Already installed (note: project uses Zod 4 in package.json despite STATE.md mentioning 3.x) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/sortable | react-beautiful-dnd | react-beautiful-dnd is unmaintained, dnd-kit is the modern replacement |
| browser-image-compression | compressorjs | browser-image-compression has Web Worker support for non-blocking compression |
| Server Action uploads | Direct client upload | Server Action approach uses admin client to bypass Storage RLS, simpler policy setup |

**Installation:**
```bash
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities browser-image-compression
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/vehicles/
├── actions/
│   ├── create-vehicle.ts      # Server Action: create vehicle + images
│   ├── update-vehicle.ts      # Server Action: update vehicle details
│   ├── delete-vehicle.ts      # Server Action: soft delete (set HIDDEN)
│   ├── restore-vehicle.ts     # Server Action: restore from HIDDEN (admin)
│   ├── update-status.ts       # Server Action: status transitions
│   ├── upload-images.ts       # Server Action: upload to Supabase Storage
│   ├── delete-image.ts        # Server Action: remove image from Storage + DB
│   └── lookup-plate.ts        # Server Action: license plate API lookup
├── components/
│   ├── vehicle-wizard.tsx     # Multi-step wizard container ('use client')
│   ├── step-plate-lookup.tsx  # Step 1: plate lookup or manual cascade
│   ├── step-details.tsx       # Step 2: year, mileage, color, price
│   ├── step-photos.tsx        # Step 3: image upload with drag-reorder
│   ├── cascade-select.tsx     # Brand -> Model -> Generation -> Trim
│   ├── image-dropzone.tsx     # Drag-and-drop upload zone
│   ├── sortable-image-grid.tsx # dnd-kit sortable thumbnail grid
│   ├── vehicle-table.tsx      # Table view for vehicle list
│   ├── vehicle-row.tsx        # Single row in vehicle table
│   ├── status-badge.tsx       # Color-coded status badge (shared)
│   ├── status-change-dialog.tsx # Confirmation dialog with note
│   └── vehicle-detail-view.tsx # Read-only detail page layout
├── schemas/
│   ├── vehicle.ts             # Zod schemas for vehicle forms
│   └── status.ts              # Status transition validation
├── utils/
│   ├── status-machine.ts      # State machine: allowed transitions map
│   ├── image-compression.ts   # browser-image-compression wrapper
│   └── plate-adapter.ts       # License plate API adapter interface
└── types/
    └── index.ts               # Vehicle-specific types
```

### Pattern 1: Server Action Upload via Admin Client
**What:** Upload images through a Server Action using the Supabase admin client (service role key), bypassing Storage RLS entirely.
**When to use:** When the upload logic requires server-side validation (auth check, file count limits, ownership verification) before storing.
**Example:**
```typescript
// src/features/vehicles/actions/upload-images.ts
'use server'

import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/db/prisma'

export async function uploadVehicleImage(vehicleId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'DEALER' && user.role !== 'ADMIN')) {
    return { error: '권한이 없습니다.' }
  }

  // Ownership check for dealers
  if (user.role === 'DEALER') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { dealerId: true },
    })
    if (vehicle?.dealerId !== user.id) {
      return { error: '본인의 차량만 수정할 수 있습니다.' }
    }
  }

  // Check image count limit
  const existingCount = await prisma.vehicleImage.count({
    where: { vehicleId },
  })
  if (existingCount >= 10) {
    return { error: '최대 10장까지 업로드할 수 있습니다.' }
  }

  const file = formData.get('file') as File
  if (!file) return { error: '파일을 선택해주세요.' }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop()
  const filePath = `vehicles/${vehicleId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: '이미지 업로드에 실패했습니다.' }
  }

  const { data: urlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(filePath)

  await prisma.vehicleImage.create({
    data: {
      vehicleId,
      url: urlData.publicUrl,
      order: existingCount,
      isPrimary: existingCount === 0,
    },
  })

  return { success: true, url: urlData.publicUrl }
}
```

### Pattern 2: Vehicle Status State Machine
**What:** A TypeScript map defining allowed status transitions with role-based permissions.
**When to use:** Every status change must go through this validation.
**Example:**
```typescript
// src/features/vehicles/utils/status-machine.ts
import { VehicleStatus } from '@prisma/client'

type StatusTransition = {
  to: VehicleStatus[]
  roles: ('DEALER' | 'ADMIN')[]
}

export const VEHICLE_STATUS_TRANSITIONS: Record<VehicleStatus, StatusTransition> = {
  AVAILABLE: {
    to: ['RESERVED', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  RESERVED: {
    to: ['AVAILABLE', 'RENTED', 'LEASED', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  RENTED: {
    to: ['AVAILABLE', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  LEASED: {
    to: ['AVAILABLE', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  MAINTENANCE: {
    to: ['AVAILABLE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  HIDDEN: {
    to: ['AVAILABLE'],
    roles: ['ADMIN'], // Only admin can restore
  },
}

export function canTransition(
  from: VehicleStatus,
  to: VehicleStatus,
  role: 'DEALER' | 'ADMIN'
): boolean {
  if (role === 'ADMIN') return true // Admin can force any transition
  const transition = VEHICLE_STATUS_TRANSITIONS[from]
  return transition.to.includes(to) && transition.roles.includes(role)
}
```

### Pattern 3: Multi-Step Wizard with Preserved State
**What:** A client component managing wizard steps with React state, preserving form data across step navigation.
**When to use:** Vehicle registration form.
**Example:**
```typescript
// src/features/vehicles/components/vehicle-wizard.tsx
'use client'

import { useState } from 'react'

type WizardStep = 1 | 2 | 3
type VehicleFormData = {
  // Step 1
  licensePlate?: string
  brandId?: string
  modelId?: string
  generationId?: string
  trimId?: string
  // Step 2
  year?: number
  mileage?: number
  color?: string
  price?: number
  description?: string
  // Step 3 (images handled separately)
}

export function VehicleWizard({ mode }: { mode: 'create' | 'edit' }) {
  const [step, setStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<VehicleFormData>({})

  const updateFormData = (partial: Partial<VehicleFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && <StepPlateLookup data={formData} onUpdate={updateFormData} onNext={() => setStep(2)} />}
      {step === 2 && <StepDetails data={formData} onUpdate={updateFormData} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <StepPhotos vehicleData={formData} onBack={() => setStep(2)} />}
    </div>
  )
}
```

### Pattern 4: Cascade Select with Progressive Disclosure
**What:** Brand selection triggers Model loading, Model triggers Generation, Generation triggers Trim. Each subsequent select appears only after the parent is selected.
**When to use:** Manual vehicle entry (when plate lookup is skipped or unavailable).
**Example:**
```typescript
// Fetch cascade data via server actions or API routes
// Each level fetches filtered by parent ID
async function getModelsByBrand(brandId: string) {
  return prisma.carModel.findMany({
    where: { brandId },
    orderBy: { name: 'asc' },
  })
}
```

### Anti-Patterns to Avoid
- **Direct client-to-Storage upload without validation:** Always validate auth, ownership, and file limits server-side before allowing uploads
- **Storing file blobs in the database:** Use Supabase Storage for files, store only URLs in Prisma
- **Hardcoding status transitions:** Use a typed map so transitions are declarative and testable
- **Uploading full-resolution images:** Always compress client-side first to reduce bandwidth and storage costs
- **Sequential image uploads:** Upload multiple images with Promise.all for parallel processing

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder | Custom drag handlers with mouse/touch events | @dnd-kit/sortable | Accessibility (keyboard support), touch device support, smooth animations |
| Image compression | Canvas-based manual resize | browser-image-compression | Handles EXIF orientation, Web Worker threading, quality control |
| File upload UI | Custom drag-over detection | HTML5 drag events + input[type=file] | Native browser APIs are sufficient; dnd-kit is for reorder only |
| Status badge styling | Inline conditional classes | Shared StatusBadge component with CVA variants | Consistency across all pages (dealer, admin, public) |

**Key insight:** The image upload UX has two separate drag-and-drop concerns: (1) dropping files to upload (native HTML5 drag events), and (2) reordering uploaded thumbnails (dnd-kit). These must not be confused.

## Common Pitfalls

### Pitfall 1: Confusing File Drop and Reorder Drag
**What goes wrong:** Using dnd-kit for both file upload and image reordering creates conflicts and confusing UX.
**Why it happens:** Both involve "drag and drop" but they are fundamentally different operations.
**How to avoid:** File upload uses native HTML5 `onDragOver`/`onDrop` events on a dropzone div. Image reorder uses `@dnd-kit/sortable` on the thumbnail grid. These are separate components.
**Warning signs:** DndContext interfering with file drops, or files triggering sort events.

### Pitfall 2: Supabase Storage File Size Limits
**What goes wrong:** Standard upload method fails silently or errors on files larger than 6MB.
**Why it happens:** Supabase standard uploads are designed for files up to 6MB. Larger files need TUS resumable upload.
**How to avoid:** Compress images client-side to under 5MB before upload. Set bucket `fileSizeLimit: '5MB'`. Validate file size before attempting upload.
**Warning signs:** Upload succeeds locally but fails in production with timeout errors.

### Pitfall 3: Missing Ownership Checks in Server Actions
**What goes wrong:** Dealer A can edit/delete Dealer B's vehicles.
**Why it happens:** Server Action only checks if user is a DEALER but doesn't verify `vehicle.dealerId === user.id`.
**How to avoid:** Every vehicle mutation Server Action must include ownership verification for dealer role. Admin role bypasses this check.
**Warning signs:** No test covering cross-dealer access.

### Pitfall 4: Lost Form State on Step Navigation
**What goes wrong:** User fills Step 2 details, goes back to Step 1, returns to Step 2, and data is gone.
**Why it happens:** Each step component re-mounts and initializes fresh state.
**How to avoid:** Lift all form state to the wizard container component. Pass data down as props. Each step is a controlled form reading from parent state.
**Warning signs:** Using separate `useForm()` instances in each step without shared state.

### Pitfall 5: Race Conditions in Cascade Selects
**What goes wrong:** User rapidly switches brands and gets models from the wrong brand.
**Why it happens:** Previous fetch completes after a newer fetch, overwriting correct data.
**How to avoid:** Use `AbortController` to cancel previous fetches, or use React 19 `useTransition` with server actions. Clear child selects when parent changes.
**Warning signs:** Stale options appearing briefly then updating.

### Pitfall 6: Image Order Not Persisted
**What goes wrong:** User reorders images via drag-and-drop, but after page reload order reverts.
**Why it happens:** Reorder state is only in client state, not saved to database.
**How to avoid:** After drag-end, call a Server Action to update `VehicleImage.order` for all affected images. Debounce if needed.
**Warning signs:** Images appear shuffled after navigation.

## Code Examples

### Client-Side Image Compression Before Upload
```typescript
// src/features/vehicles/utils/image-compression.ts
import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,           // Max 2MB after compression
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: true,
  fileType: 'image/webp', // Convert to WebP for smaller size
}

export async function compressImage(file: File): Promise<File> {
  // Skip compression for small files
  if (file.size < 500 * 1024) return file // Under 500KB, skip

  const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
  return compressed
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
export const MAX_FILE_SIZE_MB = 10 // Before compression
export const MAX_IMAGES_PER_VEHICLE = 10
```

### Sortable Image Grid with dnd-kit
```typescript
// src/features/vehicles/components/sortable-image-grid.tsx
'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ImageItem = { id: string; url: string; order: number }

function SortableImage({ image, onDelete }: { image: ImageItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="relative aspect-[4/3] rounded-lg overflow-hidden border group">
      <img src={image.url} alt="" className="w-full h-full object-cover" />
      <button onClick={() => onDelete(image.id)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
        X
      </button>
      {image.order === 0 && (
        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
          대표
        </span>
      )}
    </div>
  )
}

export function SortableImageGrid({
  images, onReorder, onDelete
}: {
  images: ImageItem[]
  onReorder: (images: ImageItem[]) => void
  onDelete: (id: string) => void
}) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex(i => i.id === active.id)
    const newIndex = images.findIndex(i => i.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)
      .map((img, idx) => ({ ...img, order: idx }))
    onReorder(reordered)
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {images.map(image => (
            <SortableImage key={image.id} image={image} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

### Status Badge Component (Shared)
```typescript
// src/features/vehicles/components/status-badge.tsx
import { cva } from 'class-variance-authority'
import { VehicleStatus } from '@prisma/client'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
  {
    variants: {
      status: {
        AVAILABLE: 'bg-green-100 text-green-700',
        RESERVED: 'bg-yellow-100 text-yellow-700',
        RENTED: 'bg-blue-100 text-blue-700',
        LEASED: 'bg-blue-100 text-blue-700',
        MAINTENANCE: 'bg-orange-100 text-orange-700',
        HIDDEN: 'bg-gray-100 text-gray-500',
      },
    },
  }
)

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: '판매 가능',
  RESERVED: '예약됨',
  RENTED: '렌탈 중',
  LEASED: '리스 중',
  MAINTENANCE: '정비 중',
  HIDDEN: '숨김',
}

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span className={badgeVariants({ status })}>
      {STATUS_LABELS[status]}
    </span>
  )
}
```

### License Plate Adapter (Pluggable)
```typescript
// src/features/vehicles/utils/plate-adapter.ts

export type PlateResult = {
  brand?: string
  model?: string
  year?: number
  fuelType?: string
  engineCC?: number
  color?: string
  transmission?: string
}

export interface PlateProvider {
  lookup(plateNumber: string, ownerName?: string): Promise<PlateResult | null>
}

// Mock provider for development
export class MockPlateProvider implements PlateProvider {
  async lookup(plateNumber: string): Promise<PlateResult | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Return mock data for testing
    if (plateNumber.match(/^\d{2,3}[가-힣]\d{4}$/)) {
      return {
        brand: '현대',
        model: '그랜저',
        year: 2023,
        fuelType: 'GASOLINE',
        engineCC: 2497,
        color: '흰색',
        transmission: 'AUTOMATIC',
      }
    }
    return null
  }
}

// Production: implement DataGoKrProvider or HyphenProvider
// when API access is secured
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022+ | react-beautiful-dnd unmaintained, dnd-kit is tree-shakeable and accessible |
| Server-side image resize | Client-side compression + CDN transforms | 2024+ | Reduces server load, faster uploads |
| Direct client Storage upload | Server Action with admin client | 2024+ (Next.js 14+) | Better security, server-side validation before storage |

**Deprecated/outdated:**
- react-beautiful-dnd: Atlassian archived the project, no React 18/19 support
- react-dnd: Works but heavier and more complex than dnd-kit for simple sortable grids

## License Plate API Status (Claude's Discretion Resolution)

### Recommendation: Mock Provider for v1, Production Provider Deferred

**Government API (data.go.kr / car365.go.kr):**
- Status: Service paused pending next-gen system stabilization (expected availability after August 2025, but current status unclear for March 2026)
- Requires: data.go.kr account registration, API key approval (1-3 business days)
- Input: Vehicle registration number + owner name (requires owner consent)
- Cost: Free (public data)
- Concern: Owner name requirement limits usability for plate-only lookup

**Commercial APIs:**
| Provider | Cost | Notes |
|----------|------|-------|
| hyphen.im | Prepaid credits (TR Slim) | Free testing: 100 calls/day, 100/month |
| apick.app | 80 points/call | Service discontinuation announced |
| dataapi.co.kr | Unknown | Scraping-based, reliability concerns |

**Decision:** Implement a pluggable `PlateProvider` interface. Ship v1 with `MockPlateProvider` that returns realistic test data for known plate patterns. The UI and form flow will be fully functional. A real provider can be swapped in with zero form changes by implementing the `PlateProvider` interface and updating the factory function.

## Supabase Storage Setup

### Bucket Configuration
```sql
-- Create public bucket for vehicle images (run via Supabase dashboard or migration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);
```

### Storage RLS (Simplified via Admin Client)
Since uploads go through Server Actions using the admin client (service role key), no Storage RLS policies are needed for uploads. For public read access, the bucket's `public: true` setting handles it. This is the simplest and most secure approach for this use case.

### File Path Convention
```
vehicle-images/
  vehicles/{vehicleId}/{timestamp}.{ext}
```

### Image Compression Settings
| Setting | Value | Rationale |
|---------|-------|-----------|
| maxSizeMB | 2 | Good quality for car photos while keeping upload fast |
| maxWidthOrHeight | 1920 | Sufficient for full-screen display on most devices |
| Output format | WebP | 25-35% smaller than JPEG at similar quality |
| Accepted types | JPEG, PNG, WebP, HEIC | HEIC for iPhone photos |
| Max raw file size | 10MB | Before compression; reject anything larger |
| Max per vehicle | 10 | Per context decision |

## Schema Additions Needed

The Vehicle model needs a `statusNote` field for audit trail on status changes:

```prisma
model VehicleStatusLog {
  id        String        @id @default(uuid()) @db.Uuid
  vehicleId String        @map("vehicle_id") @db.Uuid
  fromStatus VehicleStatus @map("from_status")
  toStatus  VehicleStatus @map("to_status")
  note      String?
  changedBy String        @map("changed_by") @db.Uuid
  createdAt DateTime      @default(now()) @map("created_at")

  vehicle   Vehicle       @relation(fields: [vehicleId], references: [id])
  profile   Profile       @relation(fields: [changedBy], references: [id])

  @@map("vehicle_status_logs")
}
```

This requires adding relations to Vehicle and Profile models.

## Open Questions

1. **Zod version discrepancy**
   - What we know: `package.json` shows `zod: ^4.3.6`, but STATE.md says "Zod 3.x for compatibility"
   - What's unclear: Whether @hookform/resolvers v5.2.2 now supports Zod 4
   - Recommendation: Check actual installed version with `yarn list zod` and test form validation before building

2. **Supabase Storage Pro Plan for image transformations**
   - What we know: On-the-fly image resizing (width/height/format) requires Supabase Pro Plan ($25/mo)
   - What's unclear: Whether the project has Pro Plan
   - Recommendation: Use client-side compression for now. If Pro Plan is available, leverage `transform` option in `getPublicUrl()` for thumbnails

3. **License plate API production provider**
   - What we know: Government API may be available now (post-August 2025), but requires registration
   - What's unclear: Current availability status, approval timeline
   - Recommendation: Ship with mock provider, register for data.go.kr API key in parallel

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VEHI-01 | Vehicle creation with full details | unit | `yarn vitest run src/features/vehicles/actions/create-vehicle.test.ts -t "create vehicle"` | No - Wave 0 |
| VEHI-01 | Vehicle form Zod schema validation | unit | `yarn vitest run src/features/vehicles/schemas/vehicle.test.ts` | No - Wave 0 |
| VEHI-02 | Image upload to Storage | unit | `yarn vitest run src/features/vehicles/actions/upload-images.test.ts` | No - Wave 0 |
| VEHI-03 | Dealer can edit own, cannot edit others | unit | `yarn vitest run src/features/vehicles/actions/update-vehicle.test.ts -t "ownership"` | No - Wave 0 |
| VEHI-03 | Soft delete sets HIDDEN status | unit | `yarn vitest run src/features/vehicles/actions/delete-vehicle.test.ts` | No - Wave 0 |
| VEHI-04 | Admin can manage any vehicle | unit | `yarn vitest run src/features/vehicles/actions/create-vehicle.test.ts -t "admin"` | No - Wave 0 |
| VEHI-05 | Valid status transitions allowed | unit | `yarn vitest run src/features/vehicles/utils/status-machine.test.ts -t "valid"` | No - Wave 0 |
| VEHI-05 | Invalid status transitions rejected | unit | `yarn vitest run src/features/vehicles/utils/status-machine.test.ts -t "invalid"` | No - Wave 0 |
| VEHI-06 | Plate lookup returns vehicle data | unit | `yarn vitest run src/features/vehicles/utils/plate-adapter.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check && yarn lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/vehicles/utils/status-machine.test.ts` -- covers VEHI-05
- [ ] `src/features/vehicles/schemas/vehicle.test.ts` -- covers VEHI-01 validation
- [ ] `src/features/vehicles/utils/plate-adapter.test.ts` -- covers VEHI-06
- [ ] `src/features/vehicles/actions/create-vehicle.test.ts` -- covers VEHI-01, VEHI-04
- [ ] `src/features/vehicles/actions/upload-images.test.ts` -- covers VEHI-02
- [ ] `src/features/vehicles/actions/update-vehicle.test.ts` -- covers VEHI-03
- [ ] `src/features/vehicles/actions/delete-vehicle.test.ts` -- covers VEHI-03

## Sources

### Primary (HIGH confidence)
- Supabase Storage official docs - bucket creation, upload API, access control, getPublicUrl
- @dnd-kit official docs (dndkit.com) - sortable preset, SortableContext, useSortable hook
- Prisma schema in project - Vehicle, VehicleImage, Brand/CarModel/Generation/Trim models
- Existing auth Server Actions in project - established pattern for validation and auth checks

### Secondary (MEDIUM confidence)
- [Supabase Storage Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) - 6MB limit for standard uploads
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS policy patterns
- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) - Pro Plan requirement
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) - compression options and API
- [dnd-kit Sortable](https://docs.dndkit.com/presets/sortable) - API reference

### Tertiary (LOW confidence)
- [data.go.kr vehicle API](https://www.data.go.kr/data/15071233/openapi.do) - Government API availability status unclear
- [hyphen.im vehicle API](https://hyphen.im/product-api/view?seq=8) - Pricing/endpoint details incomplete
- [apick.app vehicle API](https://apick.app/dev_guide/get_car_info) - Service discontinuation announced

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - dnd-kit and browser-image-compression are well-established, Supabase Storage is documented
- Architecture: HIGH - follows established Server Action patterns from Phase 2, Prisma models already exist
- Pitfalls: HIGH - common patterns for file upload and DnD well-documented in community
- License plate API: LOW - government API availability unclear, commercial options limited

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, 30 days)
