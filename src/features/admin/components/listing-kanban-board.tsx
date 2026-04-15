"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { KanbanColumnId, KanbanListing } from "@/types/admin";
import { VALID_STATUS_TRANSITIONS } from "@/types/admin";
import { ListingKanbanColumn } from "./listing-kanban-column";
import { ListingKanbanCard } from "./listing-kanban-card";

interface ColumnConfig {
  id: KanbanColumnId;
  title: string;
  color: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "DRAFT",    title: "임시저장",  color: "#9CA3AF" },
  { id: "PENDING",  title: "승인대기",  color: "#F59E0B" },
  { id: "ACTIVE",   title: "활성",      color: "#00C471" },
  { id: "RESERVED", title: "예약중",    color: "#3182F6" },
  { id: "SOLD",     title: "판매완료",  color: "#6366F1" },
  { id: "HIDDEN",   title: "숨김",      color: "#D1D5DB" },
];

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id));

interface ListingKanbanBoardProps {
  initialListings: KanbanListing[];
  onCardClick: (listing: KanbanListing) => void;
}

export function ListingKanbanBoard({
  initialListings,
  onCardClick,
}: ListingKanbanBoardProps) {
  const [listings, setListings] = useState<KanbanListing[]>(initialListings);
  const [activeCard, setActiveCard] = useState<KanbanListing | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const byStatus = useCallback(
    (status: KanbanColumnId) => listings.filter((l) => l.status === status),
    [listings]
  );

  function handleDragStart(event: DragStartEvent) {
    const card = listings.find((l) => l.id === event.active.id);
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    // Find the dragged card
    const card = listings.find((l) => l.id === active.id);
    if (!card) return;

    // Determine target status
    const targetStatus: string = COLUMN_IDS.has(String(over.id))
      ? String(over.id)
      : (listings.find((l) => l.id === over.id)?.status ?? card.status);

    if (targetStatus === card.status) return;

    // Validate transition
    const allowed = VALID_STATUS_TRANSITIONS[card.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      toast.error(
        `"${card.status}" → "${targetStatus}" 이동은 허용되지 않습니다.`
      );
      return;
    }

    // Optimistic update
    const previous = listings;
    setListings((prev) =>
      prev.map((l) =>
        l.id === card.id ? { ...l, status: targetStatus as KanbanListing["status"] } : l
      )
    );

    try {
      const res = await fetch(`/api/admin/listings/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast.success("매물 상태가 업데이트되었습니다.");
    } catch {
      setListings(previous);
      toast.error("상태 업데이트에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <DndContext
      id="admin-kanban"
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
          <div style={{ transform: "rotate(2deg)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <ListingKanbanCard listing={activeCard} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
