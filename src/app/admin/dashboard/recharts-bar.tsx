'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyData } from '@/features/admin/actions/get-dashboard-stats'

type RechartsBarProps = {
  data: MonthlyData[]
}

export default function RechartsBar({ data }: RechartsBarProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis allowDecimals={false} className="text-xs" />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }}
        />
        <Bar dataKey="count" name="등록 차량" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
