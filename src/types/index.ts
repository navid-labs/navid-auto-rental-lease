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

/** Listing with images and seller info (for detail pages) */
export type ListingWithImages = import("@prisma/client").Listing & {
  images: import("@prisma/client").ListingImage[];
  seller: Pick<import("@prisma/client").Profile, "id" | "name" | "role">;
};

/**
 * CROSS-WORKTREE SHARED CONTRACT.
 * Consumers: Home (WT1), List/vehicle-card (WT2), Detail (WT3).
 * Changes must be coordinated via docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md owner.
 */
/** Listing card data (for list/grid views) */
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
  | "accidentCount"
  | "mileageVerified"
  | "viewCount"
  | "favoriteCount"
  | "options"
> & {
  primaryImage: string | null;
};
