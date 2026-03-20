import { z } from 'zod'

const panelStatus = z.enum(['normal', 'repainted', 'replaced'])

const bodyPanelSchema = z.object({
  hood: panelStatus,
  frontBumper: panelStatus,
  rearBumper: panelStatus,
  trunk: panelStatus,
  roof: panelStatus,
  frontLeftFender: panelStatus,
  frontRightFender: panelStatus,
  rearLeftFender: panelStatus,
  rearRightFender: panelStatus,
  frontLeftDoor: panelStatus,
  frontRightDoor: panelStatus,
  rearLeftDoor: panelStatus,
  rearRightDoor: panelStatus,
  leftRocker: panelStatus,
  rightRocker: panelStatus,
})

const diagnosisCategorySchema = z.object({
  score: z.number().min(0).max(100),
  totalItems: z.number(),
  passedItems: z.number(),
  warningItems: z.number(),
  failedItems: z.number(),
})

const evaluatorSchema = z.object({
  name: z.string(),
  branch: z.string(),
  employeeId: z.string(),
  photoUrl: z.string().nullable(),
  recommendation: z.string(),
})

export const inspectionDataSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallGrade: z.enum(['A_PLUS', 'A', 'B_PLUS', 'B', 'C']),
  panels: bodyPanelSchema,
  repaintCount: z.number(),
  replacedCount: z.number(),
  categories: z.object({
    interior: diagnosisCategorySchema,
    exterior: diagnosisCategorySchema,
    tires: diagnosisCategorySchema,
    consumables: diagnosisCategorySchema,
    undercarriage: diagnosisCategorySchema,
  }),
  accidentDiagnosis: z.enum(['none', 'minor', 'moderate', 'severe']),
  evaluator: evaluatorSchema.nullable(),
  inspectedAt: z.string(),
})

export type InspectionData = z.infer<typeof inspectionDataSchema>
