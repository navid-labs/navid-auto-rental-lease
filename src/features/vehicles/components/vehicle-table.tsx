'use client'

import { useState, useTransition, useCallback } from 'react'
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
import { StatusBadge } from './status-badge'
import { ApprovalBadge } from './approval-badge'
import { StatusChangeDialog } from './status-change-dialog'
import { deleteVehicle } from '@/features/vehicles/actions/delete-vehicle'
import { resubmitVehicle } from '@/features/vehicles/actions/resubmit-vehicle'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import type { VehicleStatus } from '@prisma/client'
import Image from 'next/image'
import { Pencil, Trash2, Car, RotateCcw } from 'lucide-react'

const STATUS_TABS: { label: string; value: VehicleStatus | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '판매 가능', value: 'AVAILABLE' },
  { label: '예약됨', value: 'RESERVED' },
  { label: '렌탈 중', value: 'RENTED' },
  { label: '리스 중', value: 'LEASED' },
  { label: '정비 중', value: 'MAINTENANCE' },
  { label: '숨김', value: 'HIDDEN' },
]

type VehicleTableProps = {
  vehicles: VehicleWithDetails[]
  userRole: 'DEALER' | 'ADMIN'
  basePath: string
}

function formatKRW(value: number): string {
  if (value >= 10000) {
    const man = Math.floor(value / 10000)
    const remainder = value % 10000
    return remainder > 0
      ? `${man.toLocaleString('ko-KR')}만 ${remainder.toLocaleString('ko-KR')}원`
      : `${man.toLocaleString('ko-KR')}만원`
  }
  return `${value.toLocaleString('ko-KR')}원`
}

export function VehicleTable({ vehicles, userRole, basePath }: VehicleTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL')
  const [isPending, startTransition] = useTransition()

  const filteredVehicles =
    statusFilter === 'ALL'
      ? vehicles
      : vehicles.filter((v) => v.status === statusFilter)

  // Hide HIDDEN tab for dealers
  const tabs = userRole === 'ADMIN' ? STATUS_TABS : STATUS_TABS.filter((t) => t.value !== 'HIDDEN')

  const handleDelete = useCallback(
    (vehicleId: string) => {
      if (!confirm('이 차량을 숨김 처리하시겠습니까?')) return

      startTransition(async () => {
        const result = await deleteVehicle(vehicleId)
        if ('error' in result) {
          alert(result.error)
          return
        }
        router.refresh()
      })
    },
    [router]
  )

  const handleStatusChanged = useCallback(() => {
    router.refresh()
  }, [router])

  const handleResubmit = useCallback(
    (vehicleId: string) => {
      startTransition(async () => {
        const result = await resubmitVehicle(vehicleId)
        if ('error' in result) {
          alert(result.error)
          return
        }
        router.refresh()
      })
    },
    [router]
  )

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== 'ALL' && (
              <span className="ml-1 text-xs opacity-70">
                ({vehicles.filter((v) => v.status === tab.value).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Car className="size-8" />
          <p>등록된 차량이 없습니다.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>차량</TableHead>
              <TableHead>연식</TableHead>
              <TableHead>주행거리</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>승인</TableHead>
              {userRole === 'ADMIN' && <TableHead>딜러</TableHead>}
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => {
              const brandName = vehicle.trim.generation.carModel.brand.nameKo
                || vehicle.trim.generation.carModel.brand.name
              const modelName = vehicle.trim.generation.carModel.nameKo
                || vehicle.trim.generation.carModel.name
              const trimName = vehicle.trim.name

              return (
                <TableRow
                  key={vehicle.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`${basePath}/${vehicle.id}/edit`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {vehicle.images[0] ? (
                        <Image
                          src={vehicle.images[0].url}
                          alt={`${brandName} ${modelName}`}
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
                        <p className="font-medium">
                          {brandName} {modelName}
                        </p>
                        <p className="text-xs text-muted-foreground">{trimName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.year}년</TableCell>
                  <TableCell>{vehicle.mileage.toLocaleString('ko-KR')}km</TableCell>
                  <TableCell>{formatKRW(vehicle.price)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusChangeDialog
                      vehicleId={vehicle.id}
                      currentStatus={vehicle.status}
                      userRole={userRole}
                      onStatusChanged={handleStatusChanged}
                    >
                      <StatusBadge status={vehicle.status} />
                    </StatusChangeDialog>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {'approvalStatus' in vehicle && vehicle.approvalStatus ? (
                        <ApprovalBadge
                          status={vehicle.approvalStatus}
                          rejectionReason={'rejectionReason' in vehicle ? (vehicle.rejectionReason as string | null) : null}
                        />
                      ) : null}
                      {userRole === 'DEALER' && 'approvalStatus' in vehicle && vehicle.approvalStatus === 'REJECTED' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleResubmit(vehicle.id)}
                          disabled={isPending}
                          aria-label="재심사 요청"
                          title="재심사 요청"
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {userRole === 'ADMIN' && (
                    <TableCell>
                      <span className="text-xs">{vehicle.dealer?.name ?? '-'}</span>
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => router.push(`${basePath}/${vehicle.id}/edit`)}
                        aria-label="수정"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={isPending}
                        aria-label="삭제"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
