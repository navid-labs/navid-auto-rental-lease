'use client'

import { useTransition } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { updateVehicleAdmin, type UpdateVehicleData } from '@/features/admin/actions/update-vehicle-admin'
import { Loader2 } from 'lucide-react'

const vehicleEditSchema = z.object({
  year: z.coerce.number().int().min(2000, '2000년 이후').max(2026, '2026년 이하'),
  mileage: z.coerce.number().int().min(0, '0 이상'),
  color: z.string().min(1, '색상을 입력해주세요.'),
  price: z.coerce.number().int().min(0, '0 이상'),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'LEASED', 'MAINTENANCE']),
})

type VehicleEditFormData = z.infer<typeof vehicleEditSchema>

type VehicleEditData = {
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

type VehicleEditSheetProps = {
  vehicle: VehicleEditData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '판매 가능' },
  { value: 'RESERVED', label: '예약됨' },
  { value: 'RENTED', label: '렌탈 중' },
  { value: 'LEASED', label: '리스 중' },
  { value: 'MAINTENANCE', label: '정비 중' },
] as const

export function VehicleEditSheet({ vehicle, open, onOpenChange, onSuccess }: VehicleEditSheetProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VehicleEditFormData>({
    resolver: zodResolver(vehicleEditSchema) as Resolver<VehicleEditFormData>,
    values: vehicle
      ? {
          year: vehicle.year,
          mileage: vehicle.mileage,
          color: vehicle.color,
          price: vehicle.price,
          description: vehicle.description ?? '',
          status: vehicle.status as VehicleEditFormData['status'],
        }
      : undefined,
  })

  function onSubmit(data: VehicleEditFormData) {
    if (!vehicle) return

    startTransition(async () => {
      const result = await updateVehicleAdmin(vehicle.id, data as UpdateVehicleData)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('차량 정보가 수정되었습니다.')
      onOpenChange(false)
      reset()
      onSuccess?.()
    })
  }

  if (!vehicle) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>차량 정보 수정</SheetTitle>
          <SheetDescription>
            {vehicle.brandName} {vehicle.modelName} {vehicle.trimName}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4">
          {/* Year */}
          <div className="space-y-1">
            <label htmlFor="year" className="text-sm font-medium">연식</label>
            <input
              id="year"
              type="number"
              {...register('year')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
          </div>

          {/* Mileage */}
          <div className="space-y-1">
            <label htmlFor="mileage" className="text-sm font-medium">주행거리 (km)</label>
            <input
              id="mileage"
              type="number"
              {...register('mileage')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.mileage && <p className="text-xs text-destructive">{errors.mileage.message}</p>}
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label htmlFor="color" className="text-sm font-medium">색상</label>
            <input
              id="color"
              type="text"
              {...register('color')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label htmlFor="price" className="text-sm font-medium">가격 (만원)</label>
            <input
              id="price"
              type="number"
              {...register('price')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium">상태</label>
            <select
              id="status"
              {...register('status')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">설명</label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="차량 설명을 입력해주세요..."
            />
          </div>

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              저장
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
