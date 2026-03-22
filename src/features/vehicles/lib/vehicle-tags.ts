export type TagInput = {
  inspectionData?: { accidentDiagnosis?: string } | null
  historyData?: { ownerCount?: number } | null
  warrantyEndDate?: Date | string | null
}

/** Extract display tags from vehicle JSONB data (inspectionData, historyData). */
export function getVehicleTags(vehicle: TagInput): string[] {
  const tags: string[] = []
  const inspection = vehicle.inspectionData as { accidentDiagnosis?: string } | null
  const history = vehicle.historyData as { ownerCount?: number } | null

  const isNoAccident = inspection?.accidentDiagnosis === 'none'
  const hasWarranty =
    vehicle.warrantyEndDate != null && new Date(vehicle.warrantyEndDate) > new Date()

  if (isNoAccident && hasWarranty) {
    tags.push('#무사고+보증')
  } else if (isNoAccident) {
    tags.push('#무사고')
  }

  if (history?.ownerCount === 1) {
    tags.push('#1인소유')
  }

  return tags
}
