"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, ImageIcon } from "lucide-react";
import type { KanbanListing } from "@/types/admin";
import { formatKRWCompact } from "@/lib/utils/format";

interface ListingKanbanCardProps {
  listing: KanbanListing;
  onClick: (listing: KanbanListing) => void;
}

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "승계",
  USED_LEASE: "중고리스",
  USED_RENTAL: "중고렌트",
};

function isOlderThan48h(date: Date | string): boolean {
  const created = typeof date === "string" ? new Date(date) : date;
  return Date.now() - created.getTime() > 48 * 60 * 60 * 1000;
}

export function ListingKanbanCard({ listing, onClick }: ListingKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listing.id });

  const isPendingAlert =
    listing.status === "PENDING" && isOlderThan48h(listing.createdAt);

  const title =
    listing.brand && listing.model
      ? `${listing.brand} ${listing.model}`
      : "미입력 매물";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    border: isPendingAlert ? "2px solid #F04452" : "1px solid #E5E8EB",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(listing)}
      className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow select-none"
    >
      {/* Type badge + 48h alert */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#EBF3FE", color: "#3182F6" }}
        >
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>
        {isPendingAlert && (
          <span
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: "#F04452" }}
          >
            <Clock size={12} />
            48h+
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-[#111111] leading-snug mb-1 line-clamp-1">
        {title}
      </p>

      {/* Meta: year · monthly payment */}
      <p className="text-xs text-[#687684] mb-2">
        {listing.year}년식
        {listing.monthlyPayment != null && (
          <> · 월 {formatKRWCompact(listing.monthlyPayment)}</>
        )}
      </p>

      {/* Bottom row: verified badge + image count + seller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {listing.isVerified && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "#E6FAF0", color: "#00C471" }}
            >
              인증
            </span>
          )}
          <span className="flex items-center gap-0.5 text-xs text-[#8B95A1]">
            <ImageIcon size={11} />
            {listing._count.images}
          </span>
        </div>
        <span className="text-xs text-[#8B95A1] truncate max-w-[80px]">
          {listing.seller.name ?? "—"}
        </span>
      </div>
    </div>
  );
}
