import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from '@/features/contracts/utils/contract-machine'
import type { ContractStatus } from '@prisma/client'

type ContractStatusBadgeProps = {
  status: ContractStatus
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const label = CONTRACT_STATUS_LABELS[status]
  const colorClass = CONTRACT_STATUS_COLORS[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  )
}
