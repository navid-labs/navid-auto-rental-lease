# Remaining Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4개 잔존 기능 구현 — 진단서 PDF 뷰어, 차량 비교, 딜러 평점/후기, MDX 블로그

**Architecture:** Next.js 15 App Router. Phase 1/3/5는 독립(병렬 가능), Phase 4는 스키마 변경 선행. 기존 Zustand store에 비교 로직 이미 구현됨 — UI만 연결.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Prisma 6, Zustand 5, react-pdf, next-mdx-remote, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-04-16-remaining-features-design.md`

---

## File Structure

### Phase 1 — 진단서 뷰어
| File | Responsibility |
|------|---------------|
| `src/features/listings/components/inspection-report-viewer.tsx` | PDF 인라인 뷰어 모달 (신규) |
| `src/features/listings/components/vehicle-diagnosis.tsx` | 기존 "점검기록부 보기" 버튼 → 모달 트리거로 변경 |

### Phase 3 — 차량 비교
| File | Responsibility |
|------|---------------|
| `src/features/compare/compare-floating-bar.tsx` | 하단 플로팅 비교 바 (신규) |
| `src/features/compare/compare-table.tsx` | 비교 테이블 컴포넌트 (신규) |
| `src/app/(public)/compare/page.tsx` | 비교 페이지 (신규) |
| `src/components/ui/vehicle-card.tsx` | 비교 체크박스 추가 (수정) |
| `src/app/(public)/list/page.tsx` | CompareFloatingBar 마운트 (수정) |

### Phase 4 — 딜러 평점
| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | DealerReview 모델 추가 (수정) |
| `src/app/api/reviews/route.ts` | GET/POST API (신규) |
| `src/features/reviews/components/star-rating.tsx` | 별점 입력/표시 (신규) |
| `src/features/reviews/components/review-list.tsx` | 후기 목록 (신규) |
| `src/features/reviews/components/review-form.tsx` | 후기 작성 폼 (신규) |
| `src/features/listings/components/seller-card.tsx` | 평균 별점 표시 추가 (수정) |

### Phase 5 — 블로그
| File | Responsibility |
|------|---------------|
| `src/lib/blog/mdx.ts` | MDX 파일 파싱 유틸 (신규) |
| `src/features/blog/components/blog-card.tsx` | 블로그 카드 (신규) |
| `src/features/blog/components/mdx-components.tsx` | MDX 커스텀 렌더러 (신규) |
| `src/app/(public)/blog/page.tsx` | 블로그 목록 (신규) |
| `src/app/(public)/blog/[slug]/page.tsx` | 블로그 상세 (신규) |
| `content/blog/*.mdx` | MDX 콘텐츠 3편 (신규) |
| `src/components/layout/footer.tsx` | 블로그 링크 추가 (수정) |

---

## Phase 1: 진단서 원본 뷰어

### Task 1: react-pdf 패키지 설치

- [ ] **Step 1: Install react-pdf**

```bash
bun add react-pdf
```

- [ ] **Step 2: Verify install**

Run: `bun run type-check`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add react-pdf for PDF viewer"
```

---

### Task 2: InspectionReportViewer 컴포넌트

**Files:**
- Create: `src/features/listings/components/inspection-report-viewer.tsx`

- [ ] **Step 1: Create the PDF viewer modal component**

```tsx
// src/features/listings/components/inspection-report-viewer.tsx
"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";

// pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InspectionReportViewerProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspectionReportViewer({
  url,
  open,
  onOpenChange,
}: InspectionReportViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setPageNumber(1);
      setLoading(false);
    },
    [],
  );

  function goToPrev() {
    setPageNumber((p) => Math.max(1, p - 1));
  }

  function goToNext() {
    setPageNumber((p) => Math.min(numPages, p + 1));
  }

  function zoomIn() {
    setScale((s) => Math.min(2.0, s + 0.25));
  }

  function zoomOut() {
    setScale((s) => Math.max(0.5, s - 0.25));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-sm font-semibold">
            성능·상태 점검기록부
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="축소"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs tabular-nums" style={{ color: "var(--chayong-text-sub)" }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="확대"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </DialogHeader>

        {/* PDF content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--chayong-primary)] border-t-transparent" />
            </div>
          )}
          <div className="flex justify-center">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
              error={
                <div className="flex h-64 items-center justify-center text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                  PDF를 불러올 수 없습니다
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
              />
            </Document>
          </div>
        </div>

        {/* Page navigation */}
        {numPages > 1 && (
          <div
            className="flex items-center justify-center gap-4 border-t px-4 py-3"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <button
              type="button"
              onClick={goToPrev}
              disabled={pageNumber <= 1}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="이전 페이지"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm tabular-nums" style={{ color: "var(--chayong-text)" }}>
              {pageNumber} / {numPages}
            </span>
            <button
              type="button"
              onClick={goToNext}
              disabled={pageNumber >= numPages}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="다음 페이지"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/inspection-report-viewer.tsx
git commit -m "feat(detail): add InspectionReportViewer PDF modal"
```

---

### Task 3: VehicleDiagnosis에 뷰어 연결

**Files:**
- Modify: `src/features/listings/components/vehicle-diagnosis.tsx`

- [ ] **Step 1: Convert to client component and integrate viewer**

Add `"use client"` at the top of `vehicle-diagnosis.tsx`, add state for modal, import the viewer, and replace the external link button with a modal trigger:

Replace the entire footer section (lines 192-221) with:

```tsx
// At top of file, add:
"use client";

import { useState } from "react";
import { InspectionReportViewer } from "./inspection-report-viewer";

// ... existing code unchanged ...

// Replace the footer div (lines 192-221) in VehicleDiagnosis:
export function VehicleDiagnosis(props: VehicleDiagnosisProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  // ... existing destructuring and detailItems ...

  return (
    <section aria-label="차량 진단" className="space-y-4">
      {/* ... existing summary cards and detail grid unchanged ... */}

      {/* Footer: inspection date + report link */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          진단일: {formatInspectionDate(inspectionDate)}
        </span>
        {inspectionReportUrl ? (
          <>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50"
              style={{
                borderColor: "var(--chayong-primary)",
                color: "var(--chayong-primary)",
              }}
            >
              점검기록부 보기
            </button>
            <InspectionReportViewer
              url={inspectionReportUrl}
              open={viewerOpen}
              onOpenChange={setViewerOpen}
            />
          </>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-40"
            style={{
              borderColor: "var(--chayong-border)",
              color: "var(--chayong-text-caption)",
            }}
          >
            점검기록부 보기
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Verify in browser**

Check: http://localhost:3000/detail/[any-id] — 차량 진단 섹션에서 "점검기록부 보기" 클릭 시 모달 열림 (URL이 있는 경우)

- [ ] **Step 4: Commit**

```bash
git add src/features/listings/components/vehicle-diagnosis.tsx
git commit -m "feat(detail): wire InspectionReportViewer to VehicleDiagnosis"
```

---

## Phase 3: 차량 비교

### Task 4: CompareFloatingBar 컴포넌트

**Files:**
- Create: `src/features/compare/compare-floating-bar.tsx`

- [ ] **Step 1: Create floating comparison bar**

```tsx
// src/features/compare/compare-floating-bar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useVehicleInteractionStore } from "@/lib/stores/vehicle-interaction-store";

export function CompareFloatingBar() {
  const comparison = useVehicleInteractionStore((s) => s.comparison);
  const removeFromComparison = useVehicleInteractionStore((s) => s.removeFromComparison);
  const clearComparison = useVehicleInteractionStore((s) => s.clearComparison);

  if (comparison.length === 0) return null;

  const ids = comparison.map((v) => v.id).join(",");

  return (
    <div
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl md:bottom-6"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      {/* Vehicle thumbnails */}
      <div className="flex gap-2">
        {comparison.map((v) => (
          <div key={v.id} className="relative">
            <div className="h-12 w-16 overflow-hidden rounded-lg bg-[var(--chayong-surface)]">
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt={`${v.brandName} ${v.modelName}`}
                  width={64}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
                  {v.brandName}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeFromComparison(v.id)}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-white"
              aria-label={`${v.brandName} ${v.modelName} 비교 제거`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: 3 - comparison.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-12 w-16 items-center justify-center rounded-lg border-2 border-dashed"
            style={{ borderColor: "var(--chayong-border)" }}
          >
            <span className="text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
              +
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/compare?ids=${ids}`}
          className="inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          {comparison.length}대 비교
        </Link>
        <button
          type="button"
          onClick={clearComparison}
          className="text-xs underline"
          style={{ color: "var(--chayong-text-caption)" }}
        >
          초기화
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/features/compare/compare-floating-bar.tsx
git commit -m "feat(compare): add CompareFloatingBar component"
```

---

### Task 5: VehicleCard에 비교 체크박스 추가

**Files:**
- Modify: `src/components/ui/vehicle-card.tsx`

- [ ] **Step 1: Add compare checkbox overlay**

The card is currently a `<Link>` wrapping everything. We need to add a compare button that doesn't trigger navigation. Wrap the card content differently:

Replace the entire `vehicle-card.tsx`:

```tsx
// src/components/ui/vehicle-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, GitCompareArrows } from "lucide-react";
import type { ListingCardData } from "@/types";
import { PriceDisplay } from "./price-display";
import { TrustBadge } from "./trust-badge";
import { useVehicleInteractionStore } from "@/lib/stores/vehicle-interaction-store";
import type { VehicleSummary } from "@/lib/stores/vehicle-interaction-store";

interface VehicleCardProps {
  listing: ListingCardData;
  priority?: boolean;
  showCompare?: boolean;
}

export function VehicleCard({ listing, priority = false, showCompare = false }: VehicleCardProps) {
  const {
    id,
    brand,
    model,
    year,
    trim,
    mileage,
    monthlyPayment,
    initialCost,
    remainingMonths,
    isVerified,
    accidentCount,
    viewCount,
    favoriteCount,
    primaryImage,
    options,
  } = listing;

  const toggleComparison = useVehicleInteractionStore((s) => s.toggleComparison);
  const isInComparison = useVehicleInteractionStore((s) => s.isInComparison);
  const inComparison = isInComparison(id);

  const MAX_CHIPS = 5;
  const visibleOptions = options.slice(0, MAX_CHIPS);
  const remainingCount = options.length - MAX_CHIPS;

  const vehicleName = `${brand} ${model}`;
  const subtitle = [year && `${year}년`, trim, mileage && `${mileage.toLocaleString("ko-KR")}km`]
    .filter(Boolean)
    .join(" · ");

  function handleCompareClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const summary: VehicleSummary = {
      id,
      brandName: brand ?? "",
      modelName: model ?? "",
      year: year ?? 0,
      mileage: mileage ?? 0,
      price: monthlyPayment,
      thumbnailUrl: primaryImage,
    };
    toggleComparison(summary);
  }

  return (
    <Link
      href={`/detail/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-[var(--chayong-bg)] shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--chayong-surface)]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={vehicleName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
              이미지 없음
            </span>
          </div>
        )}

        {/* TrustBadge overlay */}
        {isVerified && (
          <div className="absolute left-2 top-2">
            <TrustBadge variant="compact" />
          </div>
        )}

        {/* Compare button overlay */}
        {showCompare && (
          <button
            type="button"
            onClick={handleCompareClick}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              inComparison
                ? "border-[var(--chayong-primary)] bg-[var(--chayong-primary)] text-white"
                : "border-white/70 bg-white/80 text-gray-600 hover:bg-white"
            }`}
            aria-label={inComparison ? "비교 제거" : "비교 추가"}
          >
            <GitCompareArrows size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
          {vehicleName}
        </p>
        <p className="truncate text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          {subtitle}
        </p>

        <PriceDisplay monthlyPayment={monthlyPayment} size="md" />

        <div className="flex items-center justify-between text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          <span>
            보증금 {initialCost ? `${(initialCost / 10000).toLocaleString("ko-KR")}만원` : "없음"}
            {remainingMonths ? ` · 잔여 ${remainingMonths}개월` : ""}
          </span>
        </div>

        {/* Options chips */}
        {visibleOptions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleOptions.map((opt) => (
              <span
                key={opt}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]"
              >
                {opt}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--chayong-surface)] text-[var(--chayong-text-sub)]">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Accident count badge */}
        {accidentCount !== undefined && accidentCount !== null && accidentCount > 0 && (
          <span className="text-[10px] font-medium" style={{ color: "var(--chayong-danger)" }}>
            사고 {accidentCount}회
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 border-t pt-2" style={{ borderColor: "var(--chayong-divider)" }}>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            <Eye size={12} />
            {viewCount.toLocaleString("ko-KR")}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            <Heart size={12} />
            {favoriteCount.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/vehicle-card.tsx
git commit -m "feat(compare): add compare toggle to VehicleCard"
```

---

### Task 6: Compare 페이지

**Files:**
- Create: `src/features/compare/compare-table.tsx`
- Create: `src/app/(public)/compare/page.tsx`

- [ ] **Step 1: Create CompareTable component**

```tsx
// src/features/compare/compare-table.tsx
import Image from "next/image";
import Link from "next/link";
import type { Listing, ListingImage } from "@prisma/client";
import { PriceDisplay } from "@/components/ui/price-display";
import { formatKRW } from "@/lib/utils/format";

type ListingWithImages = Listing & { images: ListingImage[] };

interface CompareTableProps {
  listings: ListingWithImages[];
}

const FUEL_LABEL: Record<string, string> = {
  GASOLINE: "가솔린",
  DIESEL: "디젤",
  HYBRID: "하이브리드",
  PHEV: "플러그인 하이브리드",
  EV: "전기",
  HYDROGEN: "수소",
  LPG: "LPG",
};

const TRANS_LABEL: Record<string, string> = {
  AUTO: "자동",
  MANUAL: "수동",
  CVT: "CVT",
  DCT: "DCT",
};

interface Row {
  label: string;
  values: (string | number | null)[];
  highlight?: "lowest" | "none";
  format?: "krw" | "km" | "months" | "text";
}

function findLowestIndex(values: (string | number | null)[]): number {
  let minVal = Infinity;
  let minIdx = -1;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v === "number" && v < minVal) {
      minVal = v;
      minIdx = i;
    }
  }
  return minIdx;
}

function formatValue(
  val: string | number | null,
  format?: string,
): string {
  if (val === null || val === undefined) return "-";
  if (format === "krw" && typeof val === "number")
    return `${val.toLocaleString("ko-KR")}원`;
  if (format === "km" && typeof val === "number")
    return `${val.toLocaleString("ko-KR")}km`;
  if (format === "months" && typeof val === "number") return `${val}개월`;
  return String(val);
}

export function CompareTable({ listings }: CompareTableProps) {
  const rows: Row[] = [
    {
      label: "월 납입금",
      values: listings.map((l) => l.monthlyPayment),
      highlight: "lowest",
      format: "krw",
    },
    {
      label: "초기비용",
      values: listings.map((l) => l.initialCost),
      highlight: "lowest",
      format: "krw",
    },
    {
      label: "잔여개월",
      values: listings.map((l) => l.remainingMonths),
      format: "months",
    },
    {
      label: "연식",
      values: listings.map((l) => (l.year ? `${l.year}년` : null)),
    },
    {
      label: "주행거리",
      values: listings.map((l) => l.mileage),
      highlight: "lowest",
      format: "km",
    },
    {
      label: "연료",
      values: listings.map((l) =>
        l.fuelType ? (FUEL_LABEL[l.fuelType] ?? l.fuelType) : null,
      ),
    },
    {
      label: "변속기",
      values: listings.map((l) =>
        l.transmission ? (TRANS_LABEL[l.transmission] ?? l.transmission) : null,
      ),
    },
    {
      label: "사고이력",
      values: listings.map((l) =>
        l.accidentCount === 0 ? "무사고" : `${l.accidentCount}회`,
      ),
    },
    {
      label: "옵션",
      values: listings.map((l) =>
        l.options.length > 0 ? l.options.slice(0, 3).join(", ") : "-",
      ),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        {/* Header: vehicle images + names */}
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-28 bg-white p-3 text-left text-xs font-medium" style={{ color: "var(--chayong-text-caption)" }}>
              비교 항목
            </th>
            {listings.map((l) => {
              const primaryImage = l.images.find((img) => img.isPrimary)?.url ?? l.images[0]?.url;
              const name = `${l.brand ?? ""} ${l.model ?? ""}`.trim() || "차량";
              return (
                <th key={l.id} className="p-3 text-center">
                  <Link href={`/detail/${l.id}`} className="group">
                    <div className="mx-auto mb-2 h-20 w-28 overflow-hidden rounded-lg bg-[var(--chayong-surface)]">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={name}
                          width={112}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--chayong-text-caption)" }}>
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--chayong-text)" }}>
                      {name}
                    </p>
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lowestIdx =
              row.highlight === "lowest" ? findLowestIndex(row.values) : -1;
            return (
              <tr
                key={row.label}
                className="border-t"
                style={{ borderColor: "var(--chayong-divider)" }}
              >
                <td
                  className="sticky left-0 z-10 bg-white p-3 text-xs font-medium"
                  style={{ color: "var(--chayong-text-caption)" }}
                >
                  {row.label}
                </td>
                {row.values.map((val, i) => (
                  <td
                    key={listings[i].id}
                    className="p-3 text-center text-sm font-medium"
                    style={{
                      color:
                        i === lowestIdx
                          ? "var(--chayong-primary)"
                          : "var(--chayong-text)",
                      fontWeight: i === lowestIdx ? 700 : 500,
                    }}
                  >
                    {formatValue(val, row.format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create compare page**

```tsx
// src/app/(public)/compare/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { CompareTable } from "@/features/compare/compare-table";

export const metadata: Metadata = {
  title: "차량 비교",
  description: "선택한 차량의 사양과 금융 조건을 나란히 비교하세요.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids } = await searchParams;

  if (!ids) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
          비교할 차량을 선택해주세요
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
          매물 목록에서 비교 버튼을 눌러 최대 3대를 선택하세요.
        </p>
        <Link
          href="/list"
          className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          매물 보러 가기
        </Link>
      </div>
    );
  }

  const idList = ids.split(",").slice(0, 3);

  const listings = await prisma.listing.findMany({
    where: { id: { in: idList } },
    include: {
      images: { orderBy: { order: "asc" } },
    },
  });

  if (listings.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
          매물을 찾을 수 없습니다
        </h1>
        <Link
          href="/list"
          className="mt-6 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold text-white"
          style={{ backgroundColor: "var(--chayong-primary)" }}
        >
          매물 보러 가기
        </Link>
      </div>
    );
  }

  // Maintain order from URL
  const ordered = idList
    .map((id) => listings.find((l) => l.id === id))
    .filter(Boolean) as typeof listings;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
          차량 비교
        </h1>
        <Link
          href="/list"
          className="text-sm font-medium"
          style={{ color: "var(--chayong-primary)" }}
        >
          &larr; 목록으로
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--chayong-border)" }}
      >
        <CompareTable listings={ordered} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/features/compare/compare-table.tsx src/app/\(public\)/compare/page.tsx
git commit -m "feat(compare): add compare page with comparison table"
```

---

### Task 7: LIST 페이지에 FloatingBar + showCompare 연결

**Files:**
- Modify: `src/app/(public)/list/page.tsx`

- [ ] **Step 1: Add CompareFloatingBar and pass showCompare to VehicleCard**

At the top of `list/page.tsx`, add import:

```tsx
import { CompareFloatingBar } from "@/features/compare/compare-floating-bar";
```

Before the closing `</div>` of the page (just before `</div>` on the last line), add:

```tsx
<CompareFloatingBar />
```

In the `ListingGrid` component call or wherever `VehicleCard` is rendered, add `showCompare` prop:

```tsx
<VehicleCard listing={listing} showCompare />
```

- [ ] **Step 2: Verify in browser**

Check: http://localhost:3000/list — 카드 우측 상단에 비교 아이콘, 클릭 시 하단 플로팅 바 표시, "N대 비교" 클릭 시 /compare 페이지 이동

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/list/page.tsx
git commit -m "feat(list): mount CompareFloatingBar + enable compare on cards"
```

---

## Phase 4: 딜러 평점/후기

### Task 8: DealerReview 스키마 추가

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add DealerReview model**

At the end of `prisma/schema.prisma`, add:

```prisma
model DealerReview {
  id         String   @id @default(uuid()) @db.Uuid
  reviewerId String   @map("reviewer_id") @db.Uuid
  dealerId   String   @map("dealer_id") @db.Uuid
  listingId  String   @map("listing_id") @db.Uuid
  rating     Int      // 1~5
  comment    String
  createdAt  DateTime @default(now()) @map("created_at")

  reviewer Profile @relation("ReviewsWritten", fields: [reviewerId], references: [id])
  dealer   Profile @relation("ReviewsReceived", fields: [dealerId], references: [id])
  listing  Listing @relation(fields: [listingId], references: [id])

  @@unique([reviewerId, listingId])
  @@index([dealerId, createdAt(sort: Desc)])
  @@map("dealer_reviews")
}
```

- [ ] **Step 2: Add reverse relations to Profile and Listing**

In the `Profile` model, after `notifications` relation, add:

```prisma
  reviewsWritten  DealerReview[] @relation("ReviewsWritten")
  reviewsReceived DealerReview[] @relation("ReviewsReceived")
```

In the `Listing` model, after `favorites` relation, add:

```prisma
  reviews  DealerReview[]
```

- [ ] **Step 3: Push schema**

```bash
bun run db:generate
bun run db:push
```

- [ ] **Step 4: Verify**

Run: `bun run type-check`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add DealerReview model"
```

---

### Task 9: Reviews API

**Files:**
- Create: `src/app/api/reviews/route.ts`

- [ ] **Step 1: Create GET + POST API**

```tsx
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/api/auth-guard";
import { z } from "zod";

const createReviewSchema = z.object({
  dealerId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const dealerId = req.nextUrl.searchParams.get("dealerId");
    if (!dealerId) {
      return NextResponse.json({ error: "dealerId required" }, { status: 400 });
    }

    const reviews = await prisma.dealerReview.findMany({
      where: { dealerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        reviewer: { select: { name: true } },
      },
    });

    // Calculate average
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      average: Math.round(avg * 10) / 10,
      count: reviews.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { dealerId, listingId, rating, comment } = parsed.data;

    // Verify listing exists and is SOLD
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "SOLD") {
      return NextResponse.json(
        { error: "거래 완료된 매물만 후기를 작성할 수 있습니다" },
        { status: 403 },
      );
    }

    if (listing.sellerId !== dealerId) {
      return NextResponse.json({ error: "Invalid dealer" }, { status: 400 });
    }

    // Prevent self-review
    if (userId === dealerId) {
      return NextResponse.json({ error: "자신에게 후기를 남길 수 없습니다" }, { status: 403 });
    }

    const review = await prisma.dealerReview.create({
      data: {
        reviewerId: userId,
        dealerId,
        listingId,
        rating,
        comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "이미 이 매물에 대한 후기를 작성하셨습니다" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reviews/route.ts
git commit -m "feat(api): add dealer reviews GET/POST endpoints"
```

---

### Task 10: StarRating + ReviewList + ReviewForm 컴포넌트

**Files:**
- Create: `src/features/reviews/components/star-rating.tsx`
- Create: `src/features/reviews/components/review-list.tsx`
- Create: `src/features/reviews/components/review-form.tsx`

- [ ] **Step 1: Create StarRating**

```tsx
// src/features/reviews/components/star-rating.tsx
"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            aria-label={`${i + 1}점`}
          >
            <Star
              size={size}
              fill={filled ? "#FBBF24" : "none"}
              stroke={filled ? "#FBBF24" : "#D1D5DB"}
            />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create ReviewList**

```tsx
// src/features/reviews/components/review-list.tsx
"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./star-rating";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string | null };
}

interface ReviewListProps {
  dealerId: string;
}

export function ReviewList({ dealerId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?dealerId=${dealerId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setAverage(data.average ?? 0);
        setCount(data.count ?? 0);
      })
      .finally(() => setLoading(false));
  }, [dealerId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-[var(--chayong-surface)]" />
        <div className="h-16 rounded bg-[var(--chayong-surface)]" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
        아직 후기가 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2">
        <StarRating rating={average} size={14} />
        <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--chayong-text)" }}>
          {average}
        </span>
        <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          ({count}개 후기)
        </span>
      </div>

      {/* Review items */}
      <div className="space-y-2">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--chayong-text)" }}>
                  {r.reviewer.name ?? "익명"}
                </span>
                <StarRating rating={r.rating} size={12} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
                {new Date(r.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
              {r.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ReviewForm**

```tsx
// src/features/reviews/components/review-form.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StarRating } from "./star-rating";

interface ReviewFormProps {
  dealerId: string;
  listingId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ dealerId, listingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("별점을 선택해주세요");
      return;
    }
    if (comment.trim().length === 0) {
      toast.error("후기를 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, listingId, rating, comment: comment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "후기 작성에 실패했습니다");
        return;
      }

      toast.success("후기가 등록되었습니다");
      setRating(0);
      setComment("");
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          별점
        </label>
        <StarRating rating={rating} size={24} interactive onChange={setRating} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          후기 (100자 이내)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 100))}
          placeholder="거래 경험을 남겨주세요"
          rows={3}
          className="w-full rounded-lg border p-3 text-sm outline-none focus:ring-1 focus:ring-[var(--chayong-primary)]"
          style={{ borderColor: "var(--chayong-border)" }}
        />
        <span className="text-[10px] tabular-nums" style={{ color: "var(--chayong-text-caption)" }}>
          {comment.length}/100
        </span>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        {submitting ? "등록 중..." : "후기 등록"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 5: Commit**

```bash
git add src/features/reviews/
git commit -m "feat(reviews): add StarRating, ReviewList, ReviewForm components"
```

---

### Task 11: SellerCard에 평점 표시 연결

**Files:**
- Modify: `src/features/listings/components/seller-card.tsx`

- [ ] **Step 1: Read current seller-card.tsx and add ReviewList**

Add ReviewList import and render it below the seller info:

```tsx
import { ReviewList } from "@/features/reviews/components/review-list";
```

Inside the SellerCard component, after the existing seller info section, add:

```tsx
{/* Dealer reviews */}
<div className="mt-4 border-t pt-4" style={{ borderColor: "var(--chayong-divider)" }}>
  <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
    판매자 후기
  </h3>
  <ReviewList dealerId={sellerId} />
</div>
```

- [ ] **Step 2: Verify in browser**

Check: http://localhost:3000/detail/[any-id] — SellerCard 하단에 후기 섹션 표시

- [ ] **Step 3: Commit**

```bash
git add src/features/listings/components/seller-card.tsx
git commit -m "feat(detail): integrate ReviewList into SellerCard"
```

---

## Phase 5: 블로그 (MDX)

### Task 12: next-mdx-remote 설치

- [ ] **Step 1: Install dependencies**

```bash
bun add next-mdx-remote gray-matter
```

- [ ] **Step 2: Verify install**

Run: `bun run type-check`

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add next-mdx-remote and gray-matter for blog"
```

---

### Task 13: MDX 파싱 유틸

**Files:**
- Create: `src/lib/blog/mdx.ts`

- [ ] **Step 1: Create blog utility**

```tsx
// src/lib/blog/mdx.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogFrontmatter {
  title: string;
  date: string;
  description: string;
  category: string;
  thumbnail?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const filePath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      frontmatter: data as BlogFrontmatter,
      content,
    };
  });

  // Sort by date descending
  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    frontmatter: data as BlogFrontmatter,
    content,
  };
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.frontmatter.category))];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/blog/mdx.ts
git commit -m "feat(blog): add MDX parsing utilities"
```

---

### Task 14: MDX 컴포넌트 + BlogCard

**Files:**
- Create: `src/features/blog/components/mdx-components.tsx`
- Create: `src/features/blog/components/blog-card.tsx`

- [ ] **Step 1: Create MDX custom components**

```tsx
// src/features/blog/components/mdx-components.tsx
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1
      className="mb-4 mt-8 text-2xl font-bold"
      style={{ color: "var(--chayong-text)" }}
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mb-3 mt-6 text-xl font-bold"
      style={{ color: "var(--chayong-text)" }}
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mb-2 mt-5 text-lg font-semibold"
      style={{ color: "var(--chayong-text)" }}
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="mb-4 text-sm leading-relaxed"
      style={{ color: "var(--chayong-text-sub)" }}
      {...props}
    />
  ),
  ul: (props) => <ul className="mb-4 list-disc space-y-1 pl-5 text-sm" {...props} />,
  ol: (props) => <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm" {...props} />,
  li: (props) => (
    <li style={{ color: "var(--chayong-text-sub)" }} {...props} />
  ),
  table: (props) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b px-4 py-2 text-left font-semibold"
      style={{ borderColor: "var(--chayong-divider)", color: "var(--chayong-text)" }}
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border-b px-4 py-2"
      style={{ borderColor: "var(--chayong-divider)", color: "var(--chayong-text-sub)" }}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-4 border-l-4 py-1 pl-4 text-sm italic"
      style={{
        borderColor: "var(--chayong-primary)",
        color: "var(--chayong-text-sub)",
      }}
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-[var(--chayong-surface)] px-1.5 py-0.5 text-xs"
      {...props}
    />
  ),
  strong: (props) => (
    <strong style={{ color: "var(--chayong-text)" }} {...props} />
  ),
};
```

- [ ] **Step 2: Create BlogCard**

```tsx
// src/features/blog/components/blog-card.tsx
import Link from "next/link";
import type { BlogFrontmatter } from "@/lib/blog/mdx";

interface BlogCardProps {
  slug: string;
  frontmatter: BlogFrontmatter;
}

export function BlogCard({ slug, frontmatter }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      {/* Thumbnail placeholder */}
      <div
        className="flex h-40 items-center justify-center"
        style={{ backgroundColor: "var(--chayong-surface)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--chayong-primary)" }}>
          {frontmatter.category}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <span className="text-[10px] font-medium" style={{ color: "var(--chayong-primary)" }}>
          {frontmatter.category}
        </span>
        <h3
          className="text-sm font-bold leading-snug group-hover:underline"
          style={{ color: "var(--chayong-text)" }}
        >
          {frontmatter.title}
        </h3>
        <p
          className="line-clamp-2 text-xs leading-relaxed"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          {frontmatter.description}
        </p>
        <span className="text-[10px]" style={{ color: "var(--chayong-text-caption)" }}>
          {frontmatter.date}
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/blog/
git commit -m "feat(blog): add MDX components and BlogCard"
```

---

### Task 15: 블로그 페이지 (목록 + 상세)

**Files:**
- Create: `src/app/(public)/blog/page.tsx`
- Create: `src/app/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: Create blog listing page**

```tsx
// src/app/(public)/blog/page.tsx
import type { Metadata } from "next";
import { getAllPosts, getCategories } from "@/lib/blog/mdx";
import { BlogCard } from "@/features/blog/components/blog-card";

export const metadata: Metadata = {
  title: "블로그",
  description: "리스·렌트·승계에 대한 유용한 가이드와 정보",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const allPosts = getAllPosts();
  const categories = getCategories();
  const posts = category
    ? allPosts.filter((p) => p.frontmatter.category === category)
    : allPosts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
        블로그
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
        리스·렌트·승계에 대한 유용한 가이드
      </p>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <a
            href="/blog"
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
            style={{
              backgroundColor: !category ? "var(--chayong-primary)" : "var(--chayong-surface)",
              color: !category ? "#ffffff" : "var(--chayong-text-sub)",
            }}
          >
            전체
          </a>
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
              style={{
                backgroundColor: category === cat ? "var(--chayong-primary)" : "var(--chayong-surface)",
                color: category === cat ? "#ffffff" : "var(--chayong-text-sub)",
              }}
            >
              {cat}
            </a>
          ))}
        </div>
      )}

      {/* Post grid */}
      {posts.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} slug={post.slug} frontmatter={post.frontmatter} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
            아직 작성된 글이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create blog detail page**

```tsx
// src/app/(public)/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog/mdx";
import { mdxComponents } from "@/features/blog/components/mdx-components";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/blog"
        className="text-sm font-medium"
        style={{ color: "var(--chayong-primary)" }}
      >
        &larr; 블로그
      </Link>

      {/* Header */}
      <header className="mt-4 mb-8">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--chayong-primary)" }}
        >
          {post.frontmatter.category}
        </span>
        <h1
          className="mt-1 text-2xl font-bold leading-tight md:text-3xl"
          style={{ color: "var(--chayong-text)" }}
        >
          {post.frontmatter.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--chayong-text-sub)" }}>
          {post.frontmatter.description}
        </p>
        <time className="mt-2 block text-xs" style={{ color: "var(--chayong-text-caption)" }}>
          {post.frontmatter.date}
        </time>
      </header>

      {/* MDX content */}
      <div className="prose-chayong">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Verify no type errors**

Run: `bun run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/blog/
git commit -m "feat(blog): add blog listing and detail pages"
```

---

### Task 16: 초기 블로그 콘텐츠 3편

**Files:**
- Create: `content/blog/lease-vs-rent.mdx`
- Create: `content/blog/transfer-guide.mdx`
- Create: `content/blog/corporate-tax-guide.mdx`

- [ ] **Step 1: Create content directory and first post**

```bash
mkdir -p content/blog
```

```mdx
---
title: "리스 vs 렌트, 뭐가 다를까?"
date: "2026-04-16"
description: "중고 리스와 렌트의 차이점을 소유권, 세금, 보험 관점에서 비교합니다."
category: "리스·렌트 비교"
---

## 한눈에 보는 리스 vs 렌트

중고차를 이용하는 방법은 여러 가지입니다. 그중에서도 **리스**와 **렌트**는 매달 일정 금액을 내고 차량을 이용한다는 점에서 비슷해 보이지만, 실제로는 꽤 다릅니다.

## 소유권

**리스**는 계약 만기 시 차량을 인수할 수 있는 옵션이 있습니다. 잔존가치를 지불하면 내 차가 됩니다.

**렌트**는 기본적으로 반납이 원칙입니다. 차량의 소유권은 렌터카 회사에 있습니다.

## 세제 혜택

두 가지 모두 법인이나 개인사업자라면 비용처리가 가능합니다.

| 구분 | 리스 | 렌트 |
|------|------|------|
| 소유권 | 인수 가능 | 반납 원칙 |
| 보험 | 개별 가입 | 렌트료 포함 |
| 계약 기간 | 24~60개월 | 12~36개월 |
| 초기 비용 | 보증금 필요 | 보증금 또는 선납금 |

## 어떤 걸 선택해야 할까?

> 장기간 타면서 결국 내 차로 만들고 싶다면 **리스**, 부담 없이 다양한 차를 타보고 싶다면 **렌트**가 유리합니다.

차용에서는 중고 리스와 렌트 매물을 **월 납입금 기준으로 한눈에 비교**할 수 있습니다.
```

- [ ] **Step 2: Create second post**

```mdx
---
title: "승계 절차 A to Z"
date: "2026-04-15"
description: "리스·렌트 승계의 전체 과정을 단계별로 안내합니다."
category: "승계 가이드"
---

## 승계란?

**승계**란 기존 리스·렌트 계약자가 남은 계약 기간을 다른 사람에게 넘기는 것입니다. 새 계약이 아닌 기존 계약의 연장이라 신차 대비 초기 비용이 크게 줄어듭니다.

## 승계 절차

### 1단계: 매물 등록

판매자가 차용에 차량 정보와 계약 조건을 등록합니다. 차량번호를 입력하면 기본 정보가 자동으로 채워집니다.

### 2단계: 구매자 매칭

관심 있는 구매자가 채팅으로 연락합니다. 차용의 연락처 차단 채팅으로 안전하게 소통할 수 있습니다.

### 3단계: 가계약금 에스크로

구매자가 가계약금을 차용 에스크로 계좌에 입금합니다. 거래 완료 전까지 안전하게 보관됩니다.

### 4단계: 금융사 심사

금융사(캐피탈)에서 새로운 계약자의 신용을 심사합니다. 보통 3~5영업일 소요됩니다.

### 5단계: 명의 이전 및 인수

심사 승인 후 명의가 이전되고, 판매자에게 가계약금이 지급됩니다.

## 승계 시 주의사항

- 남은 계약 기간과 월 납입금을 꼼꼼히 확인하세요
- 차량 상태 점검기록부를 반드시 확인하세요
- 승계 수수료(이전비)가 발생할 수 있습니다
- 금융사별 승계 가능 조건이 다를 수 있습니다
```

- [ ] **Step 3: Create third post**

```mdx
---
title: "법인 리스 절세 가이드"
date: "2026-04-14"
description: "법인 차량 리스의 세금 절감 효과와 활용 방법을 알아봅니다."
category: "절세 팁"
---

## 법인 리스의 세제 혜택

법인이나 개인사업자가 업무용 차량을 리스하면 리스료를 **비용으로 처리**할 수 있습니다. 이는 법인세 또는 소득세 절감으로 이어집니다.

## 비용처리 가능 항목

- **리스료**: 월 납입금 전액 비용처리 가능
- **유류비**: 업무용으로 사용한 유류비
- **보험료**: 자동차 보험료
- **수리비**: 차량 유지보수 비용

## 중고 리스가 유리한 이유

신차 리스 대비 중고 리스는 차량 가격이 낮아 **월 리스료가 저렴**합니다. 같은 비용처리 효과를 누리면서 실제 지출은 줄일 수 있습니다.

## 주의할 점

- 업무용 사용 비율에 따라 비용처리 한도가 달라질 수 있습니다
- 차량 운행일지를 기록해두면 세무 조사 시 유리합니다
- 세부 사항은 반드시 세무사와 상담하세요

> 차용에서 법인용 중고 리스 매물을 검색하고, 월 납입금을 비교해보세요.
```

- [ ] **Step 4: Commit**

```bash
git add content/blog/
git commit -m "feat(blog): add initial 3 blog posts"
```

---

### Task 17: Footer에 블로그 링크 추가

**Files:**
- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Add blog link to SERVICE_LINKS**

In `footer.tsx`, add to the `SERVICE_LINKS` array:

```tsx
{ href: "/blog", label: "블로그" },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat(footer): add blog link"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Type check**

Run: `bun run type-check`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: 0 errors (or pre-existing only)

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: successful build

- [ ] **Step 4: Browser smoke test**

Check all new pages:
- `/detail/[id]` — 진단 섹션 "점검기록부 보기" → PDF 모달
- `/list` — 카드 우상단 비교 아이콘, 선택 시 하단 플로팅 바
- `/compare?ids=...` — 비교 테이블
- `/detail/[id]` — SellerCard 하단 후기 섹션
- `/blog` — 카테고리 탭 + 3개 글 카드
- `/blog/lease-vs-rent` — MDX 렌더링

---

## Summary

| Task | Phase | Area | Files | Est. |
|------|-------|------|-------|------|
| 1 | 1 | react-pdf install | 0 | 2min |
| 2 | 1 | PDF viewer modal | 1 new | 5min |
| 3 | 1 | VehicleDiagnosis wiring | 1 mod | 5min |
| 4 | 3 | CompareFloatingBar | 1 new | 5min |
| 5 | 3 | VehicleCard compare | 1 mod | 5min |
| 6 | 3 | Compare page + table | 2 new | 10min |
| 7 | 3 | LIST wiring | 1 mod | 3min |
| 8 | 4 | DealerReview schema | 1 mod | 5min |
| 9 | 4 | Reviews API | 1 new | 5min |
| 10 | 4 | Review components | 3 new | 10min |
| 11 | 4 | SellerCard integration | 1 mod | 3min |
| 12 | 5 | mdx deps install | 0 | 2min |
| 13 | 5 | MDX parsing utils | 1 new | 5min |
| 14 | 5 | MDX + BlogCard | 2 new | 5min |
| 15 | 5 | Blog pages | 2 new | 5min |
| 16 | 5 | Blog content | 3 new | 5min |
| 17 | 5 | Footer link | 1 mod | 2min |
| 18 | — | Final verification | 0 | 5min |
