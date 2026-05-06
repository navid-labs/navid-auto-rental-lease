# Admin Listing Edit Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin에서 매물 상세 정보를 조회하고 전체 필드를 편집할 수 있는 페이지 구현

**Architecture:** 서버 컴포넌트(`/admin/listings/[id]`)가 Prisma로 전체 데이터를 fetch하고, 클라이언트 폼 컴포넌트(`ListingEditForm`)에 전달. 폼은 3개 접이식 섹션으로 구성. PATCH API를 확장하여 전체 필드 업데이트 지원.

**Tech Stack:** Next.js 15 App Router, Prisma 6, Zod, shadcn/ui, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/api/admin/listings/[id]/route.ts` | Modify | PATCH 확장 — Zod 검증 + 전체 필드 allowlist |
| `src/app/admin/listings/[id]/page.tsx` | Create | 서버 컴포넌트 — 데이터 fetch + 직렬화 |
| `src/features/admin/components/listing-edit-form.tsx` | Create | 클라이언트 폼 — 3개 접이식 섹션 |
| `src/features/admin/components/listing-admin-table.tsx` | Modify | 매물명에 상세 페이지 Link 추가 |

---

### Task 1: PATCH API 확장 — Zod 스키마 + 전체 필드

**Files:**
- Modify: `src/app/api/admin/listings/[id]/route.ts`

- [ ] **Step 1: PATCH route에 Zod 검증 + 확장 allowlist 적용**

```ts
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

const adminListingUpdateSchema = z.object({
  // 상태
  status: z.nativeEnum(ListingStatus).optional(),
  isVerified: z.boolean().optional(),
  // 차량 기본
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
  // 확장
  vin: z.string().max(17).optional().nullable(),
  displacement: z.number().int().min(0).optional().nullable(),
  bodyType: z.nativeEnum(BodyType).optional().nullable(),
  drivetrain: z.nativeEnum(Drivetrain).optional().nullable(),
  plateType: z.nativeEnum(PlateType).optional().nullable(),
  options: z.array(z.string()).optional(),
  description: z.string().max(5000).optional().nullable(),
  // 신뢰
  accidentCount: z.number().int().min(0).optional().nullable(),
  ownerCount: z.number().int().min(0).optional().nullable(),
  exteriorGrade: z.nativeEnum(Grade).optional().nullable(),
  interiorGrade: z.nativeEnum(Grade).optional().nullable(),
  mileageVerified: z.boolean().optional(),
  registrationRegion: z.string().max(100).optional().nullable(),
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

    // undefined 필드는 Prisma가 무시하므로 그대로 전달
    const listing = await prisma.listing.update({
      where: { id },
      data: parsed.data,
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

Run: `bun run type-check 2>&1 | grep "admin/listings/\[id\]" | head -5`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/admin/listings/\[id\]/route.ts
git commit -m "feat(api): extend admin listings PATCH with zod validation + full field allowlist"
```

---

### Task 2: Admin Listing 상세 페이지 (서버 컴포넌트)

**Files:**
- Create: `src/app/admin/listings/[id]/page.tsx`

- [ ] **Step 1: 서버 컴포넌트 생성**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ListingEditForm } from "@/features/admin/components/listing-edit-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { brand: true, model: true },
  });
  const name = listing
    ? [listing.brand, listing.model].filter(Boolean).join(" ")
    : "매물";
  return { title: `${name} 편집` };
}

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // UUID 형식 기본 검증
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { select: { id: true, url: true, order: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  if (!listing) notFound();

  const serialized = {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    inspectionDate: listing.inspectionDate?.toISOString() ?? null,
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/listings"
          className="text-sm"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          ← 매물 목록
        </Link>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--chayong-text)" }}
        >
          {[listing.brand, listing.model].filter(Boolean).join(" ") || "매물"} 편집
        </h1>
      </div>

      <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--chayong-divider)", backgroundColor: "var(--chayong-surface)" }}>
        <span style={{ color: "var(--chayong-text-sub)" }}>등록자: </span>
        <span style={{ color: "var(--chayong-text)" }}>
          {listing.seller.name ?? listing.seller.email}
        </span>
        <span className="mx-2" style={{ color: "var(--chayong-divider)" }}>|</span>
        <span style={{ color: "var(--chayong-text-sub)" }}>등록일: </span>
        <span style={{ color: "var(--chayong-text)" }}>
          {new Date(listing.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <ListingEditForm listing={serialized} />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check 2>&1 | grep "admin/listings/\[id\]" | head -5`
Expected: ListingEditForm 미존재 에러 (Task 3에서 생성)

- [ ] **Step 3: 커밋 (Task 3 완료 후)**

커밋은 Task 3과 함께 진행

---

### Task 3: ListingEditForm 클라이언트 컴포넌트

**Files:**
- Create: `src/features/admin/components/listing-edit-form.tsx`

- [ ] **Step 1: 폼 컴포넌트 생성**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SerializedListing = {
  id: string;
  status: string;
  type: string;
  isVerified: boolean;
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  color: string | null;
  plateNumber: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  mileage: number | null;
  vin: string | null;
  displacement: number | null;
  bodyType: string | null;
  drivetrain: string | null;
  plateType: string | null;
  options: string[];
  description: string | null;
  accidentCount: number | null;
  ownerCount: number | null;
  exteriorGrade: string | null;
  interiorGrade: string | null;
  mileageVerified: boolean;
  registrationRegion: string | null;
  [key: string]: unknown;
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "임시저장" },
  { value: "PENDING", label: "승인대기" },
  { value: "ACTIVE", label: "활성" },
  { value: "RESERVED", label: "예약" },
  { value: "SOLD", label: "판매완료" },
  { value: "HIDDEN", label: "숨김" },
];

const FUEL_OPTIONS = [
  { value: "", label: "선택" },
  { value: "GASOLINE", label: "가솔린" },
  { value: "DIESEL", label: "디젤" },
  { value: "HYBRID", label: "하이브리드" },
  { value: "PHEV", label: "PHEV" },
  { value: "EV", label: "전기" },
  { value: "HYDROGEN", label: "수소" },
  { value: "LPG", label: "LPG" },
];

const TRANSMISSION_OPTIONS = [
  { value: "", label: "선택" },
  { value: "AUTO", label: "자동" },
  { value: "MANUAL", label: "수동" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
];

const BODY_TYPE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "SEDAN", label: "세단" },
  { value: "SUV", label: "SUV" },
  { value: "HATCH", label: "해치백" },
  { value: "COUPE", label: "쿠페" },
  { value: "WAGON", label: "왜건" },
  { value: "VAN", label: "밴" },
  { value: "TRUCK", label: "트럭" },
  { value: "CONVERTIBLE", label: "컨버터블" },
];

const DRIVETRAIN_OPTIONS = [
  { value: "", label: "선택" },
  { value: "FF", label: "전륜(FF)" },
  { value: "FR", label: "후륜(FR)" },
  { value: "AWD", label: "AWD" },
  { value: "FOURWD", label: "4WD" },
];

const PLATE_TYPE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "PRIVATE", label: "자가용" },
  { value: "COMMERCIAL", label: "영업용" },
];

const GRADE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "A", label: "A (양호)" },
  { value: "B", label: "B (보통)" },
  { value: "C", label: "C (미흡)" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2";
const inputStyle = {
  borderColor: "var(--chayong-divider)",
  color: "var(--chayong-text)",
  backgroundColor: "var(--chayong-bg)",
  "--tw-ring-color": "var(--chayong-primary)",
} as React.CSSProperties;

export function ListingEditForm({ listing }: { listing: SerializedListing }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    status: listing.status,
    isVerified: listing.isVerified,
    brand: listing.brand ?? "",
    model: listing.model ?? "",
    year: listing.year ?? "",
    trim: listing.trim ?? "",
    color: listing.color ?? "",
    plateNumber: listing.plateNumber ?? "",
    fuelType: listing.fuelType ?? "",
    transmission: listing.transmission ?? "",
    seatingCapacity: listing.seatingCapacity ?? "",
    mileage: listing.mileage ?? "",
    vin: listing.vin ?? "",
    displacement: listing.displacement ?? "",
    bodyType: listing.bodyType ?? "",
    drivetrain: listing.drivetrain ?? "",
    plateType: listing.plateType ?? "",
    options: listing.options.join(", "),
    description: listing.description ?? "",
    accidentCount: listing.accidentCount ?? "",
    ownerCount: listing.ownerCount ?? "",
    exteriorGrade: listing.exteriorGrade ?? "",
    interiorGrade: listing.interiorGrade ?? "",
    mileageVerified: listing.mileageVerified,
    registrationRegion: listing.registrationRegion ?? "",
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const toNum = (v: string | number) =>
      v === "" || v === null ? null : Number(v);
    const toNullStr = (v: string) => (v === "" ? null : v);

    const payload = {
      status: form.status,
      isVerified: form.isVerified,
      brand: toNullStr(form.brand),
      model: toNullStr(form.model),
      year: toNum(form.year),
      trim: toNullStr(form.trim),
      color: toNullStr(form.color),
      plateNumber: toNullStr(form.plateNumber),
      fuelType: toNullStr(form.fuelType) as string | null,
      transmission: toNullStr(form.transmission) as string | null,
      seatingCapacity: toNum(form.seatingCapacity),
      mileage: toNum(form.mileage),
      vin: toNullStr(form.vin),
      displacement: toNum(form.displacement),
      bodyType: toNullStr(form.bodyType) as string | null,
      drivetrain: toNullStr(form.drivetrain) as string | null,
      plateType: toNullStr(form.plateType) as string | null,
      options: form.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: toNullStr(form.description),
      accidentCount: toNum(form.accidentCount),
      ownerCount: toNum(form.ownerCount),
      exteriorGrade: toNullStr(form.exteriorGrade) as string | null,
      interiorGrade: toNullStr(form.interiorGrade) as string | null,
      mileageVerified: form.mileageVerified,
      registrationRegion: toNullStr(form.registrationRegion),
    };

    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key: string, type = "text", extra?: Record<string, unknown>) => (
    <input
      type={type}
      value={String(form[key as keyof typeof form] ?? "")}
      onChange={(e) => set(key, e.target.value)}
      className={inputClass}
      style={inputStyle}
      {...extra}
    />
  );

  const renderSelect = (key: string, options: { value: string; label: string }[]) => (
    <select
      value={String(form[key as keyof typeof form] ?? "")}
      onChange={(e) => set(key, e.target.value)}
      className={inputClass}
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 상태 관리 */}
      <div
        className="flex items-center gap-4 rounded-xl border p-4"
        style={{ borderColor: "var(--chayong-divider)", backgroundColor: "var(--chayong-surface)" }}
      >
        <Field label="상태">
          {renderSelect("status", STATUS_OPTIONS)}
        </Field>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--chayong-text)" }}>
          <input
            type="checkbox"
            checked={form.isVerified}
            onChange={(e) => set("isVerified", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          안심매물
        </label>
      </div>

      {/* 차량 기본 정보 */}
      <details open className="rounded-xl border" style={{ borderColor: "var(--chayong-divider)" }}>
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          차량 기본 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="브랜드">{renderInput("brand")}</Field>
          <Field label="모델">{renderInput("model")}</Field>
          <Field label="연식">{renderInput("year", "number")}</Field>
          <Field label="트림">{renderInput("trim")}</Field>
          <Field label="색상">{renderInput("color")}</Field>
          <Field label="차량번호">{renderInput("plateNumber")}</Field>
          <Field label="연료">{renderSelect("fuelType", FUEL_OPTIONS)}</Field>
          <Field label="변속기">{renderSelect("transmission", TRANSMISSION_OPTIONS)}</Field>
          <Field label="인승">{renderInput("seatingCapacity", "number")}</Field>
          <Field label="주행거리(km)">{renderInput("mileage", "number")}</Field>
        </div>
      </details>

      {/* 확장 정보 */}
      <details className="rounded-xl border" style={{ borderColor: "var(--chayong-divider)" }}>
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          확장 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="VIN (17자)">{renderInput("vin", "text", { maxLength: 17 })}</Field>
          <Field label="배기량(cc)">{renderInput("displacement", "number")}</Field>
          <Field label="차종">{renderSelect("bodyType", BODY_TYPE_OPTIONS)}</Field>
          <Field label="구동방식">{renderSelect("drivetrain", DRIVETRAIN_OPTIONS)}</Field>
          <Field label="차량용도">{renderSelect("plateType", PLATE_TYPE_OPTIONS)}</Field>
          <div className="sm:col-span-2">
            <Field label="옵션 (쉼표 구분)">
              <input
                type="text"
                value={form.options}
                onChange={(e) => set("options", e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="파노라마 선루프, HUD, 통풍시트"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="설명">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                style={inputStyle}
                rows={4}
              />
            </Field>
          </div>
        </div>
      </details>

      {/* 신뢰 정보 */}
      <details className="rounded-xl border" style={{ borderColor: "var(--chayong-divider)" }}>
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chayong-text)" }}
        >
          신뢰 정보
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label="사고 횟수">{renderInput("accidentCount", "number")}</Field>
          <Field label="소유자 수">{renderInput("ownerCount", "number")}</Field>
          <Field label="외관 등급">{renderSelect("exteriorGrade", GRADE_OPTIONS)}</Field>
          <Field label="내장 등급">{renderSelect("interiorGrade", GRADE_OPTIONS)}</Field>
          <Field label="등록 지역">{renderInput("registrationRegion")}</Field>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--chayong-text)" }}>
            <input
              type="checkbox"
              checked={form.mileageVerified}
              onChange={(e) => set("mileageVerified", e.target.checked)}
              className="h-4 w-4 rounded"
            />
            주행거리 검증됨
          </label>
        </div>
      </details>

      {/* 액션 */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-12 rounded-xl px-8 text-[15px] font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {success && (
          <span className="text-sm font-medium" style={{ color: "var(--chayong-success)" }}>
            저장되었습니다
          </span>
        )}
        {error && (
          <span className="text-sm font-medium" style={{ color: "var(--chayong-danger)" }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check 2>&1 | grep "listing-edit-form\|admin/listings/\[id\]" | head -5`
Expected: 0 errors

- [ ] **Step 3: 커밋 (페이지 + 폼 함께)**

```bash
git add src/app/admin/listings/\[id\]/page.tsx src/features/admin/components/listing-edit-form.tsx
git commit -m "feat(admin): add listing detail/edit page with full-field form"
```

---

### Task 4: 테이블에 상세 페이지 링크 추가

**Files:**
- Modify: `src/features/admin/components/listing-admin-table.tsx`

- [ ] **Step 1: 매물명 셀을 Link로 변경**

`listing-admin-table.tsx` 상단에 import 추가:
```tsx
import Link from "next/link";
```

매물 `<td>` 셀 (line ~110-117) 변경:

기존:
```tsx
<td className="px-4 py-3" style={{ color: "var(--chayong-text)" }}>
  {row.brand && row.model ? `${row.brand} ${row.model}` : "정보 미입력"}
</td>
```

변경:
```tsx
<td className="px-4 py-3">
  <Link
    href={`/admin/listings/${row.id}`}
    className="font-medium underline-offset-2 hover:underline"
    style={{ color: "var(--chayong-primary)" }}
  >
    {row.brand && row.model ? `${row.brand} ${row.model}` : "정보 미입력"}
  </Link>
</td>
```

- [ ] **Step 2: 타입 체크**

Run: `bun run type-check 2>&1 | grep "listing-admin-table" | head -5`
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/features/admin/components/listing-admin-table.tsx
git commit -m "feat(admin): link listing names to detail/edit page"
```

---

### Task 5: 최종 검증

- [ ] **Step 1: 전체 품질 게이트**

Run: `bun run type-check 2>&1 | grep "error TS" | grep -v "accidentFree\|src/types/index.ts" | head -5`
Expected: 0 errors

Run: `bun run test -- --run 2>&1 | tail -5`
Expected: 전체 통과

- [ ] **Step 2: 브라우저 스모크 테스트**

1. `/admin/listings` → 매물명 클릭 → 편집 페이지 이동 확인
2. 필드 수정 → 저장 → "저장되었습니다" 표시 확인
3. 페이지 새로고침 → 수정값 유지 확인
4. 잘못된 UUID `/admin/listings/invalid` → 404 확인

- [ ] **Step 3: 커밋 + 푸시**

```bash
git push origin main
```
