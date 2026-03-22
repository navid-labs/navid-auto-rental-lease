export type BodyType = 'sedan' | 'suv' | 'mpv' | 'coupe' | 'hatchback' | 'truck'

// Korean labels used in the filter UI
export const BODY_TYPE_LABELS: Record<string, BodyType> = {
  '세단': 'sedan',
  'SUV': 'suv',
  'MPV': 'mpv',
  '쿠페': 'coupe',
  '해치백': 'hatchback',
  '트럭': 'truck',
}

// Maps model name (English) to body type.
// Lookup approach that avoids a database migration --
// body type is a property of the model, not the individual vehicle.
export const MODEL_BODY_TYPES: Record<string, BodyType> = {
  // Hyundai
  'Sonata': 'sedan',
  'Avante': 'sedan',
  'Grandeur': 'sedan',
  'Tucson': 'suv',
  'Palisade': 'suv',
  // Kia
  'K5': 'sedan',
  'Sportage': 'suv',
  'Sorento': 'suv',
  'EV6': 'suv',
  // Genesis
  'G80': 'sedan',
  'GV70': 'suv',
  'GV80': 'suv',
  // BMW
  '3 Series': 'sedan',
  '5 Series': 'sedan',
  'X3': 'suv',
  'X5': 'suv',
  // Mercedes
  'C-Class': 'sedan',
  'E-Class': 'sedan',
  'GLC': 'suv',
  // Audi
  'A6': 'sedan',
  'Q5': 'suv',
  // Volvo
  'XC60': 'suv',
  'XC90': 'suv',
  // Porsche
  'Cayenne': 'suv',
  'Macan': 'suv',
}

/**
 * Get all model names matching a given body type.
 * Used by buildWhereClause to convert vehicleType filter to model name conditions.
 */
export function getModelNamesByBodyType(bodyType: BodyType): string[] {
  return Object.entries(MODEL_BODY_TYPES)
    .filter(([, type]) => type === bodyType)
    .map(([name]) => name)
}
