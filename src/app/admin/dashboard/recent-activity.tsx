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
      return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
    case 'PENDING_APPROVAL':
    case 'PENDING_EKYC':
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
    case 'CANCELED':
      return 'bg-red-100 text-red-800 ring-1 ring-red-200'
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-muted'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            최근 활동이 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">최근 활동</CardTitle>
        <p className="text-xs text-muted-foreground">최근 계약 및 처리 현황</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul>
          {activities.map((item, index) => (
            <li
              key={`${item.contractType}-${item.id}`}
              className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
            >
              <Link
                href="/admin/contracts"
                className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-blue-50/40"
              >
                {/* Contract type badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${
                    item.contractType === 'RENTAL'
                      ? 'bg-blue-100 text-blue-800 ring-blue-200'
                      : 'bg-violet-100 text-violet-800 ring-violet-200'
                  }`}
                >
                  {item.contractType === 'RENTAL' ? '렌탈' : '리스'}
                </span>

                {/* Vehicle & customer */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.vehicleName}</p>
                  <p className="text-xs text-muted-foreground">{item.customerName}</p>
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(item.status)}`}
                >
                  {CONTRACT_STATUS_LABELS[item.status as ContractStatus] ?? item.status}
                </span>

                {/* Relative time */}
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
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
