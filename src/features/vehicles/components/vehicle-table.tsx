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
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from './status-badge'
import { ApprovalBadge } from './approval-badge'
import { StatusChangeDialog } from './status-change-dialog'
import {
  deleteVehicle as deleteVehicleApi,
  resubmitVehicle as resubmitVehicleApi,
} from '@/lib/api/generated/vehicles/vehicles'
import { deleteAdminVehiclesId } from '@/lib/api/generated/admin/admin'
import { ApiError } from '@/lib/api/fetcher'
import { VehicleEditSheet } from '@/features/admin/components/vehicle-edit-sheet'
import type { VehicleWithDetails } from '@/features/vehicles/types'
import type { VehicleStatus } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'
import Image from 'next/image'
import { Pencil, Trash2, Car, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 15

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

type EditVehicleData = {
  id: string
  year: number
  mileage: number
  color: string
  price: number
  description: string | null
  status: string
  brandName: string
  modelName: string
  trimName: string
}

export function VehicleTable({ vehicles, userRole, basePath }: VehicleTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [editSheet, setEditSheet] = useState<{ open: boolean; vehicle: EditVehicleData | null }>({
    open: false,
    vehicle: null,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; vehicleId: string }>({
    open: false,
    vehicleId: '',
  })

  const filteredVehicles =
    statusFilter === 'ALL'
      ? vehicles
      : vehicles.filter((v) => v.status === statusFilter)

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedVehicles = filteredVehicles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Hide HIDDEN tab for dealers
  const tabs = userRole === 'ADMIN' ? STATUS_TABS : STATUS_TABS.filter((t) => t.value !== 'HIDDEN')

  const handleFilterChange = (value: VehicleStatus | 'ALL') => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleDeleteClick = useCallback(
    (vehicleId: string) => {
      setDeleteConfirm({ open: true, vehicleId })
    },
    []
  )

  const executeDelete = useCallback(
    () => {
      const vehicleId = deleteConfirm.vehicleId
      startTransition(async () => {
        try {
          if (userRole === 'ADMIN') {
            await deleteAdminVehiclesId(vehicleId)
          } else {
            await deleteVehicleApi(vehicleId)
          }
          toast.success('차량이 삭제되었습니다.')
          router.refresh()
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
        }
      })
    },
    [deleteConfirm.vehicleId, router, userRole]
  )

  const handleStatusChanged = useCallback(() => {
    router.refresh()
  }, [router])

  const handleResubmit = useCallback(
    (vehicleId: string) => {
      startTransition(async () => {
        try {
          await resubmitVehicleApi(vehicleId)
          router.refresh()
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : '재심사 요청에 실패했습니다.')
        }
      })
    },
    [router]
  )

  const handleRowClick = useCallback(
    (vehicle: VehicleWithDetails) => {
      if (userRole === 'ADMIN') {
        const brandName = vehicle.trim.generation.carModel.brand.nameKo
          || vehicle.trim.generation.carModel.brand.name
        const modelName = vehicle.trim.generation.carModel.nameKo
          || vehicle.trim.generation.carModel.name
        const trimName = vehicle.trim.name

        setEditSheet({
          open: true,
          vehicle: {
            id: vehicle.id,
            year: vehicle.year,
            mileage: vehicle.mileage,
            color: vehicle.color,
            price: vehicle.price,
            description: vehicle.description,
            status: vehicle.status,
            brandName,
            modelName,
            trimName,
          },
        })
      } else {
        router.push(`${basePath}/${vehicle.id}/edit`)
      }
    },
    [userRole, router, basePath]
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
            onClick={() => handleFilterChange(tab.value)}
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
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">차량</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">연식</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">주행거리</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">가격</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">상태</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">승인</TableHead>
                  {userRole === 'ADMIN' && (
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">딜러</TableHead>
                  )}
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedVehicles.map((vehicle) => {
                  const brandName = vehicle.trim.generation.carModel.brand.nameKo
                    || vehicle.trim.generation.carModel.brand.name
                  const modelName = vehicle.trim.generation.carModel.nameKo
                    || vehicle.trim.generation.carModel.name
                  const trimName = vehicle.trim.name

                  return (
                    <TableRow
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(vehicle)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {vehicle.images[0] ? (
                            <Image
                              src={vehicle.images[0].url}
                              alt={`${brandName} ${modelName}`}
                              width={48}
                              height={48}
                              className="size-12 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
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
                            onClick={() => handleRowClick(vehicle)}
                            aria-label="수정"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteClick(vehicle.id)}
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {filteredVehicles.length}대 중 {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredVehicles.length)}대 표시
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="이전 페이지"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[5rem] text-center text-xs text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="다음 페이지"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Vehicle Edit Sheet */}
      {userRole === 'ADMIN' && (
        <VehicleEditSheet
          vehicle={editSheet.vehicle}
          open={editSheet.open}
          onOpenChange={(open) => setEditSheet((prev) => ({ ...prev, open }))}
          onSuccess={() => router.refresh()}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm({ open: false, vehicleId: '' })
        }}
        title="차량 숨김 처리"
        description="이 차량을 숨김 처리하시겠습니까?"
        confirmLabel="숨김 처리"
        onConfirm={executeDelete}
      />
    </div>
  )
}
