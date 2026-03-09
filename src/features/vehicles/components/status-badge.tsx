import { cva } from 'class-variance-authority'
import type { VehicleStatus } from '@prisma/client'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
  {
    variants: {
      status: {
        AVAILABLE: 'bg-green-100 text-green-700',
        RESERVED: 'bg-yellow-100 text-yellow-700',
        RENTED: 'bg-blue-100 text-blue-700',
        LEASED: 'bg-blue-100 text-blue-700',
        MAINTENANCE: 'bg-orange-100 text-orange-700',
        HIDDEN: 'bg-gray-100 text-gray-500',
      },
    },
  }
)

/** Korean labels for each vehicle status */
export const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: '판매 가능',
  RESERVED: '예약됨',
  RENTED: '렌탈 중',
  LEASED: '리스 중',
  MAINTENANCE: '정비 중',
  HIDDEN: '숨김',
}

/** Color-coded badge displaying vehicle status in Korean */
export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span className={badgeVariants({ status })}>
      {STATUS_LABELS[status]}
    </span>
  )
}
