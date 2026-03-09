'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const STORAGE_KEY = 'navid-vehicle-interactions'
const MAX_RECENTLY_VIEWED = 20
const MAX_COMPARISON = 4

// ─── Types ───────────────────────────────────────────────────────────────────

export type VehicleSummary = {
  id: string
  brandName: string
  modelName: string
  year: number
  mileage: number
  price: number
  monthlyRental?: number | null
  monthlyLease?: number | null
  thumbnailUrl?: string | null
  /** Timestamp (ms). Set automatically by addRecentlyViewed. */
  viewedAt?: number
}

type VehicleInteractionState = {
  // Recently Viewed
  recentlyViewed: VehicleSummary[]
  addRecentlyViewed: (vehicle: VehicleSummary) => void
  clearRecentlyViewed: () => void

  // Wishlist
  wishlist: VehicleSummary[]
  toggleWishlist: (vehicle: VehicleSummary) => void
  isWishlisted: (vehicleId: string) => boolean
  clearWishlist: () => void

  // Comparison (max 4)
  comparison: VehicleSummary[]
  toggleComparison: (vehicle: VehicleSummary) => void
  isInComparison: (vehicleId: string) => boolean
  removeFromComparison: (vehicleId: string) => void
  clearComparison: () => void
}

// ─── SSR-safe localStorage storage ───────────────────────────────────────────

/**
 * createJSONStorage wraps localStorage. During SSR, localStorage is undefined,
 * so we guard with a no-op fallback. skipHydration is set on the store to let
 * client components manually trigger hydration after mount.
 */
const ssrSafeStorage = createJSONStorage<VehicleInteractionState>(() => {
  if (typeof window === 'undefined') {
    // SSR: return a no-op storage so the persist middleware doesn't crash
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }
  }
  return localStorage
})

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVehicleInteractionStore = create<VehicleInteractionState>()(
  persist(
    (set, get) => ({
      // ── Recently Viewed ─────────────────────────────────────────────────────

      recentlyViewed: [],

      addRecentlyViewed: (vehicle) => {
        set((state) => {
          // Deduplicate: remove any existing entry with the same id
          const filtered = state.recentlyViewed.filter((v) => v.id !== vehicle.id)

          const entry: VehicleSummary = { ...vehicle, viewedAt: Date.now() }

          // Prepend and enforce max limit
          const next = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED)

          return { recentlyViewed: next }
        })
      },

      clearRecentlyViewed: () => set({ recentlyViewed: [] }),

      // ── Wishlist ─────────────────────────────────────────────────────────────

      wishlist: [],

      toggleWishlist: (vehicle) => {
        set((state) => {
          const exists = state.wishlist.some((v) => v.id === vehicle.id)
          return {
            wishlist: exists
              ? state.wishlist.filter((v) => v.id !== vehicle.id)
              : [...state.wishlist, vehicle],
          }
        })
      },

      isWishlisted: (vehicleId) => {
        return get().wishlist.some((v) => v.id === vehicleId)
      },

      clearWishlist: () => set({ wishlist: [] }),

      // ── Comparison ───────────────────────────────────────────────────────────

      comparison: [],

      toggleComparison: (vehicle) => {
        set((state) => {
          const exists = state.comparison.some((v) => v.id === vehicle.id)

          if (exists) {
            return {
              comparison: state.comparison.filter((v) => v.id !== vehicle.id),
            }
          }

          if (state.comparison.length >= MAX_COMPARISON) {
            // Warn instead of silently dropping — callers can surface this to the UI
            console.warn(
              `[Navid] 비교함은 최대 ${MAX_COMPARISON}대까지만 추가할 수 있습니다.`,
            )
            return state
          }

          return { comparison: [...state.comparison, vehicle] }
        })
      },

      isInComparison: (vehicleId) => {
        return get().comparison.some((v) => v.id === vehicleId)
      },

      removeFromComparison: (vehicleId) => {
        set((state) => ({
          comparison: state.comparison.filter((v) => v.id !== vehicleId),
        }))
      },

      clearComparison: () => set({ comparison: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: ssrSafeStorage,
      // skipHydration prevents the store from auto-hydrating on the server.
      // Client components must call useVehicleInteractionStore.persist.rehydrate()
      // inside a useEffect (or use the useStoreHydration helper below).
      skipHydration: true,
    },
  ),
)

// ─── SSR Hydration helper ─────────────────────────────────────────────────────

/**
 * Call this hook once in a top-level client component (e.g. a Providers wrapper)
 * to trigger localStorage hydration on the client side after mount.
 *
 * @example
 * // app/providers.tsx  ('use client')
 * import { useStoreHydration } from '@/lib/stores/vehicle-interaction-store'
 * export function Providers({ children }: { children: React.ReactNode }) {
 *   useStoreHydration()
 *   return <>{children}</>
 * }
 */
export function useStoreHydration() {
  useEffect(() => {
    useVehicleInteractionStore.persist.rehydrate()
  }, [])
}
