'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ApprovalBadge } from './approval-badge'
import { ApprovalDialog } from './approval-dialog'
import { batchApproveVehicles as batchApproveVehiclesApi } from '@/lib/api/generated/vehicles/vehicles'
import { ApiError } from '@/lib/api/fetcher'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import Image from 'next/image'
import { Car, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type ApprovalQueueTableProps = {
  vehicles: VehicleWithDetails[]
}

type DialogState = {
  open: boolean
  vehicleId: string
  vehicleName: string
  action: 'APPROVED' | 'REJECTED'
}

export function ApprovalQueueTable({ vehicles }: ApprovalQueueTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    vehicleId: '',
    vehicleName: '',
    action: 'APPROVED',
  })

  const allSelected = vehicles.length > 0 && selectedIds.size === vehicles.length
  const someSelected = selectedIds.size > 0

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(vehicles.map((v) => v.id)))
    }
  }, [allSelected, vehicles])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleBatchApprove = useCallback(() => {
    startTransition(async () => {
      try {
        await batchApproveVehiclesApi({ vehicleIds: Array.from(selectedIds) })
        setSelectedIds(new Set())
        router.refresh()
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : '일괄 승인에 실패했습니다.')
      }
    })
  }, [selectedIds, router])

  const openDialog = useCallback(
    (vehicleId: string, vehicleName: string, action: 'APPROVED' | 'REJECTED') => {
      setDialog({ open: true, vehicleId, vehicleName, action })
    },
    []
  )

  const handleDialogComplete = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <CheckCircle className="size-8" />
        <p>승인 대기 중인 차량이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Batch action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size}건 선택됨
          </span>
          <Button
            size="sm"
            onClick={handleBatchApprove}
            disabled={isPending}
          >
            {isPending ? '승인 중...' : `선택 승인 (${selectedIds.size})`}
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="전체 선택"
              />
            </TableHead>
            <TableHead>차량</TableHead>
            <TableHead>딜러</TableHead>
            <TableHead>가격</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead>승인</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const brandName =
              vehicle.trim.generation.carModel.brand.nameKo ||
              vehicle.trim.generation.carModel.brand.name
            const modelName =
              vehicle.trim.generation.carModel.nameKo ||
              vehicle.trim.generation.carModel.name
            const fullName = `${brandName} ${modelName} ${vehicle.year}`

            return (
              <TableRow key={vehicle.id}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(vehicle.id)}
                    onCheckedChange={() => toggleOne(vehicle.id)}
                    aria-label={`${fullName} 선택`}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex cursor-pointer items-center gap-3"
                    onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                  >
                    {vehicle.images[0] ? (
                      <Image
                        src={vehicle.images[0].url}
                        alt={fullName}
                        width={40}
                        height={40}
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                        <Car className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.trim.name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{vehicle.dealer?.name ?? '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {vehicle.price.toLocaleString('ko-KR')}만원
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(vehicle.createdAt, { short: true })}
                  </span>
                </TableCell>
                <TableCell>
                  {'approvalStatus' in vehicle && vehicle.approvalStatus ? (
                    <ApprovalBadge
                      status={vehicle.approvalStatus}
                      rejectionReason={
                        'rejectionReason' in vehicle
                          ? (vehicle.rejectionReason as string | null)
                          : null
                      }
                    />
                  ) : null}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => openDialog(vehicle.id, fullName, 'APPROVED')}
                      disabled={isPending}
                    >
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => openDialog(vehicle.id, fullName, 'REJECTED')}
                      disabled={isPending}
                    >
                      거절
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Approval/Rejection Dialog */}
      <ApprovalDialog
        vehicleId={dialog.vehicleId}
        vehicleName={dialog.vehicleName}
        action={dialog.action}
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        onComplete={handleDialogComplete}
      />
    </div>
  )
}
