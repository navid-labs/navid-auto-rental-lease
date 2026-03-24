import { getDashboardStatsQuery } from '@/features/admin/queries/dashboard'
import { StatsCards } from './stats-cards'
import { ChartSection } from './chart-section'
import { RecentActivity } from './recent-activity'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const stats = await getDashboardStatsQuery()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>

      <StatsCards
        vehicleCount={stats.vehicleCount}
        activeContracts={stats.activeContracts}
        userCount={stats.userCount}
        pendingApprovals={stats.pendingApprovals}
      />

      <ChartSection
        monthlyVehicles={stats.monthlyVehicles}
        monthlyContracts={stats.monthlyContracts}
      />

      <RecentActivity activities={stats.recentActivity} />
    </div>
  )
}
