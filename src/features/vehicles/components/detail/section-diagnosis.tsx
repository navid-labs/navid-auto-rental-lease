'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { gradeToLabel, gradeToColor } from '../../lib/diagnosis-grade'
import type { InspectionData } from '../../schemas/inspection-data'

type SectionDiagnosisProps = {
  inspection: InspectionData | null
}

const ACCIDENT_LABELS: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  none: { text: '무사고', variant: 'default' },
  minor: { text: '단순사고', variant: 'secondary' },
  moderate: { text: '사고', variant: 'destructive' },
  severe: { text: '사고', variant: 'destructive' },
}

const CATEGORY_LABELS: Record<string, string> = {
  interior: '실내',
  exterior: '외관',
  tires: '타이어',
  consumables: '소모품',
  undercarriage: '하체',
}

export function SectionDiagnosis({ inspection }: SectionDiagnosisProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card id="diagnosis" className="p-0">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">주요 진단결과</h3>

        {!inspection ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              진단 정보가 아직 등록되지 않았습니다
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              차량 진단이 완료되면 상세 결과를 확인하실 수 있습니다.
            </p>
          </div>
        ) : (
          <Collapsible open={open} onOpenChange={setOpen}>
            {/* Overall grade + accident */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-base font-bold ${gradeToColor(inspection.overallGrade)}`}
              >
                {gradeToLabel(inspection.overallGrade)}
              </span>
              <Badge variant={ACCIDENT_LABELS[inspection.accidentDiagnosis]?.variant ?? 'secondary'}>
                {ACCIDENT_LABELS[inspection.accidentDiagnosis]?.text ?? inspection.accidentDiagnosis}
              </Badge>
            </div>

            {/* Panel summary */}
            <p className="text-sm text-muted-foreground mb-4">
              판금 {inspection.repaintCount}건 / 교환 {inspection.replacedCount}건
            </p>

            {/* Category cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(inspection.categories).map(([key, cat]) => (
                <div
                  key={key}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {CATEGORY_LABELS[key] ?? key}
                  </p>
                  <p className="text-lg font-bold tabular-nums">{cat.score}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.passedItems}/{cat.totalItems} 통과
                  </p>
                  {cat.warningItems > 0 && (
                    <p className="text-xs text-yellow-600 mt-0.5">
                      주의 {cat.warningItems}
                    </p>
                  )}
                  {cat.failedItems > 0 && (
                    <p className="text-xs text-red-600">
                      불량 {cat.failedItems}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Collapsible detail */}
            <CollapsibleContent>
              <div className="mt-4 space-y-4">
                {Object.entries(inspection.categories).map(([key, cat]) => (
                  <div key={key}>
                    <h4 className="text-sm font-medium mb-2">
                      {CATEGORY_LABELS[key] ?? key}
                    </h4>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="size-3.5" />
                        통과 {cat.passedItems}
                      </span>
                      {cat.warningItems > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <AlertTriangle className="size-3.5" />
                          주의 {cat.warningItems}
                        </span>
                      )}
                      {cat.failedItems > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="size-3.5" />
                          불량 {cat.failedItems}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>

            <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-sm font-medium text-accent cursor-pointer mx-auto">
              {open ? (
                <>
                  접기 <ChevronUp className="size-4" />
                </>
              ) : (
                <>
                  전체보기 <ChevronDown className="size-4" />
                </>
              )}
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
