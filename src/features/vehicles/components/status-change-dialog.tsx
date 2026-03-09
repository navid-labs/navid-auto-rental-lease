'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from './status-badge'
import { getAvailableTransitions } from '@/features/vehicles/utils/status-machine'
import { updateStatus } from '@/features/vehicles/actions/update-status'
import type { VehicleStatus } from '@prisma/client'

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: '판매 가능',
  RESERVED: '예약됨',
  RENTED: '렌탈 중',
  LEASED: '리스 중',
  MAINTENANCE: '정비 중',
  HIDDEN: '숨김',
}

type StatusChangeDialogProps = {
  vehicleId: string
  currentStatus: VehicleStatus
  userRole: 'DEALER' | 'ADMIN'
  onStatusChanged?: () => void
  children: React.ReactNode
}

export function StatusChangeDialog({
  vehicleId,
  currentStatus,
  userRole,
  onStatusChanged,
  children,
}: StatusChangeDialogProps) {
  const [open, setOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const availableStatuses = getAvailableTransitions(currentStatus, userRole)

  const handleConfirm = () => {
    if (!targetStatus) return

    startTransition(async () => {
      setError('')
      const result = await updateStatus(vehicleId, targetStatus as VehicleStatus, note || undefined)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setOpen(false)
      setTargetStatus('')
      setNote('')
      onStatusChanged?.()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span className="cursor-pointer" />}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>상태 변경</DialogTitle>
          <DialogDescription>
            현재 상태: <StatusBadge status={currentStatus} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="grid gap-2">
            <Label>변경할 상태</Label>
            <Select value={targetStatus} onValueChange={(v) => setTargetStatus(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status-note">메모 (선택)</Label>
            <Textarea
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="상태 변경 사유를 입력해주세요."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!targetStatus || isPending}>
            {isPending ? '변경 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
