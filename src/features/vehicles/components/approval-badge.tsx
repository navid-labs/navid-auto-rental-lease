import { cva } from 'class-variance-authority'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ApprovalStatus } from '@prisma/client'
import { APPROVAL_LABELS } from '@/features/vehicles/utils/approval-machine'

const approvalBadgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
  {
    variants: {
      status: {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
      },
    },
  }
)

/** Color-coded badge displaying vehicle approval status in Korean */
export function ApprovalBadge({
  status,
  rejectionReason,
}: {
  status: ApprovalStatus
  rejectionReason?: string | null
}) {
  const badge = (
    <span className={approvalBadgeVariants({ status })}>
      {APPROVAL_LABELS[status]}
    </span>
  )

  if (status === 'REJECTED' && rejectionReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{rejectionReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
