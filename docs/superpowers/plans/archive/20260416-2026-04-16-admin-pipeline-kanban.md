# Admin Pipeline Kanban & Inspection System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 페이지에 매물 칸반 파이프라인, 검수 체크리스트, 역할별 대시보드를 추가하여 DRAFT→SOLD 흐름을 시각화하고 일관된 품질 관리를 가능하게 한다.

**Architecture:** Prisma에 4개 필드 추가 (inspectionChecklist, rejectionReason, inspectedAt, inspectedBy). 칸반은 `@dnd-kit` (이미 설치됨)으로 DnD 구현. 역할 전환은 localStorage + zustand로 관리. 검수는 shadcn Sheet 슬라이드오버 패널.

**Tech Stack:** Next.js 16 (App Router), React 19, @dnd-kit/core + @dnd-kit/sortable, shadcn/ui (Sheet, Checkbox, Badge), zustand, sonner (toast), Prisma 6, Zod

**Design Doc:** `~/.gstack/projects/navid-labs-navid-auto-rental-lease/kiyeol-main-design-20260416-050634.md`

---

## File Structure

```
prisma/
  schema.prisma                              # MODIFY: Listing에 4개 필드 추가

src/
├── types/
│   └── admin.ts                             # CREATE: 관리자 전용 타입 정의
├── lib/
│   └── admin/
│       └── role-store.ts                    # CREATE: zustand 역할 상태 스토어
├── features/admin/components/
│   ├── admin-sidebar.tsx                    # MODIFY: 역할 전환 드롭다운 추가
│   ├── action-card.tsx                      # CREATE: 대시보드 액션 카드
│   ├── role-dashboard-admin.tsx             # CREATE: Super Admin 대시보드
│   ├── listing-kanban-board.tsx             # CREATE: 칸반 보드 (DnD 컨테이너)
│   ├── listing-kanban-column.tsx            # CREATE: 칸반 컬럼
│   ├── listing-kanban-card.tsx              # CREATE: 칸반 카드
│   ├── inspection-panel.tsx                 # CREATE: 검수 슬라이드오버 패널
│   └── inspection-checklist.tsx             # CREATE: 검수 체크리스트 폼
├── app/admin/
│   ├── page.tsx                             # MODIFY: 역할별 대시보드로 교체
│   └── pipeline/
│       └── page.tsx                         # CREATE: 칸반 파이프라인 페이지
└── app/api/admin/listings/[id]/
    └── route.ts                             # MODIFY: inspection 필드 + 상태 전이 규칙 추가
```

---

### Task 1: Prisma 스키마 — Listing 모델에 검수 필드 추가

**Files:**
- Modify: `prisma/schema.prisma` (Listing 모델, ~line 220 부근 timestamps 위)

- [ ] **Step 1: Listing 모델에 4개 필드 추가**

`prisma/schema.prisma`의 Listing 모델에서 `isVerified` 필드 아래, `description` 위에 추가:

```prisma
  // Inspection
  inspectionChecklist Json?      @map("inspection_checklist")
  rejectionReason     String?    @map("rejection_reason")
  inspectedAt         DateTime?  @map("inspected_at")
  inspectedBy         String?    @map("inspected_by") @db.Uuid
```

- [ ] **Step 2: Prisma client 생성 및 DB push**

```bash
bun run db:generate
bun run db:push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: 타입 체크**

```bash
bun run type-check
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add inspection fields to Listing model

Add inspectionChecklist (Json), rejectionReason, inspectedAt, inspectedBy"
```

---

### Task 2: 관리자 전용 타입 정의

**Files:**
- Create: `src/types/admin.ts`

- [ ] **Step 1: 타입 파일 생성**

```typescript
// src/types/admin.ts
import type { Listing, ListingImage, Profile } from "@prisma/client";

/** 관리자 역할 뷰 */
export type AdminRole = "admin" | "inspector" | "finance";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "시스템 관리자",
  inspector: "차량 평가사",
  finance: "금융 매니저",
};

/** 칸반 보드용 매물 데이터 */
export type KanbanListing = Pick<
  Listing,
  | "id"
  | "type"
  | "status"
  | "brand"
  | "model"
  | "year"
  | "monthlyPayment"
  | "isVerified"
  | "createdAt"
  | "updatedAt"
> & {
  seller: Pick<Profile, "id" | "name">;
  _count: { images: number };
};

/** 칸반 컬럼 ID = ListingStatus */
export type KanbanColumnId =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "RESERVED"
  | "SOLD"
  | "HIDDEN";

/** 검수 체크리스트 JSON 구조 */
export interface InspectionChecklist {
  exterior: {
    frameIntact: boolean;
    panelCondition: boolean;
    paintCondition: boolean;
  };
  drivetrain: {
    engineNoLeak: boolean;
    transmissionOk: boolean;
    undercarriageOk: boolean;
  };
  consumables: {
    tireCondition: boolean;
    brakePads: boolean;
    battery: boolean;
  };
  documents: {
    vinMatch: boolean;
    insuranceHistory: boolean;
    inspectionReport: boolean;
    noIllegalMods: boolean;
  };
  memo: string;
}

/** 검수 체크리스트 기본값 (모두 false) */
export const DEFAULT_INSPECTION_CHECKLIST: InspectionChecklist = {
  exterior: { frameIntact: false, panelCondition: false, paintCondition: false },
  drivetrain: { engineNoLeak: false, transmissionOk: false, undercarriageOk: false },
  consumables: { tireCondition: false, brakePads: false, battery: false },
  documents: { vinMatch: false, insuranceHistory: false, inspectionReport: false, noIllegalMods: false },
  memo: "",
};

/** 검수 항목 라벨 */
export const INSPECTION_LABELS: Record<string, Record<string, string>> = {
  exterior: {
    frameIntact: "골격 손상 없음",
    panelCondition: "패널 판금/교환 없음",
    paintCondition: "도장 상태 양호",
  },
  drivetrain: {
    engineNoLeak: "엔진 누유 없음",
    transmissionOk: "변속기 정상",
    undercarriageOk: "하체 상태 양호",
  },
  consumables: {
    tireCondition: "타이어 잔여량 충분",
    brakePads: "브레이크패드 잔여량 충분",
    battery: "배터리 상태 양호",
  },
  documents: {
    vinMatch: "차대번호 일치",
    insuranceHistory: "보험이력 확인",
    inspectionReport: "성능점검기록부 확인",
    noIllegalMods: "불법구조변경 없음",
  },
};

/** 검수 섹션 라벨 */
export const INSPECTION_SECTION_LABELS: Record<string, string> = {
  exterior: "외판 및 골격",
  drivetrain: "구동 장치",
  consumables: "소모품 잔존량",
  documents: "서류 및 이력",
};

/** 허용되는 상태 전이 규칙 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING", "HIDDEN"],
  PENDING: ["ACTIVE", "DRAFT", "HIDDEN"], // DRAFT: 반려 시
  ACTIVE: ["RESERVED", "HIDDEN"],
  RESERVED: ["SOLD", "ACTIVE", "HIDDEN"],
  SOLD: ["HIDDEN"],
  HIDDEN: ["DRAFT"],
};

/** 대시보드 액션 카드 타입 */
export interface ActionCardData {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
  href: string;
  urgent?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/admin.ts
git commit -m "feat(types): add admin-specific types for kanban, inspection, roles"
```

---

### Task 3: 역할 상태 스토어 (zustand)

**Files:**
- Create: `src/lib/admin/role-store.ts`

- [ ] **Step 1: zustand 스토어 생성**

```typescript
// src/lib/admin/role-store.ts
import { create } from "zustand";
import type { AdminRole } from "@/types/admin";

interface AdminRoleState {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
}

export const useAdminRoleStore = create<AdminRoleState>((set) => ({
  role: (typeof window !== "undefined"
    ? (localStorage.getItem("adminRole") as AdminRole)
    : null) || "admin",
  setRole: (role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminRole", role);
    }
    set({ role });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin/role-store.ts
git commit -m "feat(admin): add zustand role store with localStorage persistence"
```

---

### Task 4: 사이드바 — 역할 전환 드롭다운 추가

**Files:**
- Modify: `src/features/admin/components/admin-sidebar.tsx`

- [ ] **Step 1: 사이드바에 역할 전환 + 파이프라인 메뉴 추가**

`src/features/admin/components/admin-sidebar.tsx` 전체 교체:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  Kanban,
  ChevronDown,
  Shield,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import { useAdminRoleStore } from "@/lib/admin/role-store";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/types/admin";
import { useState, useRef, useEffect } from "react";

const allNavItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true, roles: ["admin", "inspector", "finance"] },
  { href: "/admin/pipeline", label: "매물 파이프라인", icon: Kanban, exact: false, roles: ["admin", "inspector"] },
  { href: "/admin/leads", label: "상담 리드", icon: Users, exact: false, roles: ["admin", "finance"] },
  { href: "/admin/listings", label: "매물 관리", icon: Car, exact: false, roles: ["admin", "inspector"] },
  { href: "/admin/escrow", label: "에스크로 관리", icon: CreditCard, exact: false, roles: ["admin"] },
];

const roleIcons: Record<AdminRole, typeof Shield> = {
  admin: Shield,
  inspector: ClipboardCheck,
  finance: Wallet,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useAdminRoleStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const RoleIcon = roleIcons[role];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col border-r"
      style={{
        backgroundColor: "var(--chayong-bg)",
        borderColor: "var(--chayong-divider)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-5 border-b font-bold text-lg tracking-tight"
        style={{
          borderColor: "var(--chayong-divider)",
          color: "var(--chayong-primary)",
        }}
      >
        차용 ADMIN
      </div>

      {/* Role Switcher */}
      <div className="px-3 pt-3 pb-1" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: "var(--chayong-surface)",
            color: "var(--chayong-text)",
          }}
        >
          <RoleIcon size={14} />
          <span className="flex-1 text-left">{ADMIN_ROLE_LABELS[role]}</span>
          <ChevronDown
            size={14}
            className="transition-transform"
            style={{ transform: dropdownOpen ? "rotate(180deg)" : undefined }}
          />
        </button>

        {dropdownOpen && (
          <div
            className="mt-1 rounded-lg border shadow-lg overflow-hidden"
            style={{
              backgroundColor: "var(--chayong-bg)",
              borderColor: "var(--chayong-divider)",
            }}
          >
            {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((r) => {
              const Icon = roleIcons[r];
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: r === role ? "var(--chayong-primary-light)" : "transparent",
                    color: r === role ? "var(--chayong-primary)" : "var(--chayong-text-sub)",
                  }}
                >
                  <Icon size={14} />
                  {ADMIN_ROLE_LABELS[r]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: active
                  ? "var(--chayong-primary)"
                  : "transparent",
                color: active ? "#fff" : "var(--chayong-text-sub)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/admin-sidebar.tsx
git commit -m "feat(admin): add role switcher dropdown to sidebar with filtered nav"
```

---

### Task 5: 액션 카드 컴포넌트

**Files:**
- Create: `src/features/admin/components/action-card.tsx`

- [ ] **Step 1: 액션 카드 생성**

```tsx
// src/features/admin/components/action-card.tsx
"use client";

import Link from "next/link";
import type { ActionCardData } from "@/types/admin";

export function ActionCard({ label, value, icon: Icon, color, bg, href, urgent }: ActionCardData) {
  return (
    <Link
      href={href}
      className="group rounded-xl p-5 border transition-shadow hover:shadow-lg relative"
      style={{
        backgroundColor: "var(--chayong-bg)",
        borderColor: "var(--chayong-divider)",
      }}
    >
      {urgent && value > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: "var(--chayong-danger)" }}
        >
          {value > 9 ? "9+" : value}
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p
        className="text-3xl font-bold mb-1"
        style={{ color: "var(--chayong-text)" }}
      >
        {value.toLocaleString()}
      </p>
      <p
        className="text-sm"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        {label}
      </p>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/action-card.tsx
git commit -m "feat(admin): add clickable ActionCard with urgent badge"
```

---

### Task 6: Super Admin 대시보드 + 최근 활동

**Files:**
- Create: `src/features/admin/components/role-dashboard-admin.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Super Admin 대시보드 컴포넌트 생성**

```tsx
// src/features/admin/components/role-dashboard-admin.tsx
"use client";

import {
  Clock,
  Car,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { ActionCard } from "./action-card";
import type { ActionCardData } from "@/types/admin";

interface DashboardStats {
  pendingListings: number;
  waitingLeads: number;
  activeListings: number;
  pendingEscrow: number;
}

interface RecentActivity {
  id: string;
  type: "listing" | "lead" | "escrow";
  label: string;
  status: string;
  updatedAt: string;
}

interface RoleDashboardAdminProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

export function RoleDashboardAdmin({ stats, recentActivities }: RoleDashboardAdminProps) {
  const cards: ActionCardData[] = [
    {
      label: "승인 대기",
      value: stats.pendingListings,
      icon: ShieldCheck,
      color: "var(--chayong-danger)",
      bg: "#FEF2F2",
      href: "/admin/pipeline",
      urgent: true,
    },
    {
      label: "상담 대기",
      value: stats.waitingLeads,
      icon: Clock,
      color: "var(--chayong-warning, #F59E0B)",
      bg: "#FFF7ED",
      href: "/admin/leads?status=WAITING",
      urgent: true,
    },
    {
      label: "활성 매물",
      value: stats.activeListings,
      icon: Car,
      color: "var(--chayong-success)",
      bg: "#ECFDF5",
      href: "/admin/listings?status=ACTIVE",
    },
    {
      label: "에스크로 처리",
      value: stats.pendingEscrow,
      icon: CreditCard,
      color: "var(--chayong-primary)",
      bg: "var(--chayong-primary-light, #EFF6FF)",
      href: "/admin/escrow?status=PAID",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <ActionCard key={card.label} {...card} />
        ))}
      </div>

      {/* 최근 활동 */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--chayong-bg)",
          borderColor: "var(--chayong-divider)",
        }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: "var(--chayong-text)" }}
        >
          최근 활동
        </h2>

        {recentActivities.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
            최근 활동이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentActivities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: "var(--chayong-divider)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: activity.type === "listing" ? "#DBEAFE"
                        : activity.type === "lead" ? "#FEF3C7"
                        : "#D1FAE5",
                      color: activity.type === "listing" ? "#1E40AF"
                        : activity.type === "lead" ? "#92400E"
                        : "#065F46",
                    }}
                  >
                    {activity.type === "listing" ? "매물" : activity.type === "lead" ? "리드" : "에스크로"}
                  </span>
                  <span className="text-sm" style={{ color: "var(--chayong-text)" }}>
                    {activity.label}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--chayong-surface)",
                      color: "var(--chayong-text-sub)",
                    }}
                  >
                    {activity.status}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
                  {formatRelativeTime(activity.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
```

- [ ] **Step 2: 대시보드 페이지 교체**

`src/app/admin/page.tsx` 전체 교체:

```tsx
import { prisma } from "@/lib/db/prisma";
import { RoleDashboardAdmin } from "@/features/admin/components/role-dashboard-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "대시보드" };

async function getDashboardData() {
  const [pendingListings, waitingLeads, activeListings, pendingEscrow] =
    await Promise.all([
      prisma.listing.count({ where: { status: "PENDING" } }),
      prisma.consultationLead.count({ where: { status: "WAITING" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.escrowPayment.count({ where: { status: "PAID" } }),
    ]);

  // 최근 활동: 3개 모델에서 최근 10건 조합
  const [recentListings, recentLeads, recentEscrow] = await Promise.all([
    prisma.listing.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, brand: true, model: true, status: true, updatedAt: true },
    }),
    prisma.consultationLead.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true, status: true, updatedAt: true,
        listing: { select: { brand: true, model: true } },
      },
    }),
    prisma.escrowPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, status: true, createdAt: true,
        listing: { select: { brand: true, model: true } },
      },
    }),
  ]);

  const activities = [
    ...recentListings.map((l) => ({
      id: l.id,
      type: "listing" as const,
      label: [l.brand, l.model].filter(Boolean).join(" ") || "미입력 매물",
      status: l.status,
      updatedAt: l.updatedAt.toISOString(),
    })),
    ...recentLeads.map((l) => ({
      id: l.id,
      type: "lead" as const,
      label: [l.listing?.brand, l.listing?.model].filter(Boolean).join(" ") || "상담",
      status: l.status,
      updatedAt: l.updatedAt.toISOString(),
    })),
    ...recentEscrow.map((e) => ({
      id: e.id,
      type: "escrow" as const,
      label: [e.listing?.brand, e.listing?.model].filter(Boolean).join(" ") || "결제",
      status: e.status,
      updatedAt: e.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  return {
    stats: { pendingListings, waitingLeads, activeListings, pendingEscrow },
    recentActivities: activities,
  };
}

export default async function AdminDashboardPage() {
  const { stats, recentActivities } = await getDashboardData();

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{ color: "var(--chayong-text)" }}
      >
        대시보드
      </h1>
      <RoleDashboardAdmin stats={stats} recentActivities={recentActivities} />
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/role-dashboard-admin.tsx src/features/admin/components/action-card.tsx src/app/admin/page.tsx
git commit -m "feat(admin): replace dashboard with action-card layout and recent activity"
```

---

### Task 7: API 업데이트 — 검수 필드 + 상태 전이 규칙

**Files:**
- Modify: `src/app/api/admin/listings/[id]/route.ts`

- [ ] **Step 1: API에 검수 필드와 상태 전이 검증 추가**

`src/app/api/admin/listings/[id]/route.ts` 전체 교체:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole, isAuthError } from "@/lib/api/auth-guard";
import {
  ListingStatus,
  FuelType,
  Transmission,
  BodyType,
  Drivetrain,
  PlateType,
  Grade,
} from "@prisma/client";
import { VALID_STATUS_TRANSITIONS } from "@/types/admin";

const adminListingUpdateSchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  isVerified: z.boolean().optional(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1990).max(2030).optional().nullable(),
  trim: z.string().max(200).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  plateNumber: z.string().max(20).optional().nullable(),
  fuelType: z.nativeEnum(FuelType).optional().nullable(),
  transmission: z.nativeEnum(Transmission).optional().nullable(),
  seatingCapacity: z.number().int().min(1).max(15).optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  displacement: z.number().int().min(0).optional().nullable(),
  bodyType: z.nativeEnum(BodyType).optional().nullable(),
  drivetrain: z.nativeEnum(Drivetrain).optional().nullable(),
  plateType: z.nativeEnum(PlateType).optional().nullable(),
  options: z.array(z.string()).optional(),
  description: z.string().max(5000).optional().nullable(),
  accidentCount: z.number().int().min(0).optional().nullable(),
  ownerCount: z.number().int().min(0).optional().nullable(),
  exteriorGrade: z.nativeEnum(Grade).optional().nullable(),
  interiorGrade: z.nativeEnum(Grade).optional().nullable(),
  mileageVerified: z.boolean().optional(),
  registrationRegion: z.string().max(100).optional().nullable(),
  // 검수 관련 필드
  inspectionChecklist: z.any().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("ADMIN");
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();

    const parsed = adminListingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = { ...parsed.data };

    // 상태 전이 검증
    if (data.status) {
      const current = await prisma.listing.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
      }

      const allowed = VALID_STATUS_TRANSITIONS[current.status];
      if (!allowed?.includes(data.status)) {
        return NextResponse.json(
          { error: `${current.status} → ${data.status} 전이는 허용되지 않습니다.` },
          { status: 400 }
        );
      }
    }

    // 검수 완료 시 inspectedAt, inspectedBy 자동 설정
    if (data.inspectionChecklist && data.status === "ACTIVE") {
      (data as Record<string, unknown>).inspectedAt = new Date();
      (data as Record<string, unknown>).inspectedBy = auth.profile.id;
    }

    const listing = await prisma.listing.update({
      where: { id },
      data,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("PATCH /api/admin/listings/[id] error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/listings/[id]/route.ts
git commit -m "feat(api): add status transition validation and inspection fields to listing PATCH"
```

---

### Task 8: 칸반 카드 컴포넌트

**Files:**
- Create: `src/features/admin/components/listing-kanban-card.tsx`

- [ ] **Step 1: 칸반 카드 생성**

```tsx
// src/features/admin/components/listing-kanban-card.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanListing } from "@/types/admin";
import { formatKRWCompact } from "@/lib/utils/format";
import { ImageIcon, Clock } from "lucide-react";

interface ListingKanbanCardProps {
  listing: KanbanListing;
  onClick: (listing: KanbanListing) => void;
}

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

export function ListingKanbanCard({ listing, onClick }: ListingKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listing.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPendingOld = listing.status === "PENDING" &&
    Date.now() - new Date(listing.createdAt).getTime() > 48 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(listing)}
      className="rounded-lg border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      style={{
        ...style,
        backgroundColor: "var(--chayong-bg)",
        borderColor: isPendingOld ? "var(--chayong-danger)" : "var(--chayong-divider)",
        borderWidth: isPendingOld ? 2 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: "var(--chayong-primary-light, #EFF6FF)",
            color: "var(--chayong-primary)",
          }}
        >
          {TYPE_LABELS[listing.type] || listing.type}
        </span>
        {isPendingOld && (
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--chayong-danger)" }}>
            <Clock size={10} />
            48h+
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="text-sm font-semibold truncate mb-1"
        style={{ color: "var(--chayong-text)" }}
      >
        {[listing.brand, listing.model].filter(Boolean).join(" ") || "미입력 매물"}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--chayong-text-sub)" }}>
          {listing.year ? `${listing.year}년` : ""} · 월 {formatKRWCompact(listing.monthlyPayment)}
        </span>
        <div className="flex items-center gap-1">
          {listing.isVerified && (
            <span
              className="text-[10px] px-1 rounded"
              style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}
            >
              인증
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
            <ImageIcon size={10} />
            {listing._count.images}
          </span>
        </div>
      </div>

      {/* Seller */}
      <p
        className="text-[11px] mt-1.5 truncate"
        style={{ color: "var(--chayong-text-caption)" }}
      >
        {listing.seller?.name || "판매자 미상"}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/listing-kanban-card.tsx
git commit -m "feat(admin): add sortable kanban card with DnD and pending badge"
```

---

### Task 9: 칸반 컬럼 컴포넌트

**Files:**
- Create: `src/features/admin/components/listing-kanban-column.tsx`

- [ ] **Step 1: 칸반 컬럼 생성**

```tsx
// src/features/admin/components/listing-kanban-column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { KanbanListing, KanbanColumnId } from "@/types/admin";
import { ListingKanbanCard } from "./listing-kanban-card";

interface ListingKanbanColumnProps {
  id: KanbanColumnId;
  title: string;
  color: string;
  listings: KanbanListing[];
  onCardClick: (listing: KanbanListing) => void;
}

export function ListingKanbanColumn({
  id,
  title,
  color,
  listings,
  onCardClick,
}: ListingKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[300px] rounded-xl"
      style={{
        backgroundColor: isOver ? "var(--chayong-primary-light, #EFF6FF)" : "var(--chayong-surface)",
        transition: "background-color 200ms",
      }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          {title}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: "var(--chayong-divider)",
            color: "var(--chayong-text-sub)",
          }}
        >
          {listings.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 px-2 pb-3 min-h-[100px] overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <SortableContext
          items={listings.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {listings.map((listing) => (
            <ListingKanbanCard
              key={listing.id}
              listing={listing}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>

        {listings.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center text-xs rounded-lg border-2 border-dashed p-4"
            style={{
              borderColor: "var(--chayong-divider)",
              color: "var(--chayong-text-caption)",
            }}
          >
            매물 없음
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/listing-kanban-column.tsx
git commit -m "feat(admin): add droppable kanban column with card list"
```

---

### Task 10: 칸반 보드 컴포넌트 (DnD 로직)

**Files:**
- Create: `src/features/admin/components/listing-kanban-board.tsx`

- [ ] **Step 1: 칸반 보드 생성**

```tsx
// src/features/admin/components/listing-kanban-board.tsx
"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { KanbanListing, KanbanColumnId } from "@/types/admin";
import { VALID_STATUS_TRANSITIONS } from "@/types/admin";
import { ListingKanbanColumn } from "./listing-kanban-column";

interface ListingKanbanBoardProps {
  initialListings: KanbanListing[];
  onCardClick: (listing: KanbanListing) => void;
}

const COLUMNS: { id: KanbanColumnId; title: string; color: string }[] = [
  { id: "DRAFT", title: "임시저장", color: "#9CA3AF" },
  { id: "PENDING", title: "승인대기", color: "#F59E0B" },
  { id: "ACTIVE", title: "활성", color: "#10B981" },
  { id: "RESERVED", title: "예약중", color: "#3B82F6" },
  { id: "SOLD", title: "판매완료", color: "#6366F1" },
  { id: "HIDDEN", title: "숨김", color: "#D1D5DB" },
];

export function ListingKanbanBoard({ initialListings, onCardClick }: ListingKanbanBoardProps) {
  const [listings, setListings] = useState<KanbanListing[]>(initialListings);
  const [activeCard, setActiveCard] = useState<KanbanListing | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const byStatus = useCallback(
    (status: KanbanColumnId) => listings.filter((l) => l.status === status),
    [listings]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = listings.find((l) => l.id === event.active.id);
      setActiveCard(card || null);
    },
    [listings]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);

      const { active, over } = event;
      if (!over) return;

      const card = listings.find((l) => l.id === active.id);
      if (!card) return;

      // over.id가 컬럼 ID인 경우 (카드 위에 드롭한 경우 해당 카드의 status로 판별)
      let targetStatus: KanbanColumnId;
      const isColumn = COLUMNS.some((c) => c.id === over.id);
      if (isColumn) {
        targetStatus = over.id as KanbanColumnId;
      } else {
        const targetCard = listings.find((l) => l.id === over.id);
        if (!targetCard) return;
        targetStatus = targetCard.status as KanbanColumnId;
      }

      if (card.status === targetStatus) return;

      // 전이 규칙 검증
      const allowed = VALID_STATUS_TRANSITIONS[card.status];
      if (!allowed?.includes(targetStatus)) {
        toast.error(`${card.status} → ${targetStatus} 전이는 허용되지 않습니다.`);
        return;
      }

      // Optimistic update
      const prevListings = [...listings];
      setListings((prev) =>
        prev.map((l) =>
          l.id === card.id ? { ...l, status: targetStatus } : l
        )
      );

      try {
        const res = await fetch(`/api/admin/listings/${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "상태 변경 실패");
        }

        toast.success(`${card.brand || ""} ${card.model || ""} → ${targetStatus}`);
      } catch (error) {
        // 롤백
        setListings(prevListings);
        toast.error(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
      }
    },
    [listings]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <ListingKanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            listings={byStatus(col.id)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div
            className="rounded-lg border p-3 shadow-xl rotate-2"
            style={{
              backgroundColor: "var(--chayong-bg)",
              borderColor: "var(--chayong-primary)",
              width: 260,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
              {[activeCard.brand, activeCard.model].filter(Boolean).join(" ") || "미입력 매물"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/listing-kanban-board.tsx
git commit -m "feat(admin): add kanban board with DnD, optimistic updates, and rollback"
```

---

### Task 11: 검수 체크리스트 폼 컴포넌트

**Files:**
- Create: `src/features/admin/components/inspection-checklist.tsx`

- [ ] **Step 1: 검수 체크리스트 생성**

```tsx
// src/features/admin/components/inspection-checklist.tsx
"use client";

import { useState } from "react";
import type { InspectionChecklist } from "@/types/admin";
import {
  DEFAULT_INSPECTION_CHECKLIST,
  INSPECTION_LABELS,
  INSPECTION_SECTION_LABELS,
} from "@/types/admin";

interface InspectionChecklistFormProps {
  initial?: InspectionChecklist | null;
  onChange: (checklist: InspectionChecklist) => void;
}

export function InspectionChecklistForm({ initial, onChange }: InspectionChecklistFormProps) {
  const [checklist, setChecklist] = useState<InspectionChecklist>(
    initial || DEFAULT_INSPECTION_CHECKLIST
  );

  const toggleItem = (section: string, key: string) => {
    const updated = {
      ...checklist,
      [section]: {
        ...checklist[section as keyof Omit<InspectionChecklist, "memo">],
        [key]: !(checklist[section as keyof Omit<InspectionChecklist, "memo">] as Record<string, boolean>)[key],
      },
    };
    setChecklist(updated);
    onChange(updated);
  };

  const setMemo = (memo: string) => {
    const updated = { ...checklist, memo };
    setChecklist(updated);
    onChange(updated);
  };

  const sections = ["exterior", "drivetrain", "consumables", "documents"] as const;

  const allChecked = sections.every((section) =>
    Object.values(checklist[section]).every((v) => v === true)
  );

  const checkedCount = sections.reduce(
    (sum, section) =>
      sum + Object.values(checklist[section]).filter((v) => v === true).length,
    0
  );
  const totalCount = sections.reduce(
    (sum, section) => sum + Object.keys(checklist[section]).length,
    0
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--chayong-divider)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(checkedCount / totalCount) * 100}%`,
              backgroundColor: allChecked ? "var(--chayong-success)" : "var(--chayong-primary)",
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          {checkedCount}/{totalCount}
        </span>
      </div>

      {sections.map((section) => (
        <div key={section}>
          <h4
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--chayong-text)" }}
          >
            {INSPECTION_SECTION_LABELS[section]}
          </h4>
          <div className="flex flex-col gap-1.5">
            {Object.entries(INSPECTION_LABELS[section]).map(([key, label]) => {
              const checked = (checklist[section] as Record<string, boolean>)[key];
              return (
                <label
                  key={key}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: checked ? "#ECFDF5" : "var(--chayong-surface)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(section, key)}
                    className="w-4 h-4 rounded accent-[var(--chayong-success)]"
                  />
                  <span
                    className="text-sm"
                    style={{ color: checked ? "#065F46" : "var(--chayong-text)" }}
                  >
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Memo */}
      <div>
        <h4
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--chayong-text)" }}
        >
          검수 메모
        </h4>
        <textarea
          value={checklist.memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="특이사항을 기록하세요..."
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
          style={{
            borderColor: "var(--chayong-divider)",
            color: "var(--chayong-text)",
            backgroundColor: "var(--chayong-bg)",
          }}
        />
      </div>
    </div>
  );
}

export function isAllChecked(checklist: InspectionChecklist): boolean {
  const sections = ["exterior", "drivetrain", "consumables", "documents"] as const;
  return sections.every((section) =>
    Object.values(checklist[section]).every((v) => v === true)
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/components/inspection-checklist.tsx
git commit -m "feat(admin): add inspection checklist form with progress bar"
```

---

### Task 12: 검수 슬라이드오버 패널

**Files:**
- Create: `src/features/admin/components/inspection-panel.tsx`

- [ ] **Step 1: 검수 패널 생성**

```tsx
// src/features/admin/components/inspection-panel.tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { KanbanListing, InspectionChecklist } from "@/types/admin";
import { DEFAULT_INSPECTION_CHECKLIST, VALID_STATUS_TRANSITIONS } from "@/types/admin";
import { InspectionChecklistForm, isAllChecked } from "./inspection-checklist";
import { formatKRWCompact } from "@/lib/utils/format";
import { Grade } from "@prisma/client";

interface InspectionPanelProps {
  listing: KanbanListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (listingId: string, status: string) => void;
}

export function InspectionPanel({ listing, open, onOpenChange, onStatusChange }: InspectionPanelProps) {
  const [checklist, setChecklist] = useState<InspectionChecklist>(DEFAULT_INSPECTION_CHECKLIST);
  const [rejectionReason, setRejectionReason] = useState("");
  const [exteriorGrade, setExteriorGrade] = useState<Grade | "">("");
  const [interiorGrade, setInteriorGrade] = useState<Grade | "">("");
  const [saving, setSaving] = useState(false);

  const canApprove = isAllChecked(checklist);
  const canReject = rejectionReason.trim().length > 0;

  const handleApprove = async () => {
    if (!listing || !canApprove) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
          inspectionChecklist: checklist,
          isVerified: true,
          ...(exteriorGrade && { exteriorGrade }),
          ...(interiorGrade && { interiorGrade }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "승인 실패");
      }

      toast.success("매물이 승인되었습니다.");
      onStatusChange(listing.id, "ACTIVE");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "승인에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!listing || !canReject) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DRAFT",
          rejectionReason: rejectionReason.trim(),
          inspectionChecklist: checklist,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "반려 실패");
      }

      toast.success("매물이 반려되었습니다.");
      onStatusChange(listing.id, "DRAFT");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "반려에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setChecklist(DEFAULT_INSPECTION_CHECKLIST);
    setRejectionReason("");
    setExteriorGrade("");
    setInteriorGrade("");
  };

  if (!listing) return null;

  const isPending = listing.status === "PENDING";
  const allowedTransitions = VALID_STATUS_TRANSITIONS[listing.status] || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {[listing.brand, listing.model].filter(Boolean).join(" ") || "미입력 매물"}
          </SheetTitle>
          <SheetDescription>
            {listing.year ? `${listing.year}년` : ""} · 월 {formatKRWCompact(listing.monthlyPayment)} · {listing.seller?.name || "판매자 미상"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>현재 상태:</span>
            <span
              className="text-sm font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--chayong-surface)",
                color: "var(--chayong-text)",
              }}
            >
              {listing.status}
            </span>
          </div>

          {/* Inspection Checklist (PENDING 상태에서만 표시) */}
          {isPending && (
            <>
              <div>
                <h3
                  className="text-base font-semibold mb-3"
                  style={{ color: "var(--chayong-text)" }}
                >
                  검수 체크리스트
                </h3>
                <InspectionChecklistForm
                  initial={null}
                  onChange={setChecklist}
                />
              </div>

              {/* Grades */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: "var(--chayong-text)" }}>
                    외관 등급
                  </label>
                  <select
                    value={exteriorGrade}
                    onChange={(e) => setExteriorGrade(e.target.value as Grade | "")}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--chayong-divider)" }}
                  >
                    <option value="">선택</option>
                    <option value="A">A (우수)</option>
                    <option value="B">B (보통)</option>
                    <option value="C">C (불량)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: "var(--chayong-text)" }}>
                    내장 등급
                  </label>
                  <select
                    value={interiorGrade}
                    onChange={(e) => setInteriorGrade(e.target.value as Grade | "")}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--chayong-divider)" }}
                  >
                    <option value="">선택</option>
                    <option value="A">A (우수)</option>
                    <option value="B">B (보통)</option>
                    <option value="C">C (불량)</option>
                  </select>
                </div>
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "var(--chayong-text)" }}>
                  반려 사유 (반려 시 필수)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                  style={{ borderColor: "var(--chayong-divider)" }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={!canApprove || saving}
                  className="flex-1 h-11 rounded-xl font-semibold text-[15px] text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: "var(--chayong-success)" }}
                >
                  {saving ? "처리중..." : "승인"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!canReject || saving}
                  className="flex-1 h-11 rounded-xl font-semibold text-[15px] text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: "var(--chayong-danger)" }}
                >
                  {saving ? "처리중..." : "반려"}
                </button>
              </div>
            </>
          )}

          {/* Non-PENDING: Quick status change */}
          {!isPending && allowedTransitions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--chayong-text)" }}>
                상태 변경
              </h3>
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/admin/listings/${listing.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status }),
                        });
                        if (!res.ok) throw new Error("상태 변경 실패");
                        toast.success(`→ ${status}`);
                        onStatusChange(listing.id, status);
                        onOpenChange(false);
                      } catch {
                        toast.error("상태 변경에 실패했습니다.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{
                      borderColor: "var(--chayong-divider)",
                      color: "var(--chayong-text)",
                    }}
                  >
                    → {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/inspection-panel.tsx
git commit -m "feat(admin): add inspection slide-over panel with approve/reject workflow"
```

---

### Task 13: 파이프라인 페이지

**Files:**
- Create: `src/app/admin/pipeline/page.tsx`

- [ ] **Step 1: 파이프라인 페이지 생성**

```tsx
// src/app/admin/pipeline/page.tsx
import { prisma } from "@/lib/db/prisma";
import { PipelineClient } from "./pipeline-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "매물 파이프라인" };

async function getKanbanListings() {
  const listings = await prisma.listing.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      brand: true,
      model: true,
      year: true,
      monthlyPayment: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      seller: { select: { id: true, name: true } },
      _count: { select: { images: true } },
    },
  });

  return listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));
}

export default async function PipelinePage() {
  const listings = await getKanbanListings();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          매물 파이프라인
        </h1>
        <span className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
          총 {listings.length}건
        </span>
      </div>
      <PipelineClient initialListings={listings} />
    </div>
  );
}
```

- [ ] **Step 2: 파이프라인 클라이언트 컴포넌트 생성**

```tsx
// src/app/admin/pipeline/pipeline-client.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ListingKanbanBoard } from "@/features/admin/components/listing-kanban-board";
import { InspectionPanel } from "@/features/admin/components/inspection-panel";
import type { KanbanListing } from "@/types/admin";

interface PipelineClientProps {
  initialListings: KanbanListing[];
}

export function PipelineClient({ initialListings }: PipelineClientProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [selectedListing, setSelectedListing] = useState<KanbanListing | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleCardClick = useCallback((listing: KanbanListing) => {
    setSelectedListing(listing);
    setPanelOpen(true);
  }, []);

  const handleStatusChange = useCallback((listingId: string, newStatus: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
    );
    router.refresh();
  }, [router]);

  return (
    <>
      <ListingKanbanBoard
        initialListings={listings}
        onCardClick={handleCardClick}
      />
      <InspectionPanel
        listing={selectedListing}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 4: dev 서버 실행 및 `/admin/pipeline` 확인**

```bash
bun dev
```

브라우저에서 `http://localhost:3000/admin/pipeline` 접속. 칸반 보드가 렌더링되고 카드 DnD가 작동하는지 확인.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/pipeline/
git commit -m "feat(admin): add pipeline page with kanban board and inspection panel"
```

---

### Task 14: 통합 검증 및 최종 커밋

- [ ] **Step 1: 전체 타입 체크**

```bash
bun run type-check
```

- [ ] **Step 2: 린트**

```bash
bun run lint
```

- [ ] **Step 3: 빌드 확인**

```bash
bun run build
```

- [ ] **Step 4: dev 서버에서 전체 흐름 검증**

1. `/admin` — 대시보드에 4개 액션 카드 + 최근 활동 표시 확인
2. 사이드바 역할 전환 → 메뉴 필터링 확인
3. `/admin/pipeline` — 칸반 보드에 매물 카드 표시 확인
4. 카드 DnD로 DRAFT → PENDING 이동 확인
5. PENDING 카드 클릭 → 검수 패널 열림 확인
6. 체크리스트 체크 → 진행률 바 업데이트 확인
7. 모든 항목 체크 후 "승인" 버튼 활성화 → 승인 시 ACTIVE로 이동 확인
8. 반려 사유 입력 후 "반려" → DRAFT로 이동 확인
9. 잘못된 전이 (예: DRAFT → SOLD) 시도 시 에러 토스트 확인

- [ ] **Step 5: 린트/타입 에러 수정이 필요하면 수정 후 커밋**

```bash
git add -A
git commit -m "fix: resolve lint and type errors from pipeline implementation"
```
