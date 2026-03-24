'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putPricingResidualRates } from '@/lib/api/generated/pricing/pricing'
import { ApiError } from '@/lib/api/fetcher'
import { listModelsByBrand } from '@/lib/api/generated/vehicles/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'

type Brand = { id: string; name: string }
type Model = { id: string; name: string; nameKo: string | null }

/** Form schema: rate as percentage (1-99) for UX, converted to decimal on submit */
const formSchema = z.object({
  brandId: z.string().min(1, '브랜드를 선택해주세요.'),
  carModelId: z.string().min(1, '모델을 선택해주세요.'),
  year: z.coerce
    .number()
    .int()
    .min(2010, '2010년 이후만 입력 가능합니다.')
    .max(2030, '2030년 이전만 입력 가능합니다.'),
  ratePercent: z.coerce
    .number()
    .min(1, '잔가율은 1% 이상이어야 합니다.')
    .max(99, '잔가율은 99% 이하여야 합니다.'),
})

type FormValues = z.infer<typeof formSchema>

type ResidualValueFormProps = {
  brands: Brand[]
}

export function ResidualValueForm({ brands }: ResidualValueFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [models, setModels] = useState<Model[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      brandId: '',
      carModelId: '',
      year: new Date().getFullYear(),
      ratePercent: 40,
    },
  })

  const selectedBrandId = useWatch({ control, name: 'brandId' })

  // Load models when brand changes — triggered by select onChange
  const handleBrandChange = useCallback(
    async (brandId: string) => {
      setValue('carModelId', '')
      if (!brandId) {
        setModels([])
        return
      }
      setLoadingModels(true)
      try {
        const response = await listModelsByBrand(brandId)
        setModels(response.data.data.map((m) => ({ id: m.id, name: m.name, nameKo: m.nameKo ?? null })))
      } finally {
        setLoadingModels(false)
      }
    },
    [setValue]
  )

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await putPricingResidualRates({
          brandId: data.brandId,
          carModelId: data.carModelId,
          year: data.year,
          rate: data.ratePercent / 100,
        })
        reset()
        setModels([])
        router.refresh()
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 잔존가치율 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="rv-brand">브랜드</Label>
            <select
              id="rv-brand"
              {...register('brandId', {
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleBrandChange(e.target.value),
              })}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">선택</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="text-xs text-destructive">{errors.brandId.message}</p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <Label htmlFor="rv-model">모델</Label>
            <select
              id="rv-model"
              {...register('carModelId')}
              disabled={!selectedBrandId || loadingModels}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <option value="">{loadingModels ? '로딩...' : '선택'}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameKo || m.name}
                </option>
              ))}
            </select>
            {errors.carModelId && (
              <p className="text-xs text-destructive">{errors.carModelId.message}</p>
            )}
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <Label htmlFor="rv-year">연식</Label>
            <Input
              id="rv-year"
              type="number"
              {...register('year')}
              min={2010}
              max={2030}
            />
            {errors.year && (
              <p className="text-xs text-destructive">{errors.year.message}</p>
            )}
          </div>

          {/* Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="rv-rate">잔존가치율(%)</Label>
            <Input
              id="rv-rate"
              type="number"
              {...register('ratePercent')}
              min={1}
              max={99}
              step={0.1}
            />
            {errors.ratePercent && (
              <p className="text-xs text-destructive">{errors.ratePercent.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}
              추가
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
