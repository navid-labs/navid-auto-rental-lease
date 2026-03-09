import Link from 'next/link'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { ContractStatusBadge } from '@/features/contracts/components/contract-status-badge'
import { formatKRW } from '@/lib/utils/format'
import type { ContractListItem } from '@/features/contracts/types'

const PDF_ELIGIBLE_STATUSES = ['APPROVED', 'ACTIVE', 'COMPLETED'] as const

type ContractCardProps = {
  contract: ContractListItem
}

export function ContractCard({ contract }: ContractCardProps) {
  const canDownload = PDF_ELIGIBLE_STATUSES.includes(
    contract.status as (typeof PDF_ELIGIBLE_STATUSES)[number]
  )
  const typeLabel = contract.contractType === 'RENTAL' ? '렌탈' : '리스'

  return (
    <Link
      href={`/contracts/${contract.id}?type=${contract.contractType}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
    >
      {/* Vehicle thumbnail */}
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {contract.vehicleImageUrl ? (
          <Image
            src={contract.vehicleImageUrl}
            alt={contract.vehicleName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : null}
      </div>

      {/* Vehicle info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{contract.vehicleName}</p>
        <p className="text-sm text-gray-500">
          {typeLabel} | {formatKRW(contract.monthlyPayment, { monthly: true })}
        </p>
      </div>

      {/* Status + download */}
      <div className="flex shrink-0 items-center gap-2">
        <ContractStatusBadge status={contract.status} />
        {canDownload ? (
          <a
            href={`/api/contracts/${contract.id}/pdf?type=${contract.contractType}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="계약서 다운로드"
          >
            <Download className="size-4" />
          </a>
        ) : null}
      </div>
    </Link>
  )
}
