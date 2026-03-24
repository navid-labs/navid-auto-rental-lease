'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { listBrands, listModelsByBrand } from '@/lib/api/generated/vehicles/vehicles'
import type { Brand, CarModel } from '@/lib/api/generated/navidAutoRentalLeaseAPI.schemas'

type BrandOption = Brand
type ModelOption = CarModel

type SearchTab = '제조사/모델' | '예산' | '차종'
const TABS: SearchTab[] = ['제조사/모델', '예산', '차종']

const BODY_TYPES = ['세단', 'SUV', '해치백', 'MPV', '쿠페', '컨버터블'] as const
const BUDGET_RANGES = [
  { label: '30만원 이하', value: '300000' },
  { label: '40만원 이하', value: '400000' },
  { label: '50만원 이하', value: '500000' },
  { label: '70만원 이하', value: '700000' },
  { label: '100만원 이하', value: '1000000' },
] as const

export function HeroSearchBox() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('제조사/모델')
  const [selectedBudget, setSelectedBudget] = useState('')
  const [selectedBodyType, setSelectedBodyType] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    listBrands().then((response) => setBrands(response.data.data ?? []))
  }, [])

  function handleBrandChange(brandId: string) {
    setSelectedBrand(brandId)
    setSelectedModel('')
    setModels([])
    if (brandId) {
      startTransition(async () => {
        const response = await listModelsByBrand(brandId)
        setModels(response.data.data ?? [])
      })
    }
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (activeTab === '제조사/모델') {
      if (selectedBrand) params.set('brand', selectedBrand)
      if (selectedModel) params.set('model', selectedModel)
    } else if (activeTab === '예산') {
      if (selectedBudget) params.set('maxMonthly', selectedBudget)
    } else if (activeTab === '차종') {
      if (selectedBodyType) {
        const bodyTypeMap: Record<string, string> = {
          세단: 'SEDAN',
          SUV: 'SUV',
          해치백: 'HATCHBACK',
          MPV: 'MPV',
          쿠페: 'COUPE',
          컨버터블: 'CONVERTIBLE',
        }
        params.set('bodyType', bodyTypeMap[selectedBodyType] ?? selectedBodyType)
      }
    }
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <section className="bg-white py-10 md:py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-8 text-center text-[18px] font-bold text-[#0D0D0D]">
          어떤 차를 찾으세요?
        </h2>
        <div className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-[#E0E0E0]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 px-4 py-3 text-sm font-semibold transition-colors first:rounded-tl-2xl last:rounded-tr-2xl"
                  style={
                    isActive
                      ? { background: '#1A6DFF', color: '#ffffff' }
                      : { background: '#F4F4F4', color: '#555555' }
                  }
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Filter area */}
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center">
            {/* Brand/Model tab */}
            {activeTab === '제조사/모델' && (
              <>
                <div className="relative flex-1">
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none transition focus:border-[#1A6DFF] focus:ring-1 focus:ring-[#1A6DFF]"
                    style={{
                      background: '#F8F8F8',
                      borderColor: '#E0E0E0',
                      color: selectedBrand ? '#0D0D0D' : '#999999',
                      height: '44px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="" style={{ color: '#999999' }}>
                      브랜드 선택
                    </option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} style={{ color: '#0D0D0D' }}>
                        {b.nameKo || b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: '#999999' }}
                  />
                </div>

                <div className="relative flex-1">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedBrand || isPending}
                    className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none transition focus:border-[#1A6DFF] focus:ring-1 focus:ring-[#1A6DFF] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: '#F8F8F8',
                      borderColor: '#E0E0E0',
                      color: selectedModel ? '#0D0D0D' : '#999999',
                      height: '44px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="" style={{ color: '#999999' }}>
                      {isPending ? '로딩 중...' : '모델 선택'}
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id} style={{ color: '#0D0D0D' }}>
                        {m.nameKo || m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: '#999999' }}
                  />
                </div>
              </>
            )}

            {/* Budget tab */}
            {activeTab === '예산' && (
              <div className="relative flex-1">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none transition focus:border-[#1A6DFF] focus:ring-1 focus:ring-[#1A6DFF]"
                  style={{
                    background: '#F8F8F8',
                    borderColor: '#E0E0E0',
                    color: selectedBudget ? '#0D0D0D' : '#999999',
                    height: '44px',
                    borderRadius: '8px',
                  }}
                >
                  <option value="" style={{ color: '#999999' }}>
                    월 예산 선택
                  </option>
                  {BUDGET_RANGES.map((r) => (
                    <option key={r.value} value={r.value} style={{ color: '#0D0D0D' }}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: '#999999' }}
                />
              </div>
            )}

            {/* Body type tab */}
            {activeTab === '차종' && (
              <div className="relative flex-1">
                <select
                  value={selectedBodyType}
                  onChange={(e) => setSelectedBodyType(e.target.value)}
                  className="w-full appearance-none rounded-lg border px-4 pr-9 text-sm outline-none transition focus:border-[#1A6DFF] focus:ring-1 focus:ring-[#1A6DFF]"
                  style={{
                    background: '#F8F8F8',
                    borderColor: '#E0E0E0',
                    color: selectedBodyType ? '#0D0D0D' : '#999999',
                    height: '44px',
                    borderRadius: '8px',
                  }}
                >
                  <option value="" style={{ color: '#999999' }}>
                    차종 선택
                  </option>
                  {BODY_TYPES.map((bt) => (
                    <option key={bt} value={bt} style={{ color: '#0D0D0D' }}>
                      {bt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: '#999999' }}
                />
              </div>
            )}

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                background: '#1A6DFF',
                width: '140px',
                height: '44px',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              <Search className="h-4 w-4" />
              검색
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
