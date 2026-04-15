"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ListingKanbanBoard } from "@/features/admin/components/listing-kanban-board";
import { InspectionPanel } from "@/features/admin/components/inspection-panel";
import type { KanbanListing } from "@/types/admin";

// Date fields are serialized to ISO strings when passed from Server → Client Components
export type SerializedKanbanListing = Omit<KanbanListing, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface PipelineClientProps {
  initialListings: SerializedKanbanListing[];
}

export function PipelineClient({ initialListings }: PipelineClientProps) {
  const router = useRouter();
  // Rehydrate ISO strings back to Date objects so KanbanListing types are satisfied
  const [listings, setListings] = useState<KanbanListing[]>(() =>
    initialListings.map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
    }))
  );
  const [selectedListing, setSelectedListing] = useState<KanbanListing | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleCardClick = useCallback((listing: KanbanListing) => {
    setSelectedListing(listing);
    setPanelOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (listingId: string, newStatus: string) => {
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId
            ? { ...l, status: newStatus as KanbanListing["status"] }
            : l
        )
      );
      // Also update selectedListing so the panel reflects the new status
      setSelectedListing((prev) =>
        prev?.id === listingId
          ? { ...prev, status: newStatus as KanbanListing["status"] }
          : prev
      );
      router.refresh();
    },
    [router]
  );

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
