/**
 * KOTSA 타입 배럴 익스포트
 * 모든 KOTSA API 관련 타입을 단일 진입점으로 제공
 */

export type { KotsaBasicInfo } from './basic-info'

export type {
  KotsaEngineSpec,
  KotsaTransmissionSpec,
  KotsaBodySpec,
  KotsaTireSpec,
  KotsaSuspensionSpec,
  KotsaBrakeSpec,
  KotsaSteeringSpec,
  KotsaSpec,
} from './spec'

export type {
  KotsaMaintenancePart,
  KotsaMaintenanceRecord,
  KotsaMaintenanceHistory,
} from './maintenance'

export type {
  KotsaPanelCondition,
  KotsaAccidentDetail,
  KotsaAccidentHistory,
  KotsaExteriorInspection,
  KotsaMechanicalInspection,
  KotsaInteriorInspection,
  KotsaInspectionDetail,
  KotsaInspection,
} from './inspection'

import type { KotsaBasicInfo } from './basic-info'
import type { KotsaSpec } from './spec'
import type { KotsaMaintenanceHistory } from './maintenance'
import type { KotsaInspection } from './inspection'

/**
 * KOTSA API 전체 차량 데이터 복합 타입
 * basicInfo, spec, maintenance, inspection 4개 도메인을 통합
 */
export type KotsaVehicleData = {
  basicInfo: KotsaBasicInfo
  spec: KotsaSpec
  maintenance: KotsaMaintenanceHistory
  inspection: KotsaInspection
}
