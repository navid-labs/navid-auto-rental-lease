'use client'

import { useRouter } from 'next/navigation'
import { useContractRealtime } from '@/features/contracts/hooks/use-contract-realtime'
import { ContractStatusBadge } from '@/features/contracts/components/contract-status-badge'
import {
  CONTRACT_STATUS_LABELS,
} from '@/features/contracts/utils/contract-machine'
import { formatKRW } from '@/lib/utils/format'
import type { ContractStatus } from '@prisma/client'
import { Check, Circle, AlertTriangle } from 'lucide-react'

/** Contract status flow steps (ordered) */
const STATUS_STEPS: ContractStatus[] = [
  'DRAFT',
  'PENDING_EKYC',
  'PENDING_APPROVAL',
  'APPROVED',
  'ACTIVE',
  'COMPLETED',
]

type ContractData = {
  id: string
  status: ContractStatus
  monthlyPayment: number
  deposit: number
  totalAmount: number
  startDate: Date | string | null
  endDate: Date | string | null
  residualValue?: number | null
  residualRate?: number | null
  vehicleName: string
  vehicleYear: number
  vehicleImageUrl: string | null
}

type ContractStatusTrackerProps = {
  contract: ContractData
  contractType: 'RENTAL' | 'LEASE'
}

export function ContractStatusTracker({ contract, contractType }: ContractStatusTrackerProps) {
  const router = useRouter()

  // Subscribe to realtime status updates
  useContractRealtime(contract.id, contractType, (newStatus) => {
    // Show banner notification
    const label = CONTRACT_STATUS_LABELS[newStatus]
    showStatusToast(`계약 상태가 ${label}(으)로 변경되었습니다`)
    // Reload server data
    router.refresh()
  })

  const currentStepIndex = STATUS_STEPS.indexOf(contract.status)
  const isCanceled = contract.status === 'CANCELED'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Canceled banner */}
      {isCanceled && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="size-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">계약이 취소되었습니다</p>
            <p className="text-sm text-red-600">자세한 내용은 고객센터에 문의해 주세요.</p>
          </div>
        </div>
      )}

      {/* Status timeline */}
      {!isCanceled && (
        <div className="rounded-xl border bg-card p-6 shadow-sm backdrop-blur-sm">
          <h3 className="mb-6 text-sm font-semibold text-muted-foreground">계약 진행 현황</h3>

          {/* Desktop: horizontal */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex

                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors ${
                          isCompleted
                            ? 'border-green-500 bg-green-500 text-white'
                            : isCurrent
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="size-4" />
                        ) : (
                          <Circle className={`size-3 ${isCurrent ? 'fill-blue-500' : ''}`} />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-center text-xs ${
                          isCurrent
                            ? 'font-semibold text-blue-600'
                            : isCompleted
                              ? 'font-medium text-green-700'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {CONTRACT_STATUS_LABELS[step]}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 flex-1 ${
                          idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: vertical */}
          <div className="space-y-0 md:hidden">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex

              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-7 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : isCurrent
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Circle className={`size-2.5 ${isCurrent ? 'fill-blue-500' : ''}`} />
                      )}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-6 w-0.5 ${
                          idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-6 ${isCurrent ? 'font-semibold text-blue-600' : isCompleted ? 'text-green-700' : 'text-muted-foreground'}`}>
                    <span className="text-sm">{CONTRACT_STATUS_LABELS[step]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vehicle info card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">차량 정보</h3>
        <div className="flex gap-4">
          {contract.vehicleImageUrl && (
            <div className="size-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={contract.vehicleImageUrl}
                alt={contract.vehicleName}
                className="size-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-lg font-bold">{contract.vehicleName}</p>
            <p className="text-sm text-muted-foreground">{contract.vehicleYear}년식</p>
          </div>
        </div>
      </div>

      {/* Contract details card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">계약 상세</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="계약 유형" value={contractType === 'RENTAL' ? '렌탈' : '리스'} />
          <DetailItem label="현재 상태">
            <ContractStatusBadge status={contract.status} />
          </DetailItem>
          <DetailItem label="월 납입금" value={formatKRW(contract.monthlyPayment, { monthly: true })} />
          <DetailItem label="보증금" value={formatKRW(contract.deposit)} />
          <DetailItem label="총 금액" value={formatKRW(contract.totalAmount)} />
          {contractType === 'LEASE' && contract.residualValue != null && (
            <DetailItem label="잔존가치" value={formatKRW(contract.residualValue)} />
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children ?? value}</dd>
    </div>
  )
}

/** Simple toast notification (no dependency on external toast lib) */
function showStatusToast(message: string) {
  if (typeof document === 'undefined') return

  const toast = document.createElement('div')
  toast.className =
    'fixed top-4 right-4 z-50 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-right-5 fade-in'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right-5')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}
