'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { approveVehicle as approveVehicleApi } from '@/lib/api/generated/vehicles/vehicles'
import { ApiError } from '@/lib/api/fetcher'
import { REJECTION_PRESETS } from '@/features/vehicles/utils/approval-machine'

type ApprovalDialogProps = {
  vehicleId: string
  vehicleName: string
  action: 'APPROVED' | 'REJECTED'
  onComplete: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApprovalDialog({
  vehicleId,
  vehicleName,
  action,
  onComplete,
  open,
  onOpenChange,
}: ApprovalDialogProps) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const isApprove = action === 'APPROVED'
  const canConfirm = isApprove || reason.trim().length > 0

  const handleConfirm = () => {
    startTransition(async () => {
      setError('')
      try {
        await approveVehicleApi(vehicleId, {
          action,
          ...(isApprove ? {} : { reason: reason.trim() }),
        })
        setReason('')
        onOpenChange(false)
        router.refresh()
        onComplete()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : '요청에 실패했습니다.')
      }
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason('')
      setError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? '차량 승인' : '차량 거절'}
          </DialogTitle>
          <DialogDescription>
            {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {isApprove ? (
            <p className="text-sm text-muted-foreground">
              이 차량을 승인하시겠습니까? 승인 후 공개 검색에 노출됩니다.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>거절 사유 (필수)</Label>
                <div className="flex flex-wrap gap-2">
                  {REJECTION_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={reason === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReason(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="거절 사유를 입력하거나 위 버튼을 클릭하세요."
                rows={3}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {isPending
              ? (isApprove ? '승인 중...' : '거절 중...')
              : (isApprove ? '승인' : '거절')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
