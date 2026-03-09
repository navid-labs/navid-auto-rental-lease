'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { getBrands, getModelsByBrand } from '@/features/vehicles/actions/get-cascade-data'

type BrandOption = { id: string; name: string; nameKo: string | null }
type ModelOption = { id: string; name: string; nameKo: string | null }

export function HeroSection() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getBrands().then(setBrands)
  }, [])

  function handleBrandChange(brandId: string) {
    setSelectedBrand(brandId)
    setSelectedModel('')
    setModels([])
    if (brandId) {
      startTransition(async () => {
        const result = await getModelsByBrand(brandId)
        setModels(result)
      })
    }
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)
    if (selectedModel) params.set('model', selectedModel)
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <section
      className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-primary px-4 py-20 md:min-h-[60vh] md:py-28"
      style={{
        background:
          'linear-gradient(135deg, hsl(220 50% 12%) 0%, hsl(220 50% 15%) 50%, hsl(220 45% 18%) 100%)',
      }}
    >
      {/* Radial accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, hsla(217 91% 60% / 0.08), transparent)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
          프리미엄 중고차
          <br />
          <span className="text-accent">렌탈 &amp; 리스</span>
        </h1>
        <p className="mt-4 text-base text-white/70 md:mt-6 md:text-lg">
          Navid Auto에서 시작하세요.
          <br className="hidden sm:block" />
          온라인으로 간편하게 비교하고 계약까지 완료하세요.
        </p>

        {/* Glassmorphism quick search widget */}
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md md:mt-10 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="" className="bg-primary text-white">
                브랜드
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-primary text-white">
                  {b.nameKo || b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedBrand || isPending}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
            >
              <option value="" className="bg-primary text-white">
                모델
              </option>
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-primary text-white">
                  {m.nameKo || m.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleSearch}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30"
            >
              차량 검색
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
