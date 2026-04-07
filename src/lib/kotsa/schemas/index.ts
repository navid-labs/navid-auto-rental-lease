import { z } from 'zod'
import { kotsaBasicInfoSchema } from './basic-info.schema'
import { kotsaSpecSchema } from './spec.schema'
import { kotsaMaintenanceHistorySchema } from './maintenance.schema'
import { kotsaInspectionSchema } from './inspection.schema'

export { kotsaBasicInfoSchema } from './basic-info.schema'
export {
  kotsaEngineSpecSchema,
  kotsaTransmissionSpecSchema,
  kotsaBodySpecSchema,
  kotsaTireSpecSchema,
  kotsaSuspensionSpecSchema,
  kotsaBrakeSpecSchema,
  kotsaSteeringSpecSchema,
  kotsaSpecSchema,
} from './spec.schema'
export {
  kotsaMaintenancePartSchema,
  kotsaMaintenanceRecordSchema,
  kotsaMaintenanceHistorySchema,
} from './maintenance.schema'
export {
  kotsaPanelConditionSchema,
  kotsaAccidentDetailSchema,
  kotsaAccidentHistorySchema,
  kotsaExteriorInspectionSchema,
  kotsaMechanicalInspectionSchema,
  kotsaInteriorInspectionSchema,
  kotsaInspectionDetailSchema,
  kotsaInspectionSchema,
} from './inspection.schema'

/**
 * KOTSA 전체 차량 데이터 복합 스키마
 * basicInfo, spec, maintenance, inspection 4개 도메인을 통합
 */
export const kotsaVehicleDataSchema = z.object({
  basicInfo: kotsaBasicInfoSchema,
  spec: kotsaSpecSchema,
  maintenance: kotsaMaintenanceHistorySchema,
  inspection: kotsaInspectionSchema,
})

export type KotsaVehicleDataSchema = z.infer<typeof kotsaVehicleDataSchema>
