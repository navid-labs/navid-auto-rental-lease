import { describe, it, expect, beforeEach } from 'vitest'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleSummary } from '@/lib/stores/vehicle-interaction-store'

// Helper to create a test vehicle summary
function makeVehicle(id: string): VehicleSummary {
  return {
    id,
    brandName: 'Hyundai',
    modelName: 'Sonata',
    year: 2024,
    mileage: 10000,
    price: 25000000,
    monthlyRental: 300000,
  }
}

describe('vehicle-interaction-store comparison', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useVehicleInteractionStore.getState()
    store.clearComparison()
  })

  it('MAX_COMPARISON is 3', () => {
    const store = useVehicleInteractionStore.getState()
    // Add 3 vehicles
    store.toggleComparison(makeVehicle('v1'))
    store.toggleComparison(makeVehicle('v2'))
    store.toggleComparison(makeVehicle('v3'))
    expect(useVehicleInteractionStore.getState().comparison).toHaveLength(3)

    // 4th vehicle should NOT be added
    store.toggleComparison(makeVehicle('v4'))
    expect(useVehicleInteractionStore.getState().comparison).toHaveLength(3)
    expect(
      useVehicleInteractionStore.getState().comparison.some((v) => v.id === 'v4'),
    ).toBe(false)
  })

  it('toggleComparison adds vehicle when under max', () => {
    const store = useVehicleInteractionStore.getState()
    store.toggleComparison(makeVehicle('v1'))
    expect(useVehicleInteractionStore.getState().comparison).toHaveLength(1)
    expect(useVehicleInteractionStore.getState().comparison[0].id).toBe('v1')
  })

  it('toggleComparison removes vehicle when already in list', () => {
    const store = useVehicleInteractionStore.getState()
    store.toggleComparison(makeVehicle('v1'))
    expect(useVehicleInteractionStore.getState().comparison).toHaveLength(1)

    // Toggle again to remove
    store.toggleComparison(makeVehicle('v1'))
    expect(useVehicleInteractionStore.getState().comparison).toHaveLength(0)
  })

  it('toggleComparison does NOT add when at max (3 vehicles)', () => {
    const store = useVehicleInteractionStore.getState()
    store.toggleComparison(makeVehicle('v1'))
    store.toggleComparison(makeVehicle('v2'))
    store.toggleComparison(makeVehicle('v3'))

    const stateBefore = useVehicleInteractionStore.getState().comparison
    store.toggleComparison(makeVehicle('v4'))
    const stateAfter = useVehicleInteractionStore.getState().comparison

    expect(stateAfter).toHaveLength(3)
    expect(stateAfter.map((v) => v.id)).toEqual(stateBefore.map((v) => v.id))
  })

  it('comparisonDialogOpen defaults to false', () => {
    const store = useVehicleInteractionStore.getState()
    expect(store.comparisonDialogOpen).toBe(false)
  })

  it('setComparisonDialogOpen(true) sets it to true', () => {
    const store = useVehicleInteractionStore.getState()
    store.setComparisonDialogOpen(true)
    expect(useVehicleInteractionStore.getState().comparisonDialogOpen).toBe(true)
  })
})
