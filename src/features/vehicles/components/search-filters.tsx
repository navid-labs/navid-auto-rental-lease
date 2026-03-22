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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import {
  getBrands,
  getModelsByBrand,
  getGenerationsByModel,
} from '@/features/vehicles/actions/get-cascade-data'
import { DualRangeSlider } from './dual-range-slider'
import { ColorFilter } from './color-filter'
import { BODY_TYPE_LABELS } from '../lib/vehicle-body-type'

type BrandOption = { id: string; name: string; nameKo: string | null; logoUrl: string | null }
type ModelOption = { id: string; name: string; nameKo: string | null }
type GenerationOption = { id: string; name: string; startYear: number; endYear: number | null }

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = CURRENT_YEAR - 15
const MAX_YEAR = CURRENT_YEAR + 1
const MAX_PRICE = 20_000
const MAX_MONTHLY = 2_000_000
const MAX_MILEAGE = 200_000

const VEHICLE_TYPES = ['전체', '세단', 'SUV', 'MPV', '쿠페', '해치백', '트럭']

const fuelOptions = [
  { value: 'GASOLINE', label: '가솔린' },
  { value: 'DIESEL', label: '디젤' },
  { value: 'LPG', label: 'LPG' },
  { value: 'HYBRID', label: '하이브리드' },
  { value: 'ELECTRIC', label: '전기' },
  { value: 'HYDROGEN', label: '수소' },
]

const transmissionOptions = [
  { value: 'AUTOMATIC', label: '자동' },
  { value: 'MANUAL', label: '수동' },
  { value: 'CVT', label: 'CVT' },
  { value: 'DCT', label: 'DCT' },
]

const driveOptions = [
  { value: 'FWD', label: '전륜' },
  { value: 'RWD', label: '후륜' },
  { value: 'AWD', label: '4륜' },
  { value: '4WD', label: '사륜' },
]

const optionsList = [
  { value: 'sunroof', label: '선루프' },
  { value: 'navigation', label: '내비게이션' },
  { value: 'rearCamera', label: '후방카메라' },
  { value: 'heatedSeat', label: '열선시트' },
  { value: 'ventilatedSeat', label: '통풍시트' },
  { value: 'smartKey', label: '스마트키' },
  { value: 'cruiseControl', label: '크루즈 컨트롤' },
  { value: 'dashCam', label: '블랙박스' },
]

const salesOptions = [
  { value: 'rental', label: '렌탈' },
  { value: 'lease', label: '리스' },
  { value: 'general', label: '일반매매' },
]

const SEAT_OPTIONS = ['전체', '2', '4', '5', '7', '9']

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

const KEYWORD_OPTIONS = ['무사고', '1인소유', '완전무사고', '신차급']

// Shared multi-value toggle helper for comma-separated URL params
function toggleMultiValue(current: string, value: string): string {
  const values = current ? current.split(',') : []
  const idx = values.indexOf(value)
  if (idx >= 0) {
    values.splice(idx, 1)
  } else {
    values.push(value)
  }
  return values.join(',')
}

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
    <div className="border-t border-border-light">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground"
      >
        {title}
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

/** Pill button (active/inactive) */
function PillButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-card text-foreground hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  )
}

/** Checkbox group for multi-select filters */
function CheckboxGroup({
  options,
  currentValue,
  onChange,
}: {
  options: { value: string; label: string }[]
  currentValue: string
  onChange: (newValue: string) => void
}) {
  const selected = currentValue ? currentValue.split(',') : []

  return (
    <div className="space-y-1">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer">
          <Checkbox
            className="size-4 rounded border-border"
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onChange(toggleMultiValue(currentValue, opt.value))}
          />
          <span className="text-sm text-foreground">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

export function FilterContent({ totalCount }: { totalCount?: number }) {
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

  const visibleModels = filters.brand ? models : []
  const visibleGenerations = filters.model ? generations : []

  const handleReset = () => {
    setFilters({
      brand: '',
      model: '',
      gen: '',
      vehicleType: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
      monthlyMin: null,
      monthlyMax: null,
      fuel: '',
      transmission: '',
      color: '',
      seats: null,
      driveType: '',
      options: '',
      region: '',
      salesType: '',
      keyword: '',
      homeService: '',
      timeDeal: '',
      noAccident: '',
      hasRental: '',
      sort: 'recommended',
      page: 1,
    })
  }

  const handleColorToggle = (colorValue: string) => {
    const newValue = toggleMultiValue(filters.color, colorValue)
    setFilters({ color: newValue, page: 1 })
  }

  // Count active filters for mobile badge
  const activeFilterCount = [
    filters.brand,
    filters.model,
    filters.gen,
    filters.vehicleType,
    filters.priceMin != null,
    filters.priceMax != null,
    filters.monthlyMin != null,
    filters.monthlyMax != null,
    filters.yearMin != null,
    filters.yearMax != null,
    filters.mileMin != null,
    filters.mileMax != null,
    filters.fuel,
    filters.transmission,
    filters.color,
    filters.seats != null,
    filters.driveType,
    filters.options,
    filters.region,
    filters.salesType,
    filters.keyword,
    filters.homeService,
    filters.timeDeal,
    filters.noAccident,
    filters.hasRental,
  ].filter(Boolean).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <span className="font-bold text-foreground">필터</span>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-accent hover:underline"
        >
          초기화
        </button>
      </div>

      {/* 1. 차종 */}
      <FilterSection title="차종">
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map((type) => {
            const isAll = type === '전체'
            const bodyTypeValue = isAll ? '' : (BODY_TYPE_LABELS[type] ?? '')
            const active = isAll
              ? !filters.vehicleType
              : filters.vehicleType === bodyTypeValue

            return (
              <PillButton
                key={type}
                label={type}
                active={active}
                onClick={() =>
                  setFilters({
                    vehicleType: isAll ? '' : bodyTypeValue,
                    page: 1,
                  })
                }
              />
            )
          })}
        </div>
      </FilterSection>

      {/* 2. 제조사/모델 */}
      <FilterSection title="제조사/모델" defaultOpen={false}>
        <div className="space-y-3">
          {/* Brand pills */}
          <div className="flex flex-wrap gap-2">
            <PillButton
              label="전체"
              active={!filters.brand}
              onClick={() => setFilters({ brand: '', model: '', gen: '', page: 1 })}
            />
            {isPending && brands.length === 0 ? (
              <span className="text-sm text-muted-foreground">로딩중...</span>
            ) : (
              brands.map((b) => (
                <PillButton
                  key={b.id}
                  label={b.nameKo || b.name}
                  active={filters.brand === b.id}
                  onClick={() => setFilters({ brand: b.id, model: '', gen: '', page: 1 })}
                />
              ))
            )}
          </div>

          {/* Model pills */}
          {visibleModels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <PillButton
                label="전체"
                active={!filters.model}
                onClick={() => setFilters({ model: '', gen: '', page: 1 })}
              />
              {visibleModels.map((m) => (
                <PillButton
                  key={m.id}
                  label={m.nameKo || m.name}
                  active={filters.model === m.id}
                  onClick={() => setFilters({ model: m.id, gen: '', page: 1 })}
                />
              ))}
            </div>
          )}

          {/* Generation pills */}
          {visibleGenerations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleGenerations.map((g) => (
                <PillButton
                  key={g.id}
                  label={`${g.name} (${g.startYear}~${g.endYear ?? '현재'})`}
                  active={filters.gen === g.id}
                  onClick={() => setFilters({ gen: g.id, page: 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* 3. 가격 */}
      <FilterSection title="가격" defaultOpen={false}>
        <DualRangeSlider
          min={0}
          max={MAX_PRICE}
          step={100}
          value={[filters.priceMin ?? 0, filters.priceMax ?? MAX_PRICE]}
          onValueCommit={([min, max]) =>
            setFilters({
              priceMin: min === 0 ? null : min,
              priceMax: max === MAX_PRICE ? null : max,
              page: 1,
            })
          }
          formatLabel={(v) => `${v.toLocaleString()}만원`}
        />
      </FilterSection>

      {/* 4. 월 납입금 */}
      <FilterSection title="월 납입금" defaultOpen={false}>
        <DualRangeSlider
          min={0}
          max={MAX_MONTHLY}
          step={10000}
          value={[filters.monthlyMin ?? 0, filters.monthlyMax ?? MAX_MONTHLY]}
          onValueCommit={([min, max]) =>
            setFilters({
              monthlyMin: min === 0 ? null : min,
              monthlyMax: max === MAX_MONTHLY ? null : max,
              page: 1,
            })
          }
          formatLabel={(v) => `${v.toLocaleString()}원`}
        />
      </FilterSection>

      {/* 5. 연식 */}
      <FilterSection title="연식" defaultOpen={false}>
        <DualRangeSlider
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={[filters.yearMin ?? MIN_YEAR, filters.yearMax ?? MAX_YEAR]}
          onValueCommit={([min, max]) =>
            setFilters({
              yearMin: min === MIN_YEAR ? null : min,
              yearMax: max === MAX_YEAR ? null : max,
              page: 1,
            })
          }
          formatLabel={(v) => `${v}년`}
        />
      </FilterSection>

      {/* 6. 주행거리 */}
      <FilterSection title="주행거리" defaultOpen={false}>
        <DualRangeSlider
          min={0}
          max={MAX_MILEAGE}
          step={1000}
          value={[filters.mileMin ?? 0, filters.mileMax ?? MAX_MILEAGE]}
          onValueCommit={([min, max]) =>
            setFilters({
              mileMin: min === 0 ? null : min,
              mileMax: max === MAX_MILEAGE ? null : max,
              page: 1,
            })
          }
          formatLabel={(v) => `${v.toLocaleString()}km`}
        />
      </FilterSection>

      {/* 7. 연료 */}
      <FilterSection title="연료" defaultOpen={false}>
        <CheckboxGroup
          options={fuelOptions}
          currentValue={filters.fuel}
          onChange={(newValue) => setFilters({ fuel: newValue, page: 1 })}
        />
      </FilterSection>

      {/* 8. 변속기 */}
      <FilterSection title="변속기" defaultOpen={false}>
        <CheckboxGroup
          options={transmissionOptions}
          currentValue={filters.transmission}
          onChange={(newValue) => setFilters({ transmission: newValue, page: 1 })}
        />
      </FilterSection>

      {/* 9. 색상 */}
      <FilterSection title="색상" defaultOpen={false}>
        <ColorFilter
          selectedColors={filters.color ? filters.color.split(',') : []}
          onToggle={handleColorToggle}
        />
      </FilterSection>

      {/* 10. 인승 */}
      <FilterSection title="인승" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((seat) => {
            const isAll = seat === '전체'
            const seatNum = isAll ? null : parseInt(seat, 10)
            const active = isAll ? filters.seats == null : filters.seats === seatNum

            return (
              <PillButton
                key={seat}
                label={isAll ? seat : `${seat}인승`}
                active={active}
                onClick={() => setFilters({ seats: seatNum, page: 1 })}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* 11. 구동방식 */}
      <FilterSection title="구동방식" defaultOpen={false}>
        <CheckboxGroup
          options={driveOptions}
          currentValue={filters.driveType}
          onChange={(newValue) => setFilters({ driveType: newValue, page: 1 })}
        />
      </FilterSection>

      {/* 12. 옵션 */}
      <FilterSection title="옵션" defaultOpen={false}>
        <CheckboxGroup
          options={optionsList}
          currentValue={filters.options}
          onChange={(newValue) => setFilters({ options: newValue, page: 1 })}
        />
      </FilterSection>

      {/* 13. 지역 */}
      <FilterSection title="지역" defaultOpen={false}>
        <Select
          value={filters.region || '전체'}
          onValueChange={(value) =>
            setFilters({ region: value === '전체' ? '' : (value as string), page: 1 })
          }
        >
          <SelectTrigger className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* 14. 판매구분 */}
      <FilterSection title="판매구분" defaultOpen={false}>
        <CheckboxGroup
          options={salesOptions}
          currentValue={filters.salesType}
          onChange={(newValue) => setFilters({ salesType: newValue, page: 1 })}
        />
      </FilterSection>

      {/* 15. 키워드 */}
      <FilterSection title="키워드" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {KEYWORD_OPTIONS.map((kw) => {
            const keywords = filters.keyword ? filters.keyword.split(',') : []
            const active = keywords.includes(kw)

            return (
              <PillButton
                key={kw}
                label={kw}
                active={active}
                onClick={() =>
                  setFilters({ keyword: toggleMultiValue(filters.keyword, kw), page: 1 })
                }
              />
            )
          })}
        </div>
      </FilterSection>

      {/* Mobile apply button (only rendered inside Sheet) */}
      {totalCount !== undefined && (
        <div className="sticky bottom-0 left-0 right-0 flex gap-3 border-t border-border bg-card p-4 -mx-4 mt-4">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            초기화
          </Button>
          <Button variant="default" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            차량 {totalCount.toLocaleString()}대 보기
          </Button>
        </div>
      )}
    </div>
  )
}

type SearchFiltersProps = {
  totalCount?: number
}

export function SearchFilters({ totalCount }: SearchFiltersProps = {}) {
  const [filters] = useQueryStates(searchParamsParsers, { shallow: false })

  // Count active filters for mobile badge
  const activeFilterCount = [
    filters.brand,
    filters.model,
    filters.gen,
    filters.vehicleType,
    filters.priceMin != null,
    filters.priceMax != null,
    filters.monthlyMin != null,
    filters.monthlyMax != null,
    filters.yearMin != null,
    filters.yearMax != null,
    filters.mileMin != null,
    filters.mileMax != null,
    filters.fuel,
    filters.transmission,
    filters.color,
    filters.seats != null,
    filters.driveType,
    filters.options,
    filters.region,
    filters.salesType,
    filters.keyword,
    filters.homeService,
    filters.timeDeal,
    filters.noAccident,
    filters.hasRental,
  ].filter(Boolean).length

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-border bg-card px-4 pb-4">
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
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
              />
            }
          >
            <SlidersHorizontal className="size-4" />
            필터
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-full sm:max-w-[400px] h-full overflow-y-auto">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
            </SheetHeader>
            <div className="p-4 pb-24">
              <FilterContent totalCount={totalCount} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
