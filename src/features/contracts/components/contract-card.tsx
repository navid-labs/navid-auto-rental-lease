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
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
    >
      {/* Vehicle thumbnail */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
        {contract.vehicleImageUrl ? (
          <Image
            src={contract.vehicleImageUrl}
            alt={contract.vehicleName}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="size-8 text-gray-300" aria-hidden="true">
              <path
                d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h12l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Vehicle info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{contract.vehicleName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {typeLabel}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {formatKRW(contract.monthlyPayment, { monthly: true })}
          </span>
        </div>
      </div>

      {/* Status + download */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <ContractStatusBadge status={contract.status} />
        {canDownload ? (
          <a
            href={`/api/contracts/${contract.id}/pdf?type=${contract.contractType}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="계약서 다운로드"
          >
            <Download className="size-3.5" />
            PDF
          </a>
        ) : null}
      </div>
    </Link>
  )
}
