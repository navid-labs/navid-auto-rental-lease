'use client'

import type { InspectionData } from '@/features/vehicles/schemas/inspection-data'
import type { KotsaVehicleData } from '@/lib/kotsa'

type Props = {
  inspectionData: InspectionData
  basicInfo: KotsaVehicleData['basicInfo']
}

const GRADE_STYLES: Record<InspectionData['overallGrade'], { bg: string; text: string; label: string }> = {
  A_PLUS: { bg: 'bg-emerald-500', text: 'text-white', label: 'A+' },
  A:      { bg: 'bg-green-500',   text: 'text-white', label: 'A'  },
  B_PLUS: { bg: 'bg-blue-500',    text: 'text-white', label: 'B+' },
  B:      { bg: 'bg-yellow-500',  text: 'text-white', label: 'B'  },
  C:      { bg: 'bg-red-500',     text: 'text-white', label: 'C'  },
}

const ACCIDENT_LABELS: Record<InspectionData['accidentDiagnosis'], { label: string; color: string }> = {
  none:     { label: '무사고',   color: 'text-emerald-600' },
  minor:    { label: '경미한 사고', color: 'text-yellow-600' },
  moderate: { label: '사고 이력', color: 'text-orange-600' },
  severe:   { label: '중대 사고', color: 'text-red-600'    },
}

/**
 * 차량 점검 결과 요약 카드.
 * 등급, 사고 진단, 소유자 변경, 압류/저당 현황을 4열 그리드로 표시한다.
 */
export function ReportSummaryCard({ inspectionData, basicInfo }: Props) {
  const grade = GRADE_STYLES[inspectionData.overallGrade]
  const accident = ACCIDENT_LABELS[inspectionData.accidentDiagnosis]

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">점검 요약</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* 종합 등급 */}
        <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-50 p-4">
          <span className="text-xs font-medium text-zinc-500">종합 등급</span>
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${grade.bg} ${grade.text}`}
          >
            {grade.label}
          </span>
          <span className="text-sm font-semibold text-zinc-800">
            {inspectionData.overallScore}점
          </span>
        </div>

        {/* 사고 진단 */}
        <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-50 p-4">
          <span className="text-xs font-medium text-zinc-500">사고 진단</span>
          <span className={`text-2xl font-bold ${accident.color}`}>
            {accident.label}
          </span>
          <span className="text-xs text-zinc-400">
            {inspectionData.accidentDiagnosis === 'none'
              ? '사고 이력 없음'
              : '상세 내역 확인 필요'}
          </span>
        </div>

        {/* 소유자 변경 */}
        <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-50 p-4">
          <span className="text-xs font-medium text-zinc-500">소유자 변경</span>
          <span className="text-2xl font-bold text-zinc-800">
            {basicInfo.numberOfOwnerChanges}회
          </span>
          <span className="text-xs text-zinc-400">
            {basicInfo.numberOfOwnerChanges === 0 ? '최초 소유자' : '소유자 변경 있음'}
          </span>
        </div>

        {/* 압류/저당 */}
        <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-50 p-4">
          <span className="text-xs font-medium text-zinc-500">압류/저당</span>
          <span
            className={`text-2xl font-bold ${
              basicInfo.hasSeizure || basicInfo.hasMortgage
                ? 'text-red-600'
                : 'text-emerald-600'
            }`}
          >
            {basicInfo.hasSeizure || basicInfo.hasMortgage ? '있음' : '없음'}
          </span>
          <span className="text-xs text-zinc-400">
            {basicInfo.hasSeizure ? '압류 ' : ''}
            {basicInfo.hasMortgage ? '저당 ' : ''}
            {!basicInfo.hasSeizure && !basicInfo.hasMortgage ? '이상 없음' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
