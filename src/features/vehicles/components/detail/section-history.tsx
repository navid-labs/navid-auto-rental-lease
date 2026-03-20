'use client'

import { useState } from 'react'
import {
  CarFront,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Droplets,
  KeyRound,
  Car,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { formatKRW, formatDate } from '@/lib/utils/format'
import type { HistoryData } from '../../schemas/history-data'

type SectionHistoryProps = {
  history: HistoryData | null
}

const USAGE_LABELS: Record<string, string> = {
  personal: '개인',
  commercial: '영업',
  rental: '렌트',
  lease: '리스',
}

export function SectionHistory({ history }: SectionHistoryProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card id="history" className="p-0">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">주요 과거이력</h3>

        {!history ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              이력 정보가 아직 등록되지 않았습니다
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              차량 이력 조회가 완료되면 사고/보험 이력을 확인하실 수 있습니다.
            </p>
          </div>
        ) : (
          <Collapsible open={open} onOpenChange={setOpen}>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border p-4 text-center">
                <CarFront className="size-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold tabular-nums">
                  {history.myDamageCount}건
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatKRW(history.myDamageAmount)}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  내차피해
                </p>
              </div>

              <div className="rounded-lg border p-4 text-center">
                <Users className="size-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold tabular-nums">
                  {history.ownerCount}회
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  소유주 변경
                </p>
              </div>

              <div className="rounded-lg border p-4 text-center">
                <AlertTriangle className="size-5 text-muted-foreground mx-auto mb-2" />
                <div className="flex justify-center gap-2 mt-1">
                  <WarningIcon
                    active={history.warnings.flood}
                    icon={Droplets}
                    label="침수"
                  />
                  <WarningIcon
                    active={history.warnings.theft}
                    icon={KeyRound}
                    label="도난"
                  />
                  <WarningIcon
                    active={history.warnings.totalLoss}
                    icon={Car}
                    label="전손"
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  주의이력
                </p>
              </div>
            </div>

            {/* Warning badges */}
            {(history.warnings.flood ||
              history.warnings.theft ||
              history.warnings.totalLoss) && (
              <div className="flex gap-2 mb-4">
                {history.warnings.flood && (
                  <Badge variant="destructive">침수</Badge>
                )}
                {history.warnings.theft && (
                  <Badge variant="destructive">도난</Badge>
                )}
                {history.warnings.totalLoss && (
                  <Badge variant="destructive">전손</Badge>
                )}
              </div>
            )}

            {/* Detail timeline */}
            <CollapsibleContent>
              <div className="mt-4 space-y-6">
                {/* Insurance claims */}
                {history.insuranceClaims.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">보험 이력</h4>
                    <div className="border-l-2 border-muted pl-4 space-y-4">
                      {[...history.insuranceClaims]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .map((claim, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(claim.date, { short: true })}
                              </span>
                              <Badge
                                variant={
                                  claim.type === 'myDamage'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {claim.type === 'myDamage'
                                  ? '내차피해'
                                  : '상대차피해'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium tabular-nums">
                              {formatKRW(claim.amount)}
                            </p>
                            {claim.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {claim.description}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Ownership history */}
                {history.ownershipHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">소유 이력</h4>
                    <div className="border-l-2 border-muted pl-4 space-y-3">
                      {history.ownershipHistory.map((owner, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                          <p className="text-sm">
                            {owner.ownerNumber}번 소유주 (
                            {USAGE_LABELS[owner.usageType] ?? owner.usageType})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(owner.startDate, { short: true })} ~{' '}
                            {owner.endDate
                              ? formatDate(owner.endDate, { short: true })
                              : '현재'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>

            {(history.insuranceClaims.length > 0 ||
              history.ownershipHistory.length > 0) && (
              <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-sm font-medium text-accent cursor-pointer mx-auto">
                {open ? (
                  <>
                    접기 <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>
                    상세보기 <ChevronDown className="size-4" />
                  </>
                )}
              </CollapsibleTrigger>
            )}
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

function WarningIcon({
  active,
  icon: Icon,
  label,
}: {
  active: boolean
  icon: typeof Droplets
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
      <Icon
        className={`size-3.5 ${active ? 'text-red-500' : 'text-gray-300'}`}
      />
      <span
        className={`text-[10px] ${active ? 'text-red-500' : 'text-gray-300'}`}
      >
        {label}
      </span>
    </div>
  )
}
