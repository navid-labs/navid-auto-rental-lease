'use client'

import { useState, useEffect, useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { searchParamsParsers } from '../lib/search-params'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
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
const MAX_MILEAGE = 200_000

const VEHICLE_TYPES = ['전체', '세단', 'SUV', 'MPV', '쿠페', '해치백', '트럭']

/** Collapsible section wrapper */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-[#E4E4E7]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-[#0D0D0D]"
      >
        {title}
        <ChevronDown
          className={`size-4 text-[#71717A] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

/** Range input pair */
function RangeInputs({
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: {
  minValue: string
  maxValue: string
  minPlaceholder: string
  maxPlaceholder: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={minValue}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder={minPlaceholder}
        className="h-9 w-full rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#0D0D0D] placeholder:text-[#71717A] focus:border-[#1A6DFF] focus:outline-none"
      />
      <span className="shrink-0 text-sm text-[#71717A]">~</span>
      <input
        type="number"
        value={maxValue}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder={maxPlaceholder}
        className="h-9 w-full rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#0D0D0D] placeholder:text-[#71717A] focus:border-[#1A6DFF] focus:outline-none"
      />
    </div>
  )
}

function FilterContent() {
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  })

  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [generations, setGenerations] = useState<GenerationOption[]>([])

  // Local state for range inputs (to allow typing without triggering on each keystroke)
  const [priceMinInput, setPriceMinInput] = useState(filters.priceMin?.toString() ?? '')
  const [priceMaxInput, setPriceMaxInput] = useState(filters.priceMax?.toString() ?? '')
  const [yearMinInput, setYearMinInput] = useState(filters.yearMin?.toString() ?? '')
  const [yearMaxInput, setYearMaxInput] = useState(filters.yearMax?.toString() ?? '')
  const [mileMinInput, setMileMinInput] = useState(filters.mileMin?.toString() ?? '')
  const [mileMaxInput, setMileMaxInput] = useState(filters.mileMax?.toString() ?? '')

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

  const visibleModels = filters.brand ? models : []
  const visibleGenerations = filters.model ? generations : []

  const handleReset = () => {
    setPriceMinInput('')
    setPriceMaxInput('')
    setYearMinInput('')
    setYearMaxInput('')
    setMileMinInput('')
    setMileMaxInput('')
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

  const applyRangeFilter = (
    key: 'priceMin' | 'priceMax' | 'yearMin' | 'yearMax' | 'mileMin' | 'mileMax',
    value: string
  ) => {
    const parsed = parseInt(value, 10)
    setFilters({ [key]: isNaN(parsed) ? null : parsed, page: 1 })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <span className="font-bold text-[#0D0D0D]">필터</span>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-[#1A6DFF] hover:underline"
        >
          초기화
        </button>
      </div>

      {/* 차종 */}
      <FilterSection title="차종">
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                type === '전체'
                  ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                  : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 제조사/모델 */}
      <FilterSection title="제조사/모델" defaultOpen={false}>
        <div className="space-y-3">
          {/* Brand pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilters({ brand: '', model: '', gen: '', page: 1 })}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                !filters.brand
                  ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                  : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
              }`}
            >
              전체
            </button>
            {isPending && brands.length === 0 ? (
              <span className="text-sm text-[#71717A]">로딩중...</span>
            ) : (
              brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setFilters({ brand: b.id, model: '', gen: '', page: 1 })}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    filters.brand === b.id
                      ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                      : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
                  }`}
                >
                  {b.nameKo || b.name}
                </button>
              ))
            )}
          </div>

          {/* Model pills */}
          {visibleModels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilters({ model: '', gen: '', page: 1 })}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  !filters.model
                    ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                    : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
                }`}
              >
                전체
              </button>
              {visibleModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFilters({ model: m.id, gen: '', page: 1 })}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    filters.model === m.id
                      ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                      : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
                  }`}
                >
                  {m.nameKo || m.name}
                </button>
              ))}
            </div>
          )}

          {/* Generation pills */}
          {visibleGenerations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleGenerations.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFilters({ gen: g.id, page: 1 })}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    filters.gen === g.id
                      ? 'border-[#1A6DFF] bg-[#1A6DFF] text-white'
                      : 'border-[#E4E4E7] bg-white text-[#0D0D0D] hover:border-[#1A6DFF] hover:text-[#1A6DFF]'
                  }`}
                >
                  {g.name} ({g.startYear}~{g.endYear ?? '현재'})
                </button>
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* 가격 */}
      <FilterSection title="가격" defaultOpen={false}>
        <RangeInputs
          minValue={priceMinInput}
          maxValue={priceMaxInput}
          minPlaceholder="최소"
          maxPlaceholder="최대"
          onMinChange={(v) => {
            setPriceMinInput(v)
            applyRangeFilter('priceMin', v)
          }}
          onMaxChange={(v) => {
            setPriceMaxInput(v)
            applyRangeFilter('priceMax', v)
          }}
        />
        {(filters.priceMin || filters.priceMax) && (
          <p className="mt-2 text-xs text-[#71717A]">
            {formatKRW(filters.priceMin ?? 0)} ~{' '}
            {filters.priceMax ? formatKRW(filters.priceMax) : `${formatKRW(MAX_PRICE)} 이상`}
          </p>
        )}
      </FilterSection>

      {/* 연식 */}
      <FilterSection title="연식" defaultOpen={false}>
        <RangeInputs
          minValue={yearMinInput}
          maxValue={yearMaxInput}
          minPlaceholder={`${MIN_YEAR}`}
          maxPlaceholder={`${MAX_YEAR}`}
          onMinChange={(v) => {
            setYearMinInput(v)
            applyRangeFilter('yearMin', v)
          }}
          onMaxChange={(v) => {
            setYearMaxInput(v)
            applyRangeFilter('yearMax', v)
          }}
        />
        {(filters.yearMin || filters.yearMax) && (
          <p className="mt-2 text-xs text-[#71717A]">
            {filters.yearMin ?? MIN_YEAR}년 ~ {filters.yearMax ?? MAX_YEAR}년
          </p>
        )}
      </FilterSection>

      {/* 주행거리 */}
      <FilterSection title="주행거리" defaultOpen={false}>
        <RangeInputs
          minValue={mileMinInput}
          maxValue={mileMaxInput}
          minPlaceholder="0"
          maxPlaceholder={`${MAX_MILEAGE}`}
          onMinChange={(v) => {
            setMileMinInput(v)
            applyRangeFilter('mileMin', v)
          }}
          onMaxChange={(v) => {
            setMileMaxInput(v)
            applyRangeFilter('mileMax', v)
          }}
        />
        {(filters.mileMin || filters.mileMax) && (
          <p className="mt-2 text-xs text-[#71717A]">
            {formatDistance(filters.mileMin ?? 0)} ~{' '}
            {filters.mileMax
              ? formatDistance(filters.mileMax)
              : `${formatDistance(MAX_MILEAGE)} 이상`}
          </p>
        )}
      </FilterSection>
    </div>
  )
}

export function SearchFilters() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-20 rounded-xl border border-[#E4E4E7] bg-white px-4">
          <FilterContent />
        </div>
      </aside>

      {/* Mobile filter button + sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm font-medium text-[#0D0D0D]"
              />
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
