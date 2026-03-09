'use client'

import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { MonthlyData } from '@/features/admin/actions/get-dashboard-stats'

const RechartsBar = dynamic(() => import('./recharts-bar'), { ssr: false })
const RechartsLine = dynamic(() => import('./recharts-line'), { ssr: false })

type ChartSectionProps = {
  monthlyVehicles: MonthlyData[]
  monthlyContracts: MonthlyData[]
}

export function ChartSection({ monthlyVehicles, monthlyContracts }: ChartSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">월별 차량 등록</CardTitle>
          <p className="text-xs text-muted-foreground">최근 6개월 신규 등록 차량 수</p>
        </CardHeader>
        <CardContent className="pt-4">
          <RechartsBar data={monthlyVehicles} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">월별 계약 현황</CardTitle>
          <p className="text-xs text-muted-foreground">최근 6개월 신규 계약 추이</p>
        </CardHeader>
        <CardContent className="pt-4">
          <RechartsLine data={monthlyContracts} />
        </CardContent>
      </Card>
    </div>
  )
}
