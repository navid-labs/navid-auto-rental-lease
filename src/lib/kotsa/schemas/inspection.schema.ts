import { z } from 'zod'

/**
 * KotsaInspection 관련 Zod 스키마
 * 모든 검사/사고이력 서브타입과 1:1 대응
 */

export const kotsaPanelConditionSchema = z.object({
  status: z.enum(['normal', 'repainted', 'replaced', 'damaged']),
  detail: z.string().nullable(),
})

export const kotsaAccidentDetailSchema = z.object({
  date: z.string(),
  type: z.string(),
  repairCost: z.number(),
  affectedParts: z.array(z.string()),
  repairShop: z.string(),
})

export const kotsaAccidentHistorySchema = z.object({
  hasAccident: z.boolean(),
  accidentCount: z.number(),
  totalRepairCost: z.number(),
  floodDamage: z.boolean(),
  fireDamage: z.boolean(),
  majorAccident: z.boolean(),
  details: z.array(kotsaAccidentDetailSchema),
})

export const kotsaExteriorInspectionSchema = z.object({
  // 차체 패널 15개
  hood: kotsaPanelConditionSchema,
  frontFenderLeft: kotsaPanelConditionSchema,
  frontFenderRight: kotsaPanelConditionSchema,
  frontDoorLeft: kotsaPanelConditionSchema,
  frontDoorRight: kotsaPanelConditionSchema,
  rearDoorLeft: kotsaPanelConditionSchema,
  rearDoorRight: kotsaPanelConditionSchema,
  trunkLid: kotsaPanelConditionSchema,
  roofPanel: kotsaPanelConditionSchema,
  quarterPanelLeft: kotsaPanelConditionSchema,
  quarterPanelRight: kotsaPanelConditionSchema,
  sideSillLeft: kotsaPanelConditionSchema,
  sideSillRight: kotsaPanelConditionSchema,
  frontBumper: kotsaPanelConditionSchema,
  rearBumper: kotsaPanelConditionSchema,
  // 외관 이상 플래그
  corrosion: z.boolean(),
  unevenGaps: z.boolean(),
})

export const kotsaMechanicalInspectionSchema = z.object({
  engineCondition: z.string(),
  oilLeak: z.boolean(),
  coolantLeak: z.boolean(),
  transmissionCondition: z.string(),
  transmissionNoise: z.boolean(),
  clutchCondition: z.string(),
  driveShaft: z.string(),
  steeringPlay: z.number(),
  powerSteeringLeak: z.boolean(),
  brakeCondition: z.string(),
  brakePadRemaining: z.number(),
  absFunction: z.boolean(),
  exhaustSystem: z.string(),
  emissionTestResult: z.string(),
  suspensionCondition: z.string(),
  shockAbsorber: z.string(),
  wheelBearing: z.string(),
  tireCondition: z.string(),
  tireTreadDepth: z.array(z.number()),
})

export const kotsaInteriorInspectionSchema = z.object({
  dashboard: z.string(),
  seats: z.string(),
  seatbelts: z.string(),
  airbags: z.string(),
  headliner: z.string(),
  carpet: z.string(),
  audioSystem: z.string(),
  navigationSystem: z.string(),
  climateControl: z.string(),
  powerWindows: z.string(),
  centralLocking: z.string(),
  odometer: z.number(),
  warningLights: z.array(z.string()),
  overallCondition: z.string(),
})

export const kotsaInspectionDetailSchema = z.object({
  inspectorName: z.string(),
  inspectorLicense: z.string(),
  inspectionCenter: z.string(),
  inspectionDate: z.string(),
  expiryDate: z.string(),
  overallGrade: z.enum(['A_PLUS', 'A', 'B_PLUS', 'B', 'C']),
  overallScore: z.number(),
})

export const kotsaInspectionSchema = z.object({
  accidentHistory: kotsaAccidentHistorySchema,
  exterior: kotsaExteriorInspectionSchema,
  mechanical: kotsaMechanicalInspectionSchema,
  interior: kotsaInteriorInspectionSchema,
  detail: kotsaInspectionDetailSchema,
})
