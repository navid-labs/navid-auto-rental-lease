'use client'

import { useState, useEffect, useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { searchParamsParsers } from '../lib/search-params'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import {
  getBrands,
  getModelsByBrand,
  getGenerationsByModel,
} from '@/features/vehicles/actions/get-cascade-data'
import { formatKRW, formatDistance } from '@/lib/utils/format'

type BrandOption = { id: string; name: string; nameKo: string | null; logoUrl: string | null }
type ModelOption = { id: string; name: string; nameKo: string | null }
type GenerationOption = { id: string; name: string; startYear: number; endYear: number | null }

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = CURRENT_YEAR - 15
const MAX_YEAR = CURRENT_YEAR + 1
const MAX_PRICE = 2_000_000
const PRICE_STEP = 50_000
const MAX_MILEAGE = 200_000
const MILEAGE_STEP = 10_000

function FilterContent() {
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  })

  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [generations, setGenerations] = useState<GenerationOption[]>([])

  // Load brands on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await getBrands()
      setBrands(data)
    })
  }, [])

  // Load models when brand changes
  useEffect(() => {
    if (!filters.brand) return
    startTransition(async () => {
      const data = await getModelsByBrand(filters.brand)
      setModels(data)
    })
  }, [filters.brand])

  // Load generations when model changes
  useEffect(() => {
    if (!filters.model) return
    startTransition(async () => {
      const data = await getGenerationsByModel(filters.model)
      setGenerations(data)
    })
  }, [filters.model])

  // Derive visible options from filter state
  const visibleModels = filters.brand ? models : []
  const visibleGenerations = filters.model ? generations : []

  const handleBrandChange = (value: string | null) => {
    setFilters({
      brand: value ?? '',
      model: '',
      gen: '',
      page: 1,
    })
  }

  const handleModelChange = (value: string | null) => {
    setFilters({
      model: value ?? '',
      gen: '',
      page: 1,
    })
  }

  const handleGenerationChange = (value: string | null) => {
    setFilters({
      gen: value ?? '',
      page: 1,
    })
  }

  const handleReset = () => {
    setFilters({
      brand: '',
      model: '',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
      sort: 'newest',
      page: 1,
    })
  }

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="space-y-2">
        <Label>브랜드</Label>
        <Select value={filters.brand || undefined} onValueChange={handleBrandChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isPending ? '로딩...' : '전체 브랜드'} />
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
      {filters.brand && (
        <div className="space-y-2">
          <Label>모델</Label>
          <Select value={filters.model || undefined} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isPending ? '로딩...' : '전체 모델'} />
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
      {filters.model && (
        <div className="space-y-2">
          <Label>세대</Label>
          <Select value={filters.gen || undefined} onValueChange={handleGenerationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isPending ? '로딩...' : '전체 세대'} />
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

      {/* Price Range */}
      <div className="space-y-3">
        <Label>월 렌탈료</Label>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatKRW(filters.priceMin ?? 0)}</span>
          <span>{formatKRW(filters.priceMax ?? MAX_PRICE)}</span>
        </div>
        <Slider
          min={0}
          max={MAX_PRICE}
          step={PRICE_STEP}
          value={[filters.priceMin ?? 0, filters.priceMax ?? MAX_PRICE]}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value : [value]
            setFilters({
              priceMin: v[0] === 0 ? null : v[0],
              priceMax: v[1] === MAX_PRICE ? null : v[1],
              page: 1,
            })
          }}
        />
      </div>

      {/* Year Range */}
      <div className="space-y-3">
        <Label>연식</Label>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{filters.yearMin ?? MIN_YEAR}년</span>
          <span>{filters.yearMax ?? MAX_YEAR}년</span>
        </div>
        <Slider
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={[filters.yearMin ?? MIN_YEAR, filters.yearMax ?? MAX_YEAR]}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value : [value]
            setFilters({
              yearMin: v[0] === MIN_YEAR ? null : v[0],
              yearMax: v[1] === MAX_YEAR ? null : v[1],
              page: 1,
            })
          }}
        />
      </div>

      {/* Mileage Range */}
      <div className="space-y-3">
        <Label>주행거리</Label>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDistance(filters.mileMin ?? 0)}</span>
          <span>{formatDistance(filters.mileMax ?? MAX_MILEAGE)}</span>
        </div>
        <Slider
          min={0}
          max={MAX_MILEAGE}
          step={MILEAGE_STEP}
          value={[filters.mileMin ?? 0, filters.mileMax ?? MAX_MILEAGE]}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value : [value]
            setFilters({
              mileMin: v[0] === 0 ? null : v[0],
              mileMax: v[1] === MAX_MILEAGE ? null : v[1],
              page: 1,
            })
          }}
        />
      </div>

      {/* Reset */}
      <Button variant="outline" className="w-full" onClick={handleReset}>
        필터 초기화
      </Button>
    </div>
  )
}

export function SearchFilters() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-20 space-y-6 rounded-lg border bg-background p-4">
          <h2 className="font-semibold">필터</h2>
          <FilterContent />
        </div>
      </aside>

      {/* Mobile filter button + sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" />
            }
          >
            <SlidersHorizontal className="size-4" />
            필터
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
