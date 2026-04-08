# Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundation for the 차용(Chayong) platform by cleaning old code, setting up the new data model, design system, shared components, and API structure.

**Architecture:** Clean rebuild on existing Next.js 15 repo. Strip old frontend, replace Prisma schema with 차용 data model (Listing, ChatRoom, ChatMessage, ConsultationLead, EscrowPayment, Notification, Favorite), set up 토스-style design system (#3182F6 primary), build shared layout and UI components, and scaffold base API routes.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Prisma 6, PostgreSQL (Supabase), Tailwind CSS 4, shadcn/ui, Supabase Auth/Realtime/Storage, bun

**Spec:** `docs/superpowers/specs/2026-04-08-chayong-platform-design.md`

**Subsequent Plans:** Phase 1~8 (HOME, LIST, DETAIL, SELL, CHAT, PAYMENT, MY, ADMIN) will be separate plan documents, executed in parallel after this plan completes.

---

## File Structure

### Files to Delete
```
src/features/          (entire directory — all old feature modules)
src/app/(public)/      (all old public pages)
src/app/(auth)/        (old auth pages)
src/app/(protected)/   (old protected pages)
src/app/admin/         (old admin pages)
src/app/dealer/        (old dealer pages)
src/app/api/           (all old API routes)
src/components/layout/ (old layout components)
src/lib/finance/       (old finance calculations)
src/lib/kotsa/         (KOTSA integration — not needed)
src/lib/ekyc/          (eKYC — defer)
src/lib/api/           (OpenAPI client — not needed)
src/types/index.ts     (old type exports)
```

### Files to Modify
```
prisma/schema.prisma                → New 차용 data model
src/app/globals.css                 → 차용 design tokens
src/app/layout.tsx                  → 차용 root layout
next.config.ts                      → CSP headers for TossPayments
```

### Files to Create
```
src/types/index.ts                  → Prisma type re-exports
src/lib/finance/calculations.ts     → Cost calculation utils
src/lib/finance/calculations.test.ts
src/lib/chat/contact-filter.ts      → Phone/email pattern filter
src/lib/chat/contact-filter.test.ts
src/components/layout/header.tsx     → Main navigation header
src/components/layout/footer.tsx     → Site footer
src/components/layout/mobile-nav.tsx → Mobile bottom/drawer nav
src/components/ui/vehicle-card.tsx   → Listing card component
src/components/ui/price-display.tsx  → Monthly payment display
src/components/ui/trust-badge.tsx    → 안심마크 badge
src/components/ui/filter-bar.tsx     → Filter controls
src/components/ui/step-indicator.tsx → Multi-step progress
src/app/(public)/page.tsx            → Home placeholder
src/app/api/listings/route.ts        → GET (list) + POST (create)
src/app/api/listings/[id]/route.ts   → GET (detail) + PUT (update)
```

---

### Task 1: Clean Existing Frontend Code

**Files:**
- Delete: `src/features/`, `src/app/(public)/`, `src/app/(auth)/`, `src/app/(protected)/`, `src/app/admin/`, `src/app/dealer/`, `src/app/api/`, `src/components/layout/`, `src/lib/finance/`, `src/lib/kotsa/`, `src/lib/ekyc/`, `src/lib/api/`, `src/types/index.ts`

- [ ] **Step 1: Delete old feature modules and pages**

```bash
rm -rf src/features
rm -rf src/app/\(public\)
rm -rf src/app/\(auth\)
rm -rf src/app/\(protected\)
rm -rf src/app/admin
rm -rf src/app/dealer
rm -rf src/app/api
```

- [ ] **Step 2: Delete old layout components and unused libs**

```bash
rm -rf src/components/layout
rm -rf src/lib/finance
rm -rf src/lib/kotsa
rm -rf src/lib/ekyc
rm -rf src/lib/api
rm -f src/types/index.ts
rm -f src/proxy.ts
```

- [ ] **Step 3: Create placeholder page so the app still boots**

Create `src/app/(public)/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">차용 — Coming Soon</h1>
    </div>
  );
}
```

- [ ] **Step 4: Verify the app still starts**

Run: `bun dev`
Expected: App boots at http://localhost:3000, shows "차용 — Coming Soon"

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean old frontend code for 차용 rebuild"
```

---

### Task 2: Prisma Schema — New Data Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace schema with 차용 data model**

Write the complete new `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum UserRole {
  BUYER
  SELLER
  DEALER
  ADMIN
}

enum ListingType {
  TRANSFER     // 승계
  USED_LEASE   // 중고 리스
  USED_RENTAL  // 중고 렌트
}

enum ListingStatus {
  DRAFT       // 작성중
  PENDING     // 승인 대기
  ACTIVE      // 게시중
  RESERVED    // 예약중
  SOLD        // 거래완료
  HIDDEN      // 숨김
}

enum MessageType {
  TEXT
  IMAGE
  SYSTEM
}

enum LeadStatus {
  WAITING     // 대기
  CONSULTING  // 상담중
  CONTRACTED  // 계약완료
  CANCELED    // 취소
}

enum EscrowStatus {
  PENDING     // 결제 대기
  PAID        // 입금 완료
  RELEASED    // 판매자 지급 완료
  REFUNDED    // 환불 완료
  DISPUTED    // 분쟁중
}

enum NotificationType {
  CHAT_MESSAGE
  ESCROW_STATUS
  LEAD_ASSIGNED
  LISTING_APPROVED
  LISTING_LIKED
}

// ─── Models ──────────────────────────────────────────────

model Profile {
  id        String   @id @db.Uuid
  email     String   @unique
  name      String?
  phone     String?
  role      UserRole @default(BUYER)
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  sellerListings  Listing[]           @relation("SellerListings")
  buyerChats      ChatRoom[]          @relation("BuyerChats")
  sellerChats     ChatRoom[]          @relation("SellerChats")
  sentMessages    ChatMessage[]       @relation("SentMessages")
  userLeads       ConsultationLead[]  @relation("UserLeads")
  assignedLeads   ConsultationLead[]  @relation("AssignedLeads")
  buyerPayments   EscrowPayment[]     @relation("BuyerPayments")
  sellerPayments  EscrowPayment[]     @relation("SellerPayments")
  favorites       Favorite[]          @relation("UserFavorites")
  notifications   Notification[]      @relation("UserNotifications")

  @@map("profiles")
}

model Listing {
  id              String        @id @default(uuid()) @db.Uuid
  sellerId        String        @map("seller_id") @db.Uuid
  type            ListingType
  status          ListingStatus @default(DRAFT)

  // 차량 기본 정보 (Step 2에서 입력, Step 1에선 미입력 가능)
  brand           String?
  model           String?
  year            Int?
  trim            String?
  fuelType        String?       @map("fuel_type")
  transmission    String?
  seatingCapacity Int?          @map("seating_capacity")
  mileage         Int?
  color           String?
  plateNumber     String?       @map("plate_number")

  // 금융 정보 (핵심 — Step 1 필수)
  monthlyPayment  Int           @map("monthly_payment")
  initialCost     Int           @default(0) @map("initial_cost")
  remainingMonths Int           @map("remaining_months")
  totalPrice      Int?          @map("total_price")
  remainingBalance Int?         @map("remaining_balance")
  capitalCompany  String?       @map("capital_company")
  transferFee     Int           @default(0) @map("transfer_fee")

  // 통계
  viewCount       Int           @default(0) @map("view_count")
  favoriteCount   Int           @default(0) @map("favorite_count")

  // 상태
  isVerified      Boolean       @default(false) @map("is_verified")
  accidentFree    Boolean?      @map("accident_free")
  description     String?

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  seller          Profile       @relation("SellerListings", fields: [sellerId], references: [id])
  images          ListingImage[]
  chatRooms       ChatRoom[]
  leads           ConsultationLead[]
  escrowPayments  EscrowPayment[]
  favorites       Favorite[]

  @@index([type, status])
  @@index([sellerId, status])
  @@index([monthlyPayment])
  @@index([status, isVerified])
  @@map("listings")
}

model ListingImage {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  url       String
  order     Int      @default(0)
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at")

  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@map("listing_images")
}

model ChatRoom {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  buyerId   String   @map("buyer_id") @db.Uuid
  sellerId  String   @map("seller_id") @db.Uuid
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  listing   Listing      @relation(fields: [listingId], references: [id])
  buyer     Profile      @relation("BuyerChats", fields: [buyerId], references: [id])
  seller    Profile      @relation("SellerChats", fields: [sellerId], references: [id])
  messages  ChatMessage[]

  @@unique([listingId, buyerId])
  @@index([buyerId])
  @@index([sellerId])
  @@map("chat_rooms")
}

model ChatMessage {
  id         String      @id @default(uuid()) @db.Uuid
  chatRoomId String      @map("chat_room_id") @db.Uuid
  senderId   String      @map("sender_id") @db.Uuid
  type       MessageType @default(TEXT)
  content    String
  imageUrl   String?     @map("image_url")
  isRead     Boolean     @default(false) @map("is_read")
  createdAt  DateTime    @default(now()) @map("created_at")

  chatRoom   ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  sender     Profile  @relation("SentMessages", fields: [senderId], references: [id])

  @@index([chatRoomId, createdAt])
  @@map("chat_messages")
}

model ConsultationLead {
  id         String      @id @default(uuid()) @db.Uuid
  userId     String      @map("user_id") @db.Uuid
  listingId  String      @map("listing_id") @db.Uuid
  type       ListingType
  status     LeadStatus  @default(WAITING)
  assignedTo String?     @map("assigned_to") @db.Uuid
  note       String?
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  user       Profile     @relation("UserLeads", fields: [userId], references: [id])
  listing    Listing     @relation(fields: [listingId], references: [id])
  assignee   Profile?    @relation("AssignedLeads", fields: [assignedTo], references: [id])

  @@index([status])
  @@index([assignedTo, status])
  @@map("consultation_leads")
}

model EscrowPayment {
  id            String       @id @default(uuid()) @db.Uuid
  listingId     String       @map("listing_id") @db.Uuid
  buyerId       String       @map("buyer_id") @db.Uuid
  sellerId      String       @map("seller_id") @db.Uuid
  depositAmount Int          @map("deposit_amount")
  transferFee   Int          @map("transfer_fee")
  totalAmount   Int          @map("total_amount")
  status        EscrowStatus @default(PENDING)
  paidAt        DateTime?    @map("paid_at")
  releasedAt    DateTime?    @map("released_at")
  refundedAt    DateTime?    @map("refunded_at")
  pgOrderId     String?      @map("pg_order_id")
  pgPaymentKey  String?      @map("pg_payment_key")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  listing       Listing      @relation(fields: [listingId], references: [id])
  buyer         Profile      @relation("BuyerPayments", fields: [buyerId], references: [id])
  seller        Profile      @relation("SellerPayments", fields: [sellerId], references: [id])

  @@index([listingId])
  @@index([buyerId])
  @@index([sellerId])
  @@map("escrow_payments")
}

model Favorite {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user      Profile  @relation("UserFavorites", fields: [userId], references: [id])
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@map("favorites")
}

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String
  message   String
  linkUrl   String?          @map("link_url")
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  user      Profile          @relation("UserNotifications", fields: [userId], references: [id])

  @@index([userId, isRead])
  @@map("notifications")
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `bun run db:generate`
Expected: "Generated Prisma Client"

- [ ] **Step 3: Push schema to database**

Run: `bun run db:push`
Expected: Schema synced (may drop old tables — this is expected for clean rebuild)

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): replace data model with 차용 listing/chat/escrow/lead models"
```

---

### Task 3: Design System — 차용 Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with 차용 design tokens**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");

@custom-variant dark (&:is(.dark *));

:root {
  /* ── 차용 Brand Colors ── */
  --color-primary: #3182F6;
  --color-primary-hover: #1B6CF2;
  --color-primary-light: #EBF2FF;

  --color-success: #00C471;
  --color-danger: #F04452;
  --color-warning: #FF9500;

  /* ── Surface ── */
  --color-bg: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-surface-hover: #F3F4F6;

  /* ── Text ── */
  --color-text: #111111;
  --color-text-sub: #687684;
  --color-text-caption: #8B95A1;
  --color-text-price: #3182F6;

  /* ── Border ── */
  --color-divider: #E5E8EB;
  --color-border: #D1D5DB;

  /* ── shadcn/ui Token Overrides ── */
  --radius: 0.625rem;
  --background: 0 0% 100%;
  --foreground: 0 0% 6.7%;
  --card: 210 20% 98%;
  --card-foreground: 0 0% 6.7%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 6.7%;
  --primary: 214 93% 58%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 0 0% 6.7%;
  --muted: 220 14% 96%;
  --muted-foreground: 210 8% 47%;
  --accent: 214 93% 58%;
  --accent-foreground: 0 0% 100%;
  --destructive: 354 70% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 87%;
  --input: 220 13% 87%;
  --ring: 214 93% 58%;

  /* ── Chart Colors ── */
  --chart-1: 214 93% 58%;
  --chart-2: 160 84% 39%;
  --chart-3: 30 100% 50%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-[var(--color-bg)] text-[var(--color-text)];
    font-family: "Pretendard Variable", -apple-system, BlinkMacSystemFont,
      system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Noto Sans KR", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

- [ ] **Step 2: Verify styles load**

Run: `bun dev`
Expected: Page renders with Pretendard font, white background

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace design tokens with 차용 brand system (#3182F6)"
```

---

### Task 4: Shared Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create type re-exports from Prisma**

```typescript
export type {
  Profile,
  Listing,
  ListingImage,
  ChatRoom,
  ChatMessage,
  ConsultationLead,
  EscrowPayment,
  Favorite,
  Notification,
} from "@prisma/client";

export {
  UserRole,
  ListingType,
  ListingStatus,
  MessageType,
  LeadStatus,
  EscrowStatus,
  NotificationType,
} from "@prisma/client";

// Listing with relations (for detail pages)
export type ListingWithImages = import("@prisma/client").Listing & {
  images: import("@prisma/client").ListingImage[];
  seller: Pick<import("@prisma/client").Profile, "id" | "name" | "role">;
};

// Listing card data (for list/grid views)
export type ListingCardData = Pick<
  import("@prisma/client").Listing,
  | "id"
  | "type"
  | "brand"
  | "model"
  | "year"
  | "trim"
  | "mileage"
  | "monthlyPayment"
  | "initialCost"
  | "remainingMonths"
  | "isVerified"
  | "accidentFree"
  | "viewCount"
  | "favoriteCount"
> & {
  primaryImage: string | null;
};
```

- [ ] **Step 2: Verify types compile**

Run: `bun run type-check`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add shared type exports for 차용 data model"
```

---

### Task 5: Finance Calculation Utils (TDD)

**Files:**
- Create: `src/lib/finance/calculations.ts`
- Create: `src/lib/finance/calculations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/finance/calculations.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import {
  calcTotalAcquisitionCost,
  calcRemainingPayments,
  calcTotalEffectiveCost,
  checkIsVerified,
} from "./calculations";

describe("calcTotalAcquisitionCost", () => {
  it("sums initialCost and transferFee", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 0, transferFee: 300000 })).toBe(300000);
  });

  it("handles zero values", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 0, transferFee: 0 })).toBe(0);
  });

  it("handles large values", () => {
    expect(calcTotalAcquisitionCost({ initialCost: 5000000, transferFee: 300000 })).toBe(5300000);
  });
});

describe("calcRemainingPayments", () => {
  it("multiplies monthly payment by remaining months", () => {
    expect(calcRemainingPayments({ monthlyPayment: 580000, remainingMonths: 32 })).toBe(18560000);
  });

  it("handles 0 months", () => {
    expect(calcRemainingPayments({ monthlyPayment: 580000, remainingMonths: 0 })).toBe(0);
  });
});

describe("calcTotalEffectiveCost", () => {
  it("sums acquisition cost and remaining payments", () => {
    const result = calcTotalEffectiveCost({
      initialCost: 0,
      transferFee: 300000,
      monthlyPayment: 580000,
      remainingMonths: 32,
    });
    // 300000 + (580000 * 32) = 300000 + 18560000 = 18860000
    expect(result).toBe(18860000);
  });
});

describe("checkIsVerified", () => {
  const fullListing = {
    brand: "현대",
    model: "싼타페",
    year: 2023,
    trim: "프레스티지",
    mileage: 23456,
    color: "화이트",
    imageCount: 3,
  };

  it("returns true when all fields present", () => {
    expect(checkIsVerified(fullListing)).toBe(true);
  });

  it("returns false when brand is null", () => {
    expect(checkIsVerified({ ...fullListing, brand: null })).toBe(false);
  });

  it("returns false when trim is null", () => {
    expect(checkIsVerified({ ...fullListing, trim: null })).toBe(false);
  });

  it("returns false when no images", () => {
    expect(checkIsVerified({ ...fullListing, imageCount: 0 })).toBe(false);
  });

  it("returns false when mileage is null", () => {
    expect(checkIsVerified({ ...fullListing, mileage: null })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `bun run test src/lib/finance/calculations.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement calculations**

Create `src/lib/finance/calculations.ts`:
```typescript
type AcquisitionInput = {
  initialCost: number;
  transferFee: number;
};

type RemainingInput = {
  monthlyPayment: number;
  remainingMonths: number;
};

type EffectiveCostInput = AcquisitionInput & RemainingInput;

type VerificationInput = {
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  mileage: number | null;
  color: string | null;
  imageCount: number;
};

/** 총 인수 비용 = 초기비용 + 승계 수수료 */
export function calcTotalAcquisitionCost(input: AcquisitionInput): number {
  return input.initialCost + input.transferFee;
}

/** 남은 총 납입금 = 월 납입금 × 잔여기간 */
export function calcRemainingPayments(input: RemainingInput): number {
  return input.monthlyPayment * input.remainingMonths;
}

/** 실질 총 비용 = 총 인수 비용 + 남은 총 납입금 */
export function calcTotalEffectiveCost(input: EffectiveCostInput): number {
  return (
    calcTotalAcquisitionCost(input) + calcRemainingPayments(input)
  );
}

/** 안심마크 판정: 모든 상세정보 + 이미지 1장 이상 */
export function checkIsVerified(input: VerificationInput): boolean {
  return (
    input.brand !== null &&
    input.model !== null &&
    input.year !== null &&
    input.trim !== null &&
    input.mileage !== null &&
    input.color !== null &&
    input.imageCount >= 1
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `bun run test src/lib/finance/calculations.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/finance/
git commit -m "feat(finance): add cost calculation and isVerified check with tests"
```

---

### Task 6: Contact Filter Utils (TDD)

**Files:**
- Create: `src/lib/chat/contact-filter.ts`
- Create: `src/lib/chat/contact-filter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/chat/contact-filter.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { containsContactInfo, sanitizeMessage } from "./contact-filter";

describe("containsContactInfo", () => {
  it("detects phone number with dashes", () => {
    expect(containsContactInfo("연락처 010-1234-5678 입니다")).toBe(true);
  });

  it("detects phone number without dashes", () => {
    expect(containsContactInfo("01012345678로 연락주세요")).toBe(true);
  });

  it("detects phone with spaces", () => {
    expect(containsContactInfo("010 1234 5678")).toBe(true);
  });

  it("detects landline numbers", () => {
    expect(containsContactInfo("02-1234-5678")).toBe(true);
  });

  it("detects email addresses", () => {
    expect(containsContactInfo("이메일은 user@example.com 입니다")).toBe(true);
  });

  it("allows normal messages", () => {
    expect(containsContactInfo("안녕하세요, 매물 문의합니다")).toBe(false);
  });

  it("allows numbers that are not phone numbers", () => {
    expect(containsContactInfo("월 580,000원이에요")).toBe(false);
  });

  it("allows short number sequences", () => {
    expect(containsContactInfo("32개월 남았어요")).toBe(false);
  });
});

describe("sanitizeMessage", () => {
  it("returns original message when clean", () => {
    expect(sanitizeMessage("안녕하세요").blocked).toBe(false);
  });

  it("blocks message with phone number", () => {
    const result = sanitizeMessage("010-1234-5678로 연락주세요");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("외부 연락처 공유가 제한됩니다.");
  });

  it("blocks message with email", () => {
    const result = sanitizeMessage("mail@test.com으로 보내주세요");
    expect(result.blocked).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `bun run test src/lib/chat/contact-filter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement contact filter**

Create `src/lib/chat/contact-filter.ts`:
```typescript
const PHONE_PATTERN = /\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/;
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;

/** Check if message text contains phone numbers or email addresses */
export function containsContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text);
}

type SanitizeResult =
  | { blocked: false }
  | { blocked: true; reason: string };

/** Validate a chat message and block if it contains contact info */
export function sanitizeMessage(text: string): SanitizeResult {
  if (containsContactInfo(text)) {
    return { blocked: true, reason: "외부 연락처 공유가 제한됩니다." };
  }
  return { blocked: false };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `bun run test src/lib/chat/contact-filter.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/
git commit -m "feat(chat): add contact info filter with phone/email detection"
```

---

### Task 7: Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace root layout**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "차용 — 승계·리스·렌트 플랫폼",
    template: "%s | 차용",
  },
  description:
    "안전하게 승계하는 가장 쉬운 방법, 차용. 월 납입금만 보고 간편하게 비교하세요.",
  openGraph: {
    title: "차용 — 승계·리스·렌트 플랫폼",
    description: "월 납입금만 보고 간편하게 비교하세요.",
    siteName: "차용",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--color-bg)] antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify layout renders**

Run: `bun dev`
Expected: Page renders with Korean lang attribute, correct metadata

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(layout): set up 차용 root layout with metadata and Pretendard font"
```

---

### Task 8: Header Component

**Files:**
- Create: `src/components/layout/header.tsx`

- [ ] **Step 1: Create header component**

```tsx
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/list", label: "매물보기" },
  { href: "/list?type=USED_LEASE", label: "중고 리스·렌트" },
  { href: "/sell", label: "매물등록" },
  { href: "/guide", label: "이용가이드" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-divider)] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="text-lg font-bold text-[var(--color-text)]">
            차용
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-text-sub)] hover:text-[var(--color-text)]"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            회원가입
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat(layout): add Header component with nav and auth buttons"
```

---

### Task 9: Footer Component

**Files:**
- Create: `src/components/layout/footer.tsx`

- [ ] **Step 1: Create footer component**

```tsx
import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "서비스",
    links: [
      { href: "/list?type=TRANSFER", label: "승계 차량" },
      { href: "/list?type=USED_LEASE", label: "중고 리스·렌트" },
      { href: "/sell", label: "매물 등록" },
    ],
  },
  {
    title: "이용 안내",
    links: [
      { href: "/guide", label: "이용 가이드" },
      { href: "/guide#escrow", label: "안전거래 시스템" },
    ],
  },
  {
    title: "고객센터",
    links: [
      { href: "tel:1544-1234", label: "1544-1234" },
      { href: "#", label: "평일 09:00 - 18:00" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-divider)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-[var(--color-text)]">차용</p>
            <p className="mt-2 text-sm text-[var(--color-text-caption)]">
              안전하고 투명한 차량 거래 플랫폼
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="font-medium text-[var(--color-text)]">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--color-divider)] pt-6">
          <p className="text-xs text-[var(--color-text-caption)]">
            &copy; {new Date().getFullYear()} 차용. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat(layout): add Footer component with service links and contact"
```

---

### Task 10: Mobile Navigation

**Files:**
- Create: `src/components/layout/mobile-nav.tsx`

- [ ] **Step 1: Create mobile bottom nav**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";

const MOBILE_NAV_ITEMS = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/list", icon: Search, label: "매물" },
  { href: "/sell", icon: PlusCircle, label: "등록" },
  { href: "/chat", icon: MessageCircle, label: "채팅" },
  { href: "/my", icon: User, label: "MY" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-divider)] bg-white md:hidden">
      <div className="flex items-center justify-around py-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-caption)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/mobile-nav.tsx
git commit -m "feat(layout): add MobileNav bottom navigation component"
```

---

### Task 11: VehicleCard Component

**Files:**
- Create: `src/components/ui/vehicle-card.tsx`

- [ ] **Step 1: Create VehicleCard**

```tsx
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { TrustBadge } from "./trust-badge";
import { PriceDisplay } from "./price-display";
import type { ListingCardData } from "@/types";

type VehicleCardProps = {
  listing: ListingCardData;
};

export function VehicleCard({ listing }: VehicleCardProps) {
  const subtitle = [
    listing.year ? `${listing.year}년식` : null,
    listing.trim,
    listing.mileage ? `${listing.mileage.toLocaleString()}km` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const displayName = [listing.brand, listing.model].filter(Boolean).join(" ") || "차량 정보 미입력";

  return (
    <Link
      href={`/detail/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-[var(--color-divider)] bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[var(--color-surface)]">
        {listing.primaryImage ? (
          <Image
            src={listing.primaryImage}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-caption)]">
            이미지 없음
          </div>
        )}

        {listing.isVerified && (
          <div className="absolute left-2 top-2">
            <TrustBadge />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="truncate font-medium text-[var(--color-text)]">
          {displayName}
        </p>

        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--color-text-caption)]">
            {subtitle}
          </p>
        )}

        <div className="mt-2">
          <PriceDisplay
            monthlyPayment={listing.monthlyPayment}
            size="sm"
          />
        </div>

        <p className="mt-1 text-xs text-[var(--color-text-sub)]">
          초기비용 {listing.initialCost.toLocaleString()}원 | 잔여{" "}
          {listing.remainingMonths}개월
        </p>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-caption)]">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {listing.favoriteCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {listing.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/vehicle-card.tsx
git commit -m "feat(ui): add VehicleCard component with price, badge, stats"
```

---

### Task 12: PriceDisplay + TrustBadge Components

**Files:**
- Create: `src/components/ui/price-display.tsx`
- Create: `src/components/ui/trust-badge.tsx`

- [ ] **Step 1: Create PriceDisplay**

```tsx
type PriceDisplayProps = {
  monthlyPayment: number;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
} as const;

export function PriceDisplay({ monthlyPayment, size = "md" }: PriceDisplayProps) {
  return (
    <p className={`font-bold text-[var(--color-text)] ${SIZE_CLASSES[size]}`}>
      <span className="text-[0.75em] font-medium text-[var(--color-text-sub)]">
        월{" "}
      </span>
      {monthlyPayment.toLocaleString()}
      <span className="text-[0.65em] font-medium">원</span>
    </p>
  );
}
```

- [ ] **Step 2: Create TrustBadge**

```tsx
import { ShieldCheck } from "lucide-react";

type TrustBadgeProps = {
  variant?: "default" | "compact";
};

export function TrustBadge({ variant = "default" }: TrustBadgeProps) {
  if (variant === "compact") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-[var(--color-success)] px-1.5 py-0.5 text-[10px] font-medium text-white">
        <ShieldCheck className="h-3 w-3" />
        안심
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-success)] px-2 py-1 text-xs font-medium text-white">
      <ShieldCheck className="h-3.5 w-3.5" />
      안심매물
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/price-display.tsx src/components/ui/trust-badge.tsx
git commit -m "feat(ui): add PriceDisplay and TrustBadge components"
```

---

### Task 13: FilterBar + StepIndicator Components

**Files:**
- Create: `src/components/ui/filter-bar.tsx`
- Create: `src/components/ui/step-indicator.tsx`

- [ ] **Step 1: Create FilterBar**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const QUICK_FILTERS = [
  { label: "전체", value: "" },
  { label: "~50만원", value: "500000" },
  { label: "~100만원", value: "1000000" },
  { label: "100만원~", value: "1000001" },
] as const;

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMax = searchParams.get("monthlyMax") ?? "";

  const setFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "") {
        params.delete("monthlyMax");
        params.delete("monthlyMin");
      } else if (value === "1000001") {
        params.set("monthlyMin", "1000001");
        params.delete("monthlyMax");
      } else {
        params.delete("monthlyMin");
        params.set("monthlyMax", value);
      }
      params.delete("page");
      router.push(`/list?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {QUICK_FILTERS.map((filter) => {
        const isActive =
          filter.value === "" ? !activeMax : activeMax === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => setFilter(filter.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create StepIndicator**

```tsx
type StepIndicatorProps = {
  steps: string[];
  currentStep: number; // 0-indexed
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, index) => (
        <div key={label} className="flex items-center gap-2">
          {/* Step circle */}
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              index <= currentStep
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-caption)]"
            }`}
          >
            {index + 1}
          </div>

          {/* Label */}
          <span
            className={`text-sm ${
              index <= currentStep
                ? "font-medium text-[var(--color-text)]"
                : "text-[var(--color-text-caption)]"
            }`}
          >
            {label}
          </span>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                index < currentStep
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-divider)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/filter-bar.tsx src/components/ui/step-indicator.tsx
git commit -m "feat(ui): add FilterBar and StepIndicator components"
```

---

### Task 14: Listings API (CRUD)

**Files:**
- Create: `src/app/api/listings/route.ts`
- Create: `src/app/api/listings/[id]/route.ts`

- [ ] **Step 1: Create listings list + create endpoint**

Create `src/app/api/listings/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { ListingStatus, ListingType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextURL;

  const type = searchParams.get("type") as ListingType | null;
  const monthlyMin = searchParams.get("monthlyMin");
  const monthlyMax = searchParams.get("monthlyMax");
  const brand = searchParams.get("brand");
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = 12;

  const where = {
    status: "ACTIVE" as ListingStatus,
    ...(type && { type }),
    ...(brand && { brand }),
    ...(monthlyMin || monthlyMax
      ? {
          monthlyPayment: {
            ...(monthlyMin && { gte: Number(monthlyMin) }),
            ...(monthlyMax && { lte: Number(monthlyMax) }),
          },
        }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { monthlyPayment: "asc" as const }
      : sort === "price_desc"
        ? { monthlyPayment: "desc" as const }
        : { createdAt: "desc" as const };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, orderBy],
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const data = listings.map((listing) => ({
    id: listing.id,
    type: listing.type,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    trim: listing.trim,
    mileage: listing.mileage,
    monthlyPayment: listing.monthlyPayment,
    initialCost: listing.initialCost,
    remainingMonths: listing.remainingMonths,
    isVerified: listing.isVerified,
    accidentFree: listing.accidentFree,
    viewCount: listing.viewCount,
    favoriteCount: listing.favoriteCount,
    primaryImage: listing.images[0]?.url ?? null,
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Add auth check — require SELLER/DEALER role
  // TODO: Add Zod validation

  const listing = await prisma.listing.create({
    data: {
      sellerId: body.sellerId,
      type: body.type,
      monthlyPayment: body.monthlyPayment,
      initialCost: body.initialCost ?? 0,
      remainingMonths: body.remainingMonths,
      transferFee: body.transferFee ?? 0,
      brand: body.brand ?? null,
      model: body.model ?? null,
      year: body.year ?? null,
      trim: body.trim ?? null,
      description: body.description ?? null,
      status: "DRAFT",
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
```

- [ ] **Step 2: Create listing detail + update endpoint**

Create `src/app/api/listings/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      seller: { select: { id: true, name: true, role: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Increment view count (fire-and-forget)
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json(listing);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  // TODO: Add auth check — only listing owner or admin
  // TODO: Add Zod validation

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...body,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(listing);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/listings/
git commit -m "feat(api): add listings CRUD endpoints (GET list, GET detail, POST, PUT)"
```

---

### Task 15: Wire Layout into App

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Add Header, Footer, MobileNav to root layout**

Update `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "차용 — 승계·리스·렌트 플랫폼",
    template: "%s | 차용",
  },
  description:
    "안전하게 승계하는 가장 쉬운 방법, 차용. 월 납입금만 보고 간편하게 비교하세요.",
  openGraph: {
    title: "차용 — 승계·리스·렌트 플랫폼",
    description: "월 납입금만 보고 간편하게 비교하세요.",
    siteName: "차용",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--color-bg)] antialiased">
        <Header />
        <main className="pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update home placeholder to use components**

Update `src/app/(public)/page.tsx`:
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      {/* Hero */}
      <section className="py-12 text-center">
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
          안전하게 승계하는
          <br />
          <span className="text-[var(--color-primary)]">가장 쉬운 방법, 차용</span>
        </h1>
        <p className="mt-4 text-[var(--color-text-sub)]">
          월 납입금만 보고 간편하게 비교하세요.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/list"
            className="rounded-xl bg-[var(--color-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            매물 보러가기
          </Link>
          <Link
            href="/sell"
            className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
          >
            내 차 등록하기
          </Link>
        </div>
      </section>

      {/* Placeholder sections */}
      <section className="py-8">
        <p className="text-center text-sm text-[var(--color-text-caption)]">
          추천 매물 영역 — Phase 1에서 구현
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify full layout renders**

Run: `bun dev`
Expected: Header with nav + hero section + footer + mobile nav (on small viewport)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/\(public\)/page.tsx
git commit -m "feat: wire Header, Footer, MobileNav into layout with home placeholder"
```

---

### Task 16: CSP Headers Update

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add TossPayments domains to CSP**

Find the CSP header section in `next.config.ts` and add:
- `script-src`: add `js.tosspayments.com`
- `frame-src`: add `*.tosspayments.com`
- `connect-src`: add `api.tosspayments.com`

The exact edit depends on the current CSP format. Look for `Content-Security-Policy` in the headers array and append the domains to the respective directives.

- [ ] **Step 2: Verify app still boots**

Run: `bun dev`
Expected: No CSP errors in console

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: add TossPayments domains to CSP headers"
```

---

### Task 17: Type Check + Final Verification

- [ ] **Step 1: Run type check**

Run: `bun run type-check`
Expected: No TypeScript errors

- [ ] **Step 2: Run all tests**

Run: `bun run test`
Expected: All tests pass (finance calculations + contact filter)

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: Phase 0 foundation complete — clean build verified"
```

---

## Summary

After completing all 17 tasks, the repo will have:
- Clean codebase with no old feature code
- New Prisma schema with 10 models (Profile, Listing, ListingImage, ChatRoom, ChatMessage, ConsultationLead, EscrowPayment, Favorite, Notification)
- 차용 design system (#3182F6 primary, Pretendard, Toss-style tokens)
- Layout: Header, Footer, MobileNav
- Shared UI: VehicleCard, PriceDisplay, TrustBadge, FilterBar, StepIndicator
- Tested utils: finance calculations (8 tests), contact filter (11 tests)
- API scaffold: listings CRUD (GET list, GET detail, POST, PUT)
- Home page placeholder with hero

**Next:** Phase 1~8 plans (HOME, LIST, DETAIL, SELL, CHAT, PAYMENT, MY, ADMIN) — each as a separate plan document, executed in parallel.
