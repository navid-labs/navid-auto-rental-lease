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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 차량 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <RechartsBar data={monthlyVehicles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 계약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <RechartsLine data={monthlyContracts} />
        </CardContent>
      </Card>
    </div>
  )
}
