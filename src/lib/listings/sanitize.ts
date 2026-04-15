/**
 * 번호판/VIN 마스킹.
 *
 * 공개 API (GET /api/listings, GET /api/listings/[id]) 응답에서 호출.
 * 본인(sellerId 일치) 또는 ADMIN 권한자는 원본 노출.
 */

export interface SanitizeContext {
  viewerId?: string
  isAdmin?: boolean
}

export function maskPlateNumber(plate: string | null | undefined): string | null {
  if (!plate) return null
  return plate.replace(/\d{4}$/, "****")
}

interface ListingLike {
  sellerId: string
  plateNumber: string | null | undefined
  vin?: string | null | undefined
  [key: string]: unknown
}

export function sanitizeListingForPublic<T extends ListingLike>(
  listing: T,
  ctx: SanitizeContext = {},
): T & { plateNumber: string | null; vin: string | null } {
  const canSeeFull = ctx.isAdmin === true || (ctx.viewerId && listing.sellerId === ctx.viewerId)

  return {
    ...listing,
    plateNumber: canSeeFull ? (listing.plateNumber ?? null) : maskPlateNumber(listing.plateNumber),
    vin: canSeeFull ? (listing.vin ?? null) : null,
  }
}
