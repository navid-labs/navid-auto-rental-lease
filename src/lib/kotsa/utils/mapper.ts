import type { KotsaVehicleData, KotsaPanelCondition } from '../types'
import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'

// ── 패널 상태 변환 ────────────────────────────────────────────────────────────

/**
 * KOTSA 패널 상태를 InspectionData 패널 상태로 변환한다.
 * KOTSA 'damaged'는 구조적 손상이므로 'replaced'로 취급한다.
 */
function mapPanelStatus(
  panel: KotsaPanelCondition,
): 'normal' | 'repainted' | 'replaced' {
  if (panel.status === 'damaged') return 'replaced'
  return panel.status
}

// ── 사고 진단 변환 ────────────────────────────────────────────────────────────

/**
 * KOTSA 사고 이력 → accidentDiagnosis 열거값
 * - 사고 없음 → 'none'
 * - majorAccident 플래그 → 'severe'
 * - 총 수리비 2백만 원 이상 → 'moderate'
 * - 사고 있으나 수리비 2백만 원 미만 → 'minor'
 */
function mapAccidentDiagnosis(
  accidentHistory: KotsaVehicleData['inspection']['accidentHistory'],
): InspectionData['accidentDiagnosis'] {
  if (!accidentHistory.hasAccident) return 'none'
  if (accidentHistory.majorAccident) return 'severe'
  if (accidentHistory.totalRepairCost >= 2_000_000) return 'moderate'
  return 'minor'
}

// ── 카테고리 점수 산출 ────────────────────────────────────────────────────────

type DiagnosisCategory = InspectionData['categories'][keyof InspectionData['categories']]

/**
 * 기계 점검 항목들을 집계해 카테고리 점수를 반환한다.
 * boolean 항목은 false = warning으로 간주한다.
 */
function buildMechanicalCategory(
  mechanical: KotsaVehicleData['inspection']['mechanical'],
): DiagnosisCategory {
  // 점검 항목: oilLeak, coolantLeak, transmissionNoise, powerSteeringLeak, absFunction(반전)
  const boolItems = [
    !mechanical.oilLeak,        // 누유 없으면 pass
    !mechanical.coolantLeak,    // 누수 없으면 pass
    !mechanical.transmissionNoise, // 이음 없으면 pass
    !mechanical.powerSteeringLeak, // 누유 없으면 pass
    mechanical.absFunction,        // ABS 작동이면 pass
  ]
  const totalItems = boolItems.length
  const passedItems = boolItems.filter(Boolean).length
  const failedItems = 0
  const warningItems = totalItems - passedItems - failedItems
  const score = Math.round((passedItems / totalItems) * 100)
  return { score, totalItems, passedItems, warningItems, failedItems }
}

function buildInteriorCategory(
  interior: KotsaVehicleData['inspection']['interior'],
): DiagnosisCategory {
  const statusItems = [
    interior.dashboard,
    interior.seats,
    interior.seatbelts,
    interior.headliner,
    interior.carpet,
    interior.audioSystem,
    interior.navigationSystem,
    interior.climateControl,
    interior.powerWindows,
    interior.centralLocking,
  ]
  const totalItems = statusItems.length
  // '양호' / '정상' / '미전개' = pass, 그 외 = warning
  const PASS_VALUES = new Set(['양호', '정상', '미전개'])
  const passedItems = statusItems.filter((v) => PASS_VALUES.has(v)).length
  const warningItems = totalItems - passedItems
  const failedItems = interior.warningLights.length
  const score = Math.round((passedItems / totalItems) * 100)
  return { score, totalItems, passedItems, warningItems, failedItems }
}

function buildExteriorCategory(
  exterior: KotsaVehicleData['inspection']['exterior'],
): DiagnosisCategory {
  const panelKeys = [
    'hood', 'frontFenderLeft', 'frontFenderRight', 'frontDoorLeft', 'frontDoorRight',
    'rearDoorLeft', 'rearDoorRight', 'trunkLid', 'roofPanel', 'quarterPanelLeft',
    'quarterPanelRight', 'sideSillLeft', 'sideSillRight', 'frontBumper', 'rearBumper',
  ] as const
  const totalItems = panelKeys.length
  const passedItems = panelKeys.filter((k) => exterior[k].status === 'normal').length
  const failedItems = panelKeys.filter(
    (k) => exterior[k].status === 'damaged' || exterior[k].status === 'replaced',
  ).length
  const warningItems = totalItems - passedItems - failedItems
  const score = Math.round((passedItems / totalItems) * 100)
  return { score, totalItems, passedItems, warningItems, failedItems }
}

function buildTiresCategory(
  mechanical: KotsaVehicleData['inspection']['mechanical'],
): DiagnosisCategory {
  // 타이어 트레드 깊이 4mm 이상 = pass, 2~4mm = warning, <2mm = fail
  const depths = mechanical.tireTreadDepth
  const totalItems = depths.length
  const passedItems = depths.filter((d) => d >= 4).length
  const failedItems = depths.filter((d) => d < 2).length
  const warningItems = totalItems - passedItems - failedItems
  const score = Math.round((passedItems / totalItems) * 100)
  return { score, totalItems, passedItems, warningItems, failedItems }
}

function buildUndercarriageCategory(
  mechanical: KotsaVehicleData['inspection']['mechanical'],
): DiagnosisCategory {
  const statusItems = [
    mechanical.suspensionCondition,
    mechanical.shockAbsorber,
    mechanical.wheelBearing,
    mechanical.driveShaft,
    mechanical.brakeCondition,
    mechanical.exhaustSystem,
  ]
  const totalItems = statusItems.length
  const passedItems = statusItems.filter((v) => v === '양호').length
  const warningItems = totalItems - passedItems
  const failedItems = 0
  const score = Math.round((passedItems / totalItems) * 100)
  return { score, totalItems, passedItems, warningItems, failedItems }
}

// ── 공개 API ─────────────────────────────────────────────────────────────────

/**
 * KOTSA 차량 데이터를 InspectionData 스키마로 변환한다.
 *
 * @param kotsaData - KOTSA API 응답 데이터
 * @returns InspectionData 형태의 점검 데이터
 */
export function mapKotsaToInspectionData(kotsaData: KotsaVehicleData): InspectionData {
  const { inspection } = kotsaData
  const { exterior, mechanical, interior, accidentHistory, detail } = inspection

  // 패널 상태 매핑 (KOTSA 15개 → InspectionData 15개)
  const panels: InspectionData['panels'] = {
    hood: mapPanelStatus(exterior.hood),
    frontBumper: mapPanelStatus(exterior.frontBumper),
    rearBumper: mapPanelStatus(exterior.rearBumper),
    trunk: mapPanelStatus(exterior.trunkLid),
    roof: mapPanelStatus(exterior.roofPanel),
    frontLeftFender: mapPanelStatus(exterior.frontFenderLeft),
    frontRightFender: mapPanelStatus(exterior.frontFenderRight),
    rearLeftFender: mapPanelStatus(exterior.quarterPanelLeft),
    rearRightFender: mapPanelStatus(exterior.quarterPanelRight),
    frontLeftDoor: mapPanelStatus(exterior.frontDoorLeft),
    frontRightDoor: mapPanelStatus(exterior.frontDoorRight),
    rearLeftDoor: mapPanelStatus(exterior.rearDoorLeft),
    rearRightDoor: mapPanelStatus(exterior.rearDoorRight),
    leftRocker: mapPanelStatus(exterior.sideSillLeft),
    rightRocker: mapPanelStatus(exterior.sideSillRight),
  }

  const panelValues = Object.values(panels)
  const repaintCount = panelValues.filter((s) => s === 'repainted').length
  const replacedCount = panelValues.filter((s) => s === 'replaced').length

  // 평가자 정보
  const evaluator: InspectionData['evaluator'] = {
    name: detail.inspectorName,
    branch: detail.inspectionCenter,
    employeeId: detail.inspectorLicense,
    photoUrl: null,
    recommendation: accidentHistory.hasAccident
      ? '사고 이력이 있습니다. 세부 내역을 확인하세요.'
      : '전반적으로 양호한 상태입니다.',
  }

  return {
    overallScore: detail.overallScore,
    overallGrade: detail.overallGrade,
    panels,
    repaintCount,
    replacedCount,
    categories: {
      interior: buildInteriorCategory(interior),
      exterior: buildExteriorCategory(exterior),
      tires: buildTiresCategory(mechanical),
      consumables: buildMechanicalCategory(mechanical),
      undercarriage: buildUndercarriageCategory(mechanical),
    },
    accidentDiagnosis: mapAccidentDiagnosis(accidentHistory),
    evaluator,
    inspectedAt: detail.inspectionDate,
  }
}
