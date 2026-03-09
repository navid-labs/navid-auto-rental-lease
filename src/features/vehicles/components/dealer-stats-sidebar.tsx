import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Clock, CheckCircle, XCircle, Car, CalendarCheck, FileText } from 'lucide-react'

type DealerStatsSidebarProps = {
  approvalCounts: Record<string, number>
  statusCounts: Record<string, number>
  totalVehicles: number
}

const approvalItems = [
  { key: 'PENDING', label: '승인 대기', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  { key: 'APPROVED', label: '승인됨', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  { key: 'REJECTED', label: '거절됨', color: 'text-red-600 bg-red-50', icon: XCircle },
] as const

const statusItems = [
  { key: 'AVAILABLE', label: '판매 가능', color: 'text-blue-600 bg-blue-50', icon: Car },
  { key: 'RESERVED', label: '예약됨', color: 'text-purple-600 bg-purple-50', icon: CalendarCheck },
  { key: 'RENTED', label: '렌탈 중', color: 'text-emerald-600 bg-emerald-50', icon: Car },
] as const

export function DealerStatsSidebar({
  approvalCounts,
  statusCounts,
  totalVehicles,
}: DealerStatsSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Approval stats */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          승인 현황
        </h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {approvalItems.map((item) => (
            <Card key={item.key} size="sm">
              <CardContent className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{approvalCounts[item.key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Vehicle status stats */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          차량 현황 <span className="font-normal">({totalVehicles}대)</span>
        </h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {statusItems.map((item) => (
            <Card key={item.key} size="sm">
              <CardContent className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{statusCounts[item.key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contract requests placeholder */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          계약 요청
        </h3>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <FileText className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              아직 계약 요청이 없습니다
            </p>
            <p className="text-xs text-muted-foreground/60">
              Phase 7에서 활성화됩니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
