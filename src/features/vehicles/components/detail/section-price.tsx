'use client'

import { Calculator, Banknote, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { pmt } from '@/lib/finance/pmt'
import { formatKRW } from '@/lib/utils/format'

type SectionPriceProps = {
  price: number
  monthlyRental: number | null
  monthlyLease: number | null
  vehicleId: string
}

export function SectionPrice({
  price,
  monthlyRental,
  monthlyLease,
}: SectionPriceProps) {
  // 5.9% annual rate, 60 months
  const monthlyPayment = Math.abs(pmt(0.059 / 12, 60, price))

  const registrationTax = Math.floor(price * 0.07)
  const estimatedInsurance = Math.floor(price * 0.03)
  const totalCost = price + registrationTax + estimatedInsurance

  return (
    <Card id="price" className="p-0">
      <CardContent className="space-y-5">
        {/* Main price */}
        <div>
          <h3 className="text-lg font-semibold mb-2">가격정보</h3>
          <p className="text-2xl font-bold tabular-nums">
            {Math.floor(price / 10000)}만원
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            월 {formatKRW(Math.round(monthlyPayment))} (5.9%, 60개월 기준)
          </p>
        </div>

        {/* Rental / Lease monthly */}
        {(monthlyRental || monthlyLease) && (
          <div className="space-y-1 text-sm">
            {monthlyRental && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">월 렌탈료</span>
                <span className="font-medium tabular-nums">
                  {formatKRW(monthlyRental)}
                </span>
              </div>
            )}
            {monthlyLease && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">월 리스료</span>
                <span className="font-medium tabular-nums">
                  {formatKRW(monthlyLease)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cost breakdown */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">취등록세 (7%)</span>
            <span className="tabular-nums">{formatKRW(registrationTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">보험료 (예상)</span>
            <span className="tabular-nums">
              {formatKRW(estimatedInsurance)}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span>총 구매비용</span>
            <span className="tabular-nums">{formatKRW(totalCost)}</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Calculator className="size-3.5" />
            할부계산
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Banknote className="size-3.5" />
            대출한도
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ShieldCheck className="size-3.5" />
            보험료
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
