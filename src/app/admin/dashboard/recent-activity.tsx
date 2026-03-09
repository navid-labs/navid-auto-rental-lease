import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { ActivityItem } from '@/features/admin/actions/get-dashboard-stats'
import { CONTRACT_STATUS_LABELS } from '@/features/contracts/utils/contract-machine'
import type { ContractStatus } from '@prisma/client'

type RecentActivityProps = {
  activities: ActivityItem[]
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  const months = Math.floor(days / 30)
  return `${months}개월 전`
}

function statusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800'
    case 'PENDING_APPROVAL':
    case 'PENDING_EKYC':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800'
    case 'CANCELED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            최근 활동이 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">최근 활동</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {activities.map((item) => (
            <li key={`${item.contractType}-${item.id}`}>
              <Link
                href="/admin/contracts"
                className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
              >
                {/* Contract type badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    item.contractType === 'RENTAL'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {item.contractType === 'RENTAL' ? '렌탈' : '리스'}
                </span>

                {/* Vehicle & customer */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.vehicleName}</p>
                  <p className="text-xs text-muted-foreground">{item.customerName}</p>
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(item.status)}`}
                >
                  {CONTRACT_STATUS_LABELS[item.status as ContractStatus] ?? item.status}
                </span>

                {/* Relative time */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {getRelativeTime(item.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
