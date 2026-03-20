'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

type SectionWarrantyProps = {
  warrantyEndDate: Date | null
  warrantyMileage: number | null
  year: number
}

/** Manufacturer warranty: 5 years / 100,000km from vehicle year */
const MANUFACTURER_WARRANTY_YEARS = 5
const MANUFACTURER_WARRANTY_KM = 100_000

function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatDistance(km: number): string {
  if (km >= 10_000) {
    return `${(km / 10_000).toFixed(km % 10_000 === 0 ? 0 : 1)}만 km`
  }
  return `${km.toLocaleString()} km`
}

function calcRemainingMonths(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  return Math.max(0, months)
}

function calcProgressPercent(start: Date, end: Date, now: Date): number {
  const total = end.getTime() - start.getTime()
  if (total <= 0) return 100
  const elapsed = now.getTime() - start.getTime()
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

export function SectionWarranty({
  warrantyEndDate,
  warrantyMileage,
  year,
}: SectionWarrantyProps) {
  const now = new Date()
  const mfgStart = new Date(year, 0, 1)
  const mfgEnd = new Date(year + MANUFACTURER_WARRANTY_YEARS, 0, 1)
  const mfgExpired = now > mfgEnd

  const hasExtended = warrantyEndDate != null
  const extendedEnd = warrantyEndDate ? new Date(warrantyEndDate) : null

  // Determine the final warranty end date
  const finalEnd = extendedEnd && extendedEnd > mfgEnd ? extendedEnd : mfgEnd
  const isFullyExpired = now > finalEnd

  const remainingMonths = calcRemainingMonths(now, finalEnd)

  const mfgProgress = calcProgressPercent(mfgStart, mfgEnd, now)
  const extProgress =
    hasExtended && extendedEnd
      ? calcProgressPercent(mfgEnd, extendedEnd, now)
      : 0

  const isEmpty = !warrantyEndDate && !warrantyMileage

  return (
    <section id="warranty" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            보증 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              보증 정보가 등록되지 않았습니다
            </p>
          ) : (
            <div className="space-y-5">
              {/* Manufacturer warranty bar */}
              <div className="space-y-2">
                <Progress value={mfgProgress}>
                  <ProgressLabel>제조사 보증</ProgressLabel>
                  <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                    {formatDate(mfgStart)} ~ {formatDate(mfgEnd)}
                  </span>
                </Progress>
                {mfgExpired && (
                  <Badge variant="destructive">보증 만료</Badge>
                )}
              </div>

              {/* Extended warranty bar */}
              {hasExtended && extendedEnd && (
                <div className="space-y-2">
                  <Progress value={extProgress}>
                    <ProgressLabel>연장 보증</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {formatDate(mfgEnd)} ~ {formatDate(extendedEnd)}
                    </span>
                  </Progress>
                  {now > extendedEnd && (
                    <Badge variant="destructive">보증 만료</Badge>
                  )}
                </div>
              )}

              {/* Remaining info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {isFullyExpired ? (
                  <span>보증 기간이 만료되었습니다</span>
                ) : (
                  <span>
                    남은 기간: <strong className="text-foreground">{remainingMonths}개월</strong>
                  </span>
                )}
                {(warrantyMileage || (!warrantyMileage && !isEmpty)) && (
                  <span>
                    보증 주행거리:{' '}
                    <strong className="text-foreground">
                      {formatDistance(warrantyMileage || MANUFACTURER_WARRANTY_KM)}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
