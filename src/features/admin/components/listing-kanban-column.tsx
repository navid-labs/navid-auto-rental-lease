"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { KanbanColumnId, KanbanListing } from "@/types/admin";
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
      className="flex flex-col min-w-[260px] max-w-[300px] rounded-2xl"
      style={{
        backgroundColor: isOver ? "#EBF3FE" : "#F9FAFB",
        transition: "background-color 150ms ease",
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold text-[#111111] flex-1 truncate">
          {title}
        </span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: "#E5E8EB", color: "#687684" }}
        >
          {listings.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 px-3 pb-3 overflow-y-auto"
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

        {/* Empty state */}
        {listings.length === 0 && (
          <div
            className="flex items-center justify-center rounded-xl py-8 text-xs text-[#8B95A1]"
            style={{ border: "1.5px dashed #E5E8EB" }}
          >
            매물 없음
          </div>
        )}
      </div>
    </div>
  );
}
