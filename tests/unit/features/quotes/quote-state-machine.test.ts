import { describe, it, expect } from 'vitest'
import {
  canTransitionQuote,
  canTransitionBid,
  getNextQuoteStatuses,
  getNextBidStatuses,
  QUOTE_TRANSITIONS,
  BID_TRANSITIONS,
} from '@/features/quotes/lib/quote-state-machine'

describe('canTransitionQuote', () => {
  it('allows OPEN → BIDDING', () => {
    expect(canTransitionQuote('OPEN', 'BIDDING')).toBe(true)
  })

  it('allows OPEN → EXPIRED', () => {
    expect(canTransitionQuote('OPEN', 'EXPIRED')).toBe(true)
  })

  it('allows BIDDING → COMPARING', () => {
    expect(canTransitionQuote('BIDDING', 'COMPARING')).toBe(true)
  })

  it('allows BIDDING → EXPIRED', () => {
    expect(canTransitionQuote('BIDDING', 'EXPIRED')).toBe(true)
  })

  it('allows COMPARING → SELECTED', () => {
    expect(canTransitionQuote('COMPARING', 'SELECTED')).toBe(true)
  })

  it('allows SELECTED → CONTRACTED', () => {
    expect(canTransitionQuote('SELECTED', 'CONTRACTED')).toBe(true)
  })

  it('denies OPEN → SELECTED (skipping steps)', () => {
    expect(canTransitionQuote('OPEN', 'SELECTED')).toBe(false)
  })

  it('denies OPEN → CONTRACTED (skipping steps)', () => {
    expect(canTransitionQuote('OPEN', 'CONTRACTED')).toBe(false)
  })

  it('denies OPEN → COMPARING (skipping steps)', () => {
    expect(canTransitionQuote('OPEN', 'COMPARING')).toBe(false)
  })

  it('denies CONTRACTED → any transition (terminal state)', () => {
    const targets = ['OPEN', 'BIDDING', 'COMPARING', 'SELECTED', 'EXPIRED'] as const
    for (const target of targets) {
      expect(canTransitionQuote('CONTRACTED', target)).toBe(false)
    }
  })

  it('denies EXPIRED → any transition (terminal state)', () => {
    const targets = ['OPEN', 'BIDDING', 'COMPARING', 'SELECTED', 'CONTRACTED'] as const
    for (const target of targets) {
      expect(canTransitionQuote('EXPIRED', target)).toBe(false)
    }
  })

  it('denies SELECTED → OPEN (backward transition)', () => {
    expect(canTransitionQuote('SELECTED', 'OPEN')).toBe(false)
  })

  it('denies COMPARING → BIDDING (backward transition)', () => {
    expect(canTransitionQuote('COMPARING', 'BIDDING')).toBe(false)
  })
})

describe('canTransitionBid', () => {
  it('allows PENDING → SUBMITTED', () => {
    expect(canTransitionBid('PENDING', 'SUBMITTED')).toBe(true)
  })

  it('allows PENDING → WITHDRAWN', () => {
    expect(canTransitionBid('PENDING', 'WITHDRAWN')).toBe(true)
  })

  it('allows SUBMITTED → SELECTED', () => {
    expect(canTransitionBid('SUBMITTED', 'SELECTED')).toBe(true)
  })

  it('allows SUBMITTED → REJECTED', () => {
    expect(canTransitionBid('SUBMITTED', 'REJECTED')).toBe(true)
  })

  it('allows SUBMITTED → WITHDRAWN', () => {
    expect(canTransitionBid('SUBMITTED', 'WITHDRAWN')).toBe(true)
  })

  it('denies PENDING → SELECTED (skipping steps)', () => {
    expect(canTransitionBid('PENDING', 'SELECTED')).toBe(false)
  })

  it('denies PENDING → REJECTED (skipping steps)', () => {
    expect(canTransitionBid('PENDING', 'REJECTED')).toBe(false)
  })

  it('denies SELECTED → any transition (terminal state)', () => {
    const targets = ['PENDING', 'SUBMITTED', 'REJECTED', 'WITHDRAWN'] as const
    for (const target of targets) {
      expect(canTransitionBid('SELECTED', target)).toBe(false)
    }
  })

  it('denies REJECTED → any transition (terminal state)', () => {
    const targets = ['PENDING', 'SUBMITTED', 'SELECTED', 'WITHDRAWN'] as const
    for (const target of targets) {
      expect(canTransitionBid('REJECTED', target)).toBe(false)
    }
  })

  it('denies WITHDRAWN → any transition (terminal state)', () => {
    const targets = ['PENDING', 'SUBMITTED', 'SELECTED', 'REJECTED'] as const
    for (const target of targets) {
      expect(canTransitionBid('WITHDRAWN', target)).toBe(false)
    }
  })
})

describe('getNextQuoteStatuses', () => {
  it('returns [BIDDING, EXPIRED] for OPEN', () => {
    expect(getNextQuoteStatuses('OPEN')).toEqual(['BIDDING', 'EXPIRED'])
  })

  it('returns [COMPARING, EXPIRED] for BIDDING', () => {
    expect(getNextQuoteStatuses('BIDDING')).toEqual(['COMPARING', 'EXPIRED'])
  })

  it('returns [SELECTED] for COMPARING', () => {
    expect(getNextQuoteStatuses('COMPARING')).toEqual(['SELECTED'])
  })

  it('returns [CONTRACTED] for SELECTED', () => {
    expect(getNextQuoteStatuses('SELECTED')).toEqual(['CONTRACTED'])
  })

  it('returns [] for CONTRACTED (terminal)', () => {
    expect(getNextQuoteStatuses('CONTRACTED')).toEqual([])
  })

  it('returns [] for EXPIRED (terminal)', () => {
    expect(getNextQuoteStatuses('EXPIRED')).toEqual([])
  })
})

describe('getNextBidStatuses', () => {
  it('returns [SUBMITTED, WITHDRAWN] for PENDING', () => {
    expect(getNextBidStatuses('PENDING')).toEqual(['SUBMITTED', 'WITHDRAWN'])
  })

  it('returns [SELECTED, REJECTED, WITHDRAWN] for SUBMITTED', () => {
    expect(getNextBidStatuses('SUBMITTED')).toEqual(['SELECTED', 'REJECTED', 'WITHDRAWN'])
  })

  it('returns [] for SELECTED (terminal)', () => {
    expect(getNextBidStatuses('SELECTED')).toEqual([])
  })

  it('returns [] for REJECTED (terminal)', () => {
    expect(getNextBidStatuses('REJECTED')).toEqual([])
  })

  it('returns [] for WITHDRAWN (terminal)', () => {
    expect(getNextBidStatuses('WITHDRAWN')).toEqual([])
  })
})

describe('QUOTE_TRANSITIONS', () => {
  it('has entries for all quote statuses', () => {
    const statuses = ['OPEN', 'BIDDING', 'COMPARING', 'SELECTED', 'CONTRACTED', 'EXPIRED']
    for (const status of statuses) {
      expect(QUOTE_TRANSITIONS).toHaveProperty(status)
    }
  })
})

describe('BID_TRANSITIONS', () => {
  it('has entries for all bid statuses', () => {
    const statuses = ['PENDING', 'SUBMITTED', 'SELECTED', 'REJECTED', 'WITHDRAWN']
    for (const status of statuses) {
      expect(BID_TRANSITIONS).toHaveProperty(status)
    }
  })
})
