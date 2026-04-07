import { describe, it, expect } from 'vitest'
import { createMockKotsaVehicleData } from '@/lib/kotsa'
import { mapKotsaToInspectionData } from '@/lib/kotsa/utils/mapper'
import { inspectionDataSchema } from '@/features/vehicles/schemas/inspection-data'

describe('mapKotsaToInspectionData', () => {
  it('기본 픽스처에서 올바른 등급과 점수를 반환한다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    expect(result.overallScore).toBe(88)
    expect(result.overallGrade).toBe('A')
  })

  it('overrides로 등급/점수를 변경할 수 있다', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        detail: {
          overallGrade: 'B_PLUS',
          overallScore: 72,
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.overallScore).toBe(72)
    expect(result.overallGrade).toBe('B_PLUS')
  })

  it('모든 패널이 normal 상태면 repaintCount와 replacedCount가 0이다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    expect(result.repaintCount).toBe(0)
    expect(result.replacedCount).toBe(0)
    for (const status of Object.values(result.panels)) {
      expect(status).toBe('normal')
    }
  })

  it('repainted 패널을 올바르게 집계한다', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        exterior: {
          hood: { status: 'repainted', detail: '도색 흔적 있음' },
          frontDoorLeft: { status: 'repainted', detail: null },
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.panels.hood).toBe('repainted')
    expect(result.panels.frontLeftDoor).toBe('repainted')
    expect(result.repaintCount).toBe(2)
    expect(result.replacedCount).toBe(0)
  })

  it('replaced 패널을 올바르게 집계한다', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        exterior: {
          trunkLid: { status: 'replaced', detail: '교체됨' },
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.panels.trunk).toBe('replaced')
    expect(result.replacedCount).toBe(1)
  })

  it('KOTSA damaged 상태는 replaced로 매핑된다', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        exterior: {
          frontBumper: { status: 'damaged', detail: '파손됨' },
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.panels.frontBumper).toBe('replaced')
    expect(result.replacedCount).toBe(1)
  })

  it('사고 없음 → accidentDiagnosis: none', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: false,
          accidentCount: 0,
          totalRepairCost: 0,
          majorAccident: false,
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.accidentDiagnosis).toBe('none')
  })

  it('사고 있고 수리비 2백만 미만 → accidentDiagnosis: minor', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: true,
          accidentCount: 1,
          totalRepairCost: 1_500_000,
          majorAccident: false,
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.accidentDiagnosis).toBe('minor')
  })

  it('사고 있고 수리비 2백만 이상 → accidentDiagnosis: moderate', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: true,
          accidentCount: 1,
          totalRepairCost: 3_000_000,
          majorAccident: false,
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.accidentDiagnosis).toBe('moderate')
  })

  it('majorAccident 플래그 → accidentDiagnosis: severe', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: true,
          accidentCount: 2,
          totalRepairCost: 5_000_000,
          majorAccident: true,
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    expect(result.accidentDiagnosis).toBe('severe')
  })

  it('결과가 inspectionDataSchema를 통과한다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    const parsed = inspectionDataSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('사고 있는 데이터도 inspectionDataSchema를 통과한다', () => {
    const data = createMockKotsaVehicleData({
      inspection: {
        accidentHistory: {
          hasAccident: true,
          accidentCount: 1,
          totalRepairCost: 2_500_000,
          majorAccident: false,
        },
        exterior: {
          hood: { status: 'repainted', detail: null },
          rearBumper: { status: 'replaced', detail: null },
        },
      },
    })
    const result = mapKotsaToInspectionData(data)

    const parsed = inspectionDataSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('evaluator 필드가 올바르게 채워진다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    expect(result.evaluator).not.toBeNull()
    expect(result.evaluator?.name).toBe('박성능')
    expect(result.evaluator?.employeeId).toBe('KINSPECT-20891')
    expect(result.evaluator?.branch).toBe('한국자동차진단보증(주)')
  })

  it('inspectedAt이 검사일자와 일치한다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    expect(result.inspectedAt).toBe('2025-11-15')
  })

  it('카테고리 점수가 0~100 범위 안에 있다', () => {
    const data = createMockKotsaVehicleData()
    const result = mapKotsaToInspectionData(data)

    for (const category of Object.values(result.categories)) {
      expect(category.score).toBeGreaterThanOrEqual(0)
      expect(category.score).toBeLessThanOrEqual(100)
      expect(category.totalItems).toBeGreaterThan(0)
      expect(category.passedItems + category.warningItems + category.failedItems).toBe(
        category.totalItems,
      )
    }
  })
})
