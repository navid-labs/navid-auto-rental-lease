export type DiagnosisGrade = 'A_PLUS' | 'A' | 'B_PLUS' | 'B' | 'C'

export function calculateGrade(score: number): DiagnosisGrade {
  if (score >= 90) return 'A_PLUS'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B_PLUS'
  if (score >= 60) return 'B'
  return 'C'
}

export function gradeToLabel(grade: DiagnosisGrade): string {
  const map: Record<DiagnosisGrade, string> = {
    A_PLUS: 'A+', A: 'A', B_PLUS: 'B+', B: 'B', C: 'C',
  }
  return map[grade]
}

export function gradeToColor(grade: DiagnosisGrade): string {
  const map: Record<DiagnosisGrade, string> = {
    A_PLUS: 'text-green-600 bg-green-50',
    A: 'text-blue-600 bg-blue-50',
    B_PLUS: 'text-yellow-600 bg-yellow-50',
    B: 'text-orange-600 bg-orange-50',
    C: 'text-red-600 bg-red-50',
  }
  return map[grade]
}
