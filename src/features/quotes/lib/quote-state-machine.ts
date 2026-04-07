export type QuoteStatus = 'OPEN' | 'BIDDING' | 'COMPARING' | 'SELECTED' | 'CONTRACTED' | 'EXPIRED'
export type BidStatus = 'PENDING' | 'SUBMITTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'

/**
 * Allowed quote status transitions.
 * Terminal states (CONTRACTED, EXPIRED) have no outgoing transitions.
 */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  OPEN: ['BIDDING', 'EXPIRED'],
  BIDDING: ['COMPARING', 'EXPIRED'],
  COMPARING: ['SELECTED'],
  SELECTED: ['CONTRACTED'],
  CONTRACTED: [],
  EXPIRED: [],
}

/**
 * Allowed bid status transitions.
 * Terminal states (SELECTED, REJECTED, WITHDRAWN) have no outgoing transitions.
 */
export const BID_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  PENDING: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
}

/**
 * Check if a quote status transition is allowed.
 * @param from - Current quote status
 * @param to - Target quote status
 * @returns true if the transition is valid
 */
export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from].includes(to)
}

/**
 * Check if a bid status transition is allowed.
 * @param from - Current bid status
 * @param to - Target bid status
 * @returns true if the transition is valid
 */
export function canTransitionBid(from: BidStatus, to: BidStatus): boolean {
  return BID_TRANSITIONS[from].includes(to)
}

/**
 * Get all valid next statuses from the current quote status.
 * @param current - Current quote status
 * @returns Array of reachable quote statuses
 */
export function getNextQuoteStatuses(current: QuoteStatus): QuoteStatus[] {
  return QUOTE_TRANSITIONS[current]
}

/**
 * Get all valid next statuses from the current bid status.
 * @param current - Current bid status
 * @returns Array of reachable bid statuses
 */
export function getNextBidStatuses(current: BidStatus): BidStatus[] {
  return BID_TRANSITIONS[current]
}
