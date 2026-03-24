'use client'

import { useState, useTransition, useEffect, useCallback, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  listBrands,
  listModelsByBrand,
  listGenerationsByModel,
  listTrimsByGeneration,
} from '@/lib/api/generated/vehicles/vehicles'
import type { Brand, CarModel, Generation, Trim } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'

type CascadeSelectProps = {
  value: {
    brandId: string
    modelId: string
    generationId: string
    trimId: string
  }
  onChange: (field: string, value: string) => void
}

export function CascadeSelect({ value, onChange }: CascadeSelectProps) {
  const [isPending, startTransition] = useTransition()
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [trims, setTrims] = useState<Trim[]>([])

  // Track which parent IDs data was loaded for
  const [loadedBrandId, setLoadedBrandId] = useState('')
  const [loadedModelId, setLoadedModelId] = useState('')
  const [loadedGenerationId, setLoadedGenerationId] = useState('')

  // Load brands on mount
  useEffect(() => {
    startTransition(async () => {
      const response = await listBrands()
      setBrands(response.data.data ?? [])
    })
  }, [])

  // Load models when brand changes
  useEffect(() => {
    if (!value.brandId) return
    if (value.brandId === loadedBrandId) return
    startTransition(async () => {
      const response = await listModelsByBrand(value.brandId)
      setModels(response.data.data ?? [])
      setLoadedBrandId(value.brandId)
    })
  }, [value.brandId, loadedBrandId])

  // Load generations when model changes
  useEffect(() => {
    if (!value.modelId) return
    if (value.modelId === loadedModelId) return
    startTransition(async () => {
      const response = await listGenerationsByModel(value.modelId)
      setGenerations(response.data.data ?? [])
      setLoadedModelId(value.modelId)
    })
  }, [value.modelId, loadedModelId])

  // Load trims when generation changes
  useEffect(() => {
    if (!value.generationId) return
    if (value.generationId === loadedGenerationId) return
    startTransition(async () => {
      const response = await listTrimsByGeneration(value.generationId)
      setTrims(response.data.data ?? [])
      setLoadedGenerationId(value.generationId)
    })
  }, [value.generationId, loadedGenerationId])

  // Derive visible options based on current selections
  const visibleModels = useMemo(
    () => (value.brandId ? models : []),
    [value.brandId, models]
  )
  const visibleGenerations = useMemo(
    () => (value.modelId ? generations : []),
    [value.modelId, generations]
  )
  const visibleTrims = useMemo(
    () => (value.generationId ? trims : []),
    [value.generationId, trims]
  )

  const handleBrandChange = useCallback(
    (brandId: string | null) => {
      onChange('brandId', brandId ?? '')
      onChange('modelId', '')
      onChange('generationId', '')
      onChange('trimId', '')
    },
    [onChange]
  )

  const handleModelChange = useCallback(
    (modelId: string | null) => {
      onChange('modelId', modelId ?? '')
      onChange('generationId', '')
      onChange('trimId', '')
    },
    [onChange]
  )

  const handleGenerationChange = useCallback(
    (generationId: string | null) => {
      onChange('generationId', generationId ?? '')
      onChange('trimId', '')
    },
    [onChange]
  )

  const handleTrimChange = useCallback(
    (trimId: string | null) => {
      onChange('trimId', trimId ?? '')
    },
    [onChange]
  )

  return (
    <div className="grid gap-4">
      {/* Brand */}
      <div className="grid gap-2">
        <Label>브랜드</Label>
        <Select value={value.brandId} onValueChange={handleBrandChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="브랜드 선택" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nameKo || b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      {value.brandId && (
        <div className="grid gap-2">
          <Label>모델</Label>
          <Select value={value.modelId} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isPending ? '로딩...' : '모델 선택'} />
            </SelectTrigger>
            <SelectContent>
              {visibleModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nameKo || m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Generation */}
      {value.modelId && (
        <div className="grid gap-2">
          <Label>세대</Label>
          <Select value={value.generationId} onValueChange={handleGenerationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isPending ? '로딩...' : '세대 선택'} />
            </SelectTrigger>
            <SelectContent>
              {visibleGenerations.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} ({g.startYear}~{g.endYear ?? '현재'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Trim */}
      {value.generationId && (
        <div className="grid gap-2">
          <Label>트림</Label>
          <Select value={value.trimId} onValueChange={handleTrimChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isPending ? '로딩...' : '트림 선택'} />
            </SelectTrigger>
            <SelectContent>
              {visibleTrims.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.fuelType}, {t.transmission})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
