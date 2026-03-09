'use client'

import { formatKRW } from '@/lib/utils/format'
import type { RentalResult, LeaseResult } from '@/lib/finance/calculate'

type ComparisonColumnsProps = {
  rental: RentalResult
  lease: LeaseResult
}

export function ComparisonColumns({ rental, lease }: ComparisonColumnsProps) {
  const rentalLower = rental.monthlyPayment <= lease.monthlyPayment

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Rental Column */}
        <div
          className={`flex-1 rounded-xl border p-4 transition-colors ${
            rentalLower
              ? 'border-accent/40 bg-accent/5'
              : 'border-border bg-card'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">렌탈</h3>
            {rentalLower && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                월 납입금 유리
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatKRW(rental.monthlyPayment, { monthly: true })}
          </p>
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>보증금</dt>
              <dd className="font-medium text-foreground">{formatKRW(rental.deposit)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>총 비용</dt>
              <dd className="font-medium text-foreground">{formatKRW(rental.totalCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>계약 기간</dt>
              <dd className="font-medium text-foreground">{rental.periodMonths}개월</dd>
            </div>
          </dl>
        </div>

        {/* Lease Column */}
        <div
          className={`flex-1 rounded-xl border p-4 transition-colors ${
            !rentalLower
              ? 'border-accent/40 bg-accent/5'
              : 'border-border bg-card'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">리스</h3>
            {!rentalLower && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                월 납입금 유리
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatKRW(lease.monthlyPayment, { monthly: true })}
          </p>
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>보증금</dt>
              <dd className="font-medium text-foreground">{formatKRW(lease.deposit)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>잔존가치</dt>
              <dd className="font-medium text-foreground">
                {formatKRW(lease.residualValue)}{' '}
                <span className="text-xs text-muted-foreground">
                  ({Math.round(lease.residualRate * 100)}%)
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>총 비용</dt>
              <dd className="font-medium text-foreground">{formatKRW(lease.totalCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>계약 기간</dt>
              <dd className="font-medium text-foreground">{lease.periodMonths}개월</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Educational Note */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">렌탈 vs 리스 차이점</p>
        <p className="mt-1">
          <strong>렌탈</strong>은 차량 가격을 기간으로 나누어 납부하며, 계약 종료 시 반납합니다.{' '}
          <strong>리스</strong>는 잔존가치를 제외한 금액을 금융 이자와 함께 납부하며, 만기 시 인수 또는 반납을 선택할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
