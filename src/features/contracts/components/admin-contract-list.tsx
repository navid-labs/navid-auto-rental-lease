'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { ContractStatusBadge } from '@/features/contracts/components/contract-status-badge'
import { approveContract } from '@/features/contracts/actions/approve-contract'
import { formatKRW, formatDate } from '@/lib/utils/format'
import { CONTRACT_STATUS_LABELS } from '@/features/contracts/utils/contract-machine'
import type { ContractStatus } from '@prisma/client'
import { CheckCircle, XCircle, Loader2, Ban } from 'lucide-react'

type ContractItem = {
  id: string
  contractType: 'RENTAL' | 'LEASE'
  status: ContractStatus
  monthlyPayment: number
  deposit: number
  totalAmount: number
  createdAt: Date
  vehicleName: string
  customerName: string
}

type AdminContractListProps = {
  contracts: ContractItem[]
}

const REJECTION_PRESETS = ['서류 미비', '신용 확인 필요', '차량 상태 변경']

const TABS: { key: string; label: string; filter?: ContractStatus[] }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인 대기', filter: ['PENDING_APPROVAL'] },
  { key: 'approved', label: '승인됨', filter: ['APPROVED'] },
  { key: 'active', label: '진행 중', filter: ['ACTIVE'] },
  { key: 'completed', label: '완료', filter: ['COMPLETED', 'CANCELED'] },
]

/** Statuses that can be canceled by admin */
const CANCELABLE_STATUSES: ContractStatus[] = ['PENDING_APPROVAL', 'APPROVED']

export function AdminContractList({ contracts }: AdminContractListProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'all'
  const [isPending, startTransition] = useTransition()
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    contractId: string
    contractType: 'RENTAL' | 'LEASE'
  }>({ open: false, contractId: '', contractType: 'RENTAL' })
  const [rejectReason, setRejectReason] = useState('')

  const currentFilter = TABS.find((t) => t.key === activeTab)
  const filtered = currentFilter?.filter
    ? contracts.filter((c) => currentFilter.filter!.includes(c.status))
    : contracts

  const pendingCount = contracts.filter((c) => c.status === 'PENDING_APPROVAL').length

  function handleApprove(contractId: string, contractType: 'RENTAL' | 'LEASE') {
    startTransition(async () => {
      const result = await approveContract(contractId, contractType, 'APPROVED')
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('계약이 승인되었습니다.')
      }
    })
  }

  function handleCancel(contractId: string, contractType: 'RENTAL' | 'LEASE') {
    if (!confirm('이 계약을 취소하시겠습니까?')) return

    startTransition(async () => {
      const result = await approveContract(contractId, contractType, 'CANCELED', '관리자 취소')
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('계약이 취소되었습니다.')
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await approveContract(
        rejectDialog.contractId,
        rejectDialog.contractType,
        'CANCELED',
        rejectReason
      )
      if ('error' in result) {
        toast.error(result.error)
      }
      setRejectDialog({ open: false, contractId: '', contractType: 'RENTAL' })
      setRejectReason('')
    })
  }

  function renderActions(contract: ContractItem) {
    if (contract.status === 'PENDING_APPROVAL') {
      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="xs"
            variant="default"
            disabled={isPending}
            onClick={() => handleApprove(contract.id, contract.contractType)}
          >
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCircle className="size-3" />
            )}
            승인
          </Button>
          <Button
            size="xs"
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              setRejectDialog({
                open: true,
                contractId: contract.id,
                contractType: contract.contractType,
              })
            }
          >
            <XCircle className="size-3" />
            반려
          </Button>
        </div>
      )
    }

    if (CANCELABLE_STATUSES.includes(contract.status)) {
      return (
        <Button
          size="xs"
          variant="outline"
          disabled={isPending}
          onClick={() => handleCancel(contract.id, contract.contractType)}
          className="text-destructive hover:text-destructive"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Ban className="size-3" />
          )}
          취소
        </Button>
      )
    }

    return (
      <span className="text-xs text-muted-foreground">
        {CONTRACT_STATUS_LABELS[contract.status]}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/admin/contracts' : `/admin/contracts?tab=${tab.key}`}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {activeTab === 'pending' ? '승인 대기 중인 계약이 없습니다.' : '계약이 없습니다.'}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">차량</th>
                  <th className="px-4 py-3 text-left font-medium">고객</th>
                  <th className="px-4 py-3 text-left font-medium">유형</th>
                  <th className="px-4 py-3 text-right font-medium">월납입금</th>
                  <th className="px-4 py-3 text-left font-medium">상태</th>
                  <th className="px-4 py-3 text-left font-medium">신청일</th>
                  <th className="px-4 py-3 text-center font-medium">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((contract) => (
                  <tr key={`${contract.contractType}-${contract.id}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{contract.vehicleName}</td>
                    <td className="px-4 py-3">{contract.customerName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          contract.contractType === 'RENTAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contract.contractType === 'RENTAL' ? '렌탈' : '리스'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatKRW(contract.monthlyPayment, { monthly: true })}
                    </td>
                    <td className="px-4 py-3">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(contract.createdAt, { short: true })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderActions(contract)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((contract) => (
              <div
                key={`${contract.contractType}-${contract.id}`}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{contract.vehicleName}</p>
                    <p className="text-xs text-muted-foreground">{contract.customerName}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      contract.contractType === 'RENTAL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {contract.contractType === 'RENTAL' ? '렌탈' : '리스'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ContractStatusBadge status={contract.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(contract.createdAt, { short: true })}
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatKRW(contract.monthlyPayment, { monthly: true })}
                  </span>
                </div>
                <div className="flex justify-end">
                  {renderActions(contract)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rejection reason dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, contractId: '', contractType: 'RENTAL' })
            setRejectReason('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>계약 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Quick select chips */}
            <div className="flex flex-wrap gap-2">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    rejectReason === preset
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
            >
              취소
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
              반려 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
