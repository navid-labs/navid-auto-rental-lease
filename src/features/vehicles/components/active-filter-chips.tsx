'use client'

import { useQueryStates } from 'nuqs'
import { searchParamsParsers } from '../lib/search-params'
import { X } from 'lucide-react'

type FilterChip = {
  key: string
  label: string
  clearValue: Record<string, string | number | null>
}

type ActiveFilterChipsProps = {
  labels?: {
    brandName?: string
    modelName?: string
    genName?: string
  }
}

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: '가솔린',
  DIESEL: '디젤',
  LPG: 'LPG',
  HYBRID: '하이브리드',
  ELECTRIC: '전기',
  HYDROGEN: '수소',
}

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: '자동',
  MANUAL: '수동',
  CVT: 'CVT',
  DCT: 'DCT',
}

const DRIVE_LABELS: Record<string, string> = {
  FWD: '전륜',
  RWD: '후륜',
  AWD: '4륜',
  '4WD': '사륜',
}

const COLOR_LABELS: Record<string, string> = {
  white: '흰색',
  black: '검정',
  silver: '실버',
  gray: '회색',
  red: '빨강',
  blue: '파랑',
  navy: '네이비',
  brown: '갈색',
  green: '초록',
  beige: '베이지',
  yellow: '노랑',
  other: '기타',
}

const SALES_LABELS: Record<string, string> = {
  rental: '렌탈',
  lease: '리스',
  general: '일반매매',
}

function buildChips(
  filters: Record<string, unknown>,
  labels?: ActiveFilterChipsProps['labels']
): FilterChip[] {
  const chips: FilterChip[] = []

  if (filters.brand && labels?.brandName) {
    chips.push({
      key: 'brand',
      label: labels.brandName,
      clearValue: { brand: '', model: '', gen: '' },
    })
  }

  if (filters.model && labels?.modelName) {
    chips.push({
      key: 'model',
      label: labels.modelName,
      clearValue: { model: '', gen: '' },
    })
  }

  if (filters.gen && labels?.genName) {
    chips.push({
      key: 'gen',
      label: labels.genName,
      clearValue: { gen: '' },
    })
  }

  if (filters.priceMin != null || filters.priceMax != null) {
    const min = (filters.priceMin as number) ?? 0
    const max = (filters.priceMax as number) ?? null
    chips.push({
      key: 'price',
      label: max ? `${min.toLocaleString()}~${max.toLocaleString()}만원` : `${min.toLocaleString()}만원~`,
      clearValue: { priceMin: null, priceMax: null },
    })
  }

  if (filters.monthlyMin != null || filters.monthlyMax != null) {
    const min = (filters.monthlyMin as number) ?? 0
    const max = (filters.monthlyMax as number) ?? null
    chips.push({
      key: 'monthly',
      label: max
        ? `월 ${min.toLocaleString()}~${max.toLocaleString()}원`
        : `월 ${min.toLocaleString()}원~`,
      clearValue: { monthlyMin: null, monthlyMax: null },
    })
  }

  if (filters.yearMin != null || filters.yearMax != null) {
    const min = (filters.yearMin as number) ?? ''
    const max = (filters.yearMax as number) ?? ''
    chips.push({
      key: 'year',
      label: `${min}~${max}년`,
      clearValue: { yearMin: null, yearMax: null },
    })
  }

  if (filters.mileMin != null || filters.mileMax != null) {
    const min = (filters.mileMin as number) ?? 0
    const max = (filters.mileMax as number) ?? null
    chips.push({
      key: 'mileage',
      label: max
        ? `${min.toLocaleString()}~${max.toLocaleString()}km`
        : `${min.toLocaleString()}km~`,
      clearValue: { mileMin: null, mileMax: null },
    })
  }

  if (filters.fuel) {
    const values = (filters.fuel as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `fuel-${v}`,
        label: FUEL_LABELS[v] ?? v,
        clearValue: {
          fuel: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.transmission) {
    const values = (filters.transmission as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `transmission-${v}`,
        label: TRANSMISSION_LABELS[v] ?? v,
        clearValue: {
          transmission: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.color) {
    const values = (filters.color as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `color-${v}`,
        label: COLOR_LABELS[v] ?? v,
        clearValue: {
          color: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.seats != null) {
    chips.push({
      key: 'seats',
      label: `${filters.seats}인승`,
      clearValue: { seats: null },
    })
  }

  if (filters.driveType) {
    const values = (filters.driveType as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `drive-${v}`,
        label: DRIVE_LABELS[v] ?? v,
        clearValue: {
          driveType: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.options) {
    const values = (filters.options as string).split(',')
    const optionLabels: Record<string, string> = {
      sunroof: '선루프',
      navigation: '내비게이션',
      rearCamera: '후방카메라',
      heatedSeat: '열선시트',
      ventilatedSeat: '통풍시트',
      smartKey: '스마트키',
      cruiseControl: '크루즈 컨트롤',
      dashCam: '블랙박스',
    }
    values.forEach((v) => {
      chips.push({
        key: `option-${v}`,
        label: optionLabels[v] ?? v,
        clearValue: {
          options: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.region) {
    chips.push({
      key: 'region',
      label: filters.region as string,
      clearValue: { region: '' },
    })
  }

  if (filters.salesType) {
    const values = (filters.salesType as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `sales-${v}`,
        label: SALES_LABELS[v] ?? v,
        clearValue: {
          salesType: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  if (filters.keyword) {
    const values = (filters.keyword as string).split(',')
    values.forEach((v) => {
      chips.push({
        key: `keyword-${v}`,
        label: v,
        clearValue: {
          keyword: values.filter((x) => x !== v).join(','),
        },
      })
    })
  }

  // Quick filter toggles
  if (filters.homeService === 'true') {
    chips.push({
      key: 'homeService',
      label: '무료배송',
      clearValue: { homeService: '' },
    })
  }

  if (filters.timeDeal === 'true') {
    chips.push({
      key: 'timeDeal',
      label: '타임딜',
      clearValue: { timeDeal: '' },
    })
  }

  if (filters.noAccident === 'true') {
    chips.push({
      key: 'noAccident',
      label: '무사고',
      clearValue: { noAccident: '' },
    })
  }

  if (filters.hasRental === 'true') {
    chips.push({
      key: 'hasRental',
      label: '렌트가능',
      clearValue: { hasRental: '' },
    })
  }

  return chips
}

export function ActiveFilterChips({ labels }: ActiveFilterChipsProps = {}) {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  })

  const chips = buildChips(filters as Record<string, unknown>, labels)

  if (chips.length === 0) return null

  const handleClearAll = () => {
    setFilters({
      brand: '',
      model: '',
      gen: '',
      priceMin: null,
      priceMax: null,
      monthlyMin: null,
      monthlyMax: null,
      yearMin: null,
      yearMax: null,
      mileMin: null,
      mileMax: null,
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
      page: 1,
    })
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
        >
          {chip.label}
          <button
            type="button"
            aria-label="필터 제거"
            onClick={() => setFilters({ ...chip.clearValue, page: 1 })}
            className="ml-0.5 flex size-4 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={handleClearAll}
        className="text-xs text-accent hover:underline cursor-pointer"
      >
        모두 해제
      </button>
    </div>
  )
}
